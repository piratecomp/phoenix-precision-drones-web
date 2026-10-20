-- PPD AI prepares payroll in house. Bank settlement and tax remittance remain separate.
-- Until an explicit company workweek configuration exists, only complete Mon-Sun weeks
-- are supported. Reject boundary-crossing timecards rather than mispay overtime.
CREATE OR REPLACE FUNCTION public.ppd_generate_employee_payroll_draft(p_payroll_period_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE
  p public.payroll_periods%rowtype;
  r record;
  v_hours numeric;
  v_regular_hours numeric;
  v_overtime_hours numeric;
  v_rate numeric;
  v_regular_pay numeric;
  v_overtime_pay numeric;
  v_gross numeric;
  v_created integer := 0;
  v_skipped integer := 0;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  SELECT * INTO p FROM public.payroll_periods WHERE id=p_payroll_period_id FOR UPDATE;
  IF NOT FOUND OR p.status IN ('paid','closed','locked') THEN
    RAISE EXCEPTION 'Payroll period absent or closed' USING ERRCODE='22023';
  END IF;
  IF p.end_date-p.start_date<>6 OR extract(isodow FROM p.start_date)<>1 THEN
    RAISE EXCEPTION 'Employee draft requires a complete Monday-Sunday workweek' USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.employee_time_entries e
    WHERE e.clock_in < (p.end_date+1)::timestamp
      AND e.clock_out > p.start_date::timestamp
      AND (e.clock_in < p.start_date::timestamp OR e.clock_out > (p.end_date+1)::timestamp)
  ) THEN
    RAISE EXCEPTION 'Timecard crosses a workweek boundary; split and review it before drafting' USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.employee_time_entries e
    WHERE e.clock_in::date BETWEEN p.start_date AND p.end_date
      AND (e.clock_out IS NULL OR e.clock_out<=e.clock_in OR
           coalesce(e.total_minutes,public.ppd_minutes_between(e.clock_in,e.clock_out,e.break_minutes))<=0)
  ) THEN
    RAISE EXCEPTION 'Incomplete or invalid timecard in workweek' USING ERRCODE='22023';
  END IF;

  DELETE FROM public.payroll_entries
  WHERE payroll_period_id=p_payroll_period_id AND coalesce(draft_status,'draft')='draft';

  FOR r IN
    SELECT ep.id AS employee_profile_id,w.id AS worker_profile_id,ep.user_id,
           coalesce(ep.base_hourly_rate,w.hourly_rate,0) AS hourly_rate,
           coalesce(wcr.rate_per_100,0) AS comp_rate,
           sum(coalesce(e.total_minutes,public.ppd_minutes_between(e.clock_in,e.clock_out,e.break_minutes)))::numeric/60 AS total_hours
    FROM public.employee_time_entries e
    JOIN public.employee_profiles ep ON ep.user_id=e.user_id
    LEFT JOIN public.payroll_worker_profiles w ON w.employee_profile_id=ep.id
    LEFT JOIN public.workers_comp_rates wcr ON wcr.id=ep.workers_comp_rate_id
    WHERE e.clock_in::date BETWEEN p.start_date AND p.end_date
      AND e.clock_out IS NOT NULL AND coalesce(e.approved,false)
    GROUP BY ep.id,w.id,ep.user_id,ep.base_hourly_rate,w.hourly_rate,wcr.rate_per_100
  LOOP
    v_hours:=round(coalesce(r.total_hours,0),2);
    v_rate:=coalesce(r.hourly_rate,0);
    IF v_hours<=0 OR v_rate<=0 OR r.worker_profile_id IS NULL THEN
      v_skipped:=v_skipped+1;
      CONTINUE;
    END IF;
    v_regular_hours:=least(v_hours,40);
    v_overtime_hours:=greatest(v_hours-40,0);
    v_regular_pay:=round(v_regular_hours*v_rate,2);
    v_overtime_pay:=round(v_overtime_hours*v_rate*1.5,2);
    v_gross:=v_regular_pay+v_overtime_pay;
    INSERT INTO public.payroll_entries (
      employee_id,payroll_period_id,worker_profile_id,total_hours,regular_hours,overtime_hours,
      regular_pay,overtime_pay,gross_pay,tax_withheld,employee_tax_total,employer_tax_total,
      workers_comp_cost,net_pay,status,draft_status,draft_source,created_at,updated_at
    ) VALUES (
      r.user_id,p_payroll_period_id,r.worker_profile_id,v_hours,v_regular_hours,v_overtime_hours,
      v_regular_pay,v_overtime_pay,v_gross,NULL,NULL,NULL,
      public.ppd_workers_comp_estimate(v_gross,r.comp_rate),NULL,
      'draft_needs_tax_verification','draft','ppd_generate_employee_payroll_draft',now(),now()
    );
    UPDATE public.employee_time_entries
    SET payroll_period_id=p_payroll_period_id,timecard_status='drafted',approval_status='approved',updated_at=now()
    WHERE user_id=r.user_id AND clock_in::date BETWEEN p.start_date AND p.end_date
      AND clock_out IS NOT NULL AND coalesce(approved,false);
    v_created:=v_created+1;
  END LOOP;
  UPDATE public.payroll_periods
  SET w2_gross_total=coalesce((SELECT sum(gross_pay) FROM public.payroll_entries WHERE payroll_period_id=p.id AND coalesce(draft_status,'draft')='draft'),0),
      w2_net_total=0,w2_tax_total=0,status=CASE WHEN status='open' THEN 'draft' ELSE status END,updated_at=now()
  WHERE id=p.id;
  RETURN jsonb_build_object('ok',true,'payroll_period_id',p.id,'employee_entries_created',v_created,
    'skipped',v_skipped,'status','draft_needs_tax_verification','no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_generate_employee_payroll_draft(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppd_generate_employee_payroll_draft(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.ppd_set_weekly_pay_schedule(p_payroll_period_id uuid,p_pay_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE p public.payroll_periods%rowtype;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  SELECT * INTO p FROM public.payroll_periods WHERE id=p_payroll_period_id FOR UPDATE;
  IF NOT FOUND OR p.status IN ('paid','closed','locked') OR p.owner_approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'Payroll period absent, approved, or closed' USING ERRCODE='22023';
  END IF;
  IF p.end_date-p.start_date<>6 OR extract(isodow FROM p.start_date)<>1
     OR p_pay_date IS NULL OR p_pay_date<=p.end_date OR extract(year FROM p_pay_date)<>2026 THEN
    RAISE EXCEPTION 'Choose a 2026 pay date after a complete Monday-Sunday workweek' USING ERRCODE='22023';
  END IF;
  UPDATE public.payroll_periods SET pay_date=p_pay_date,pay_periods_per_year=52,updated_at=now()
  WHERE id=p.id;
  RETURN jsonb_build_object('ok',true,'payroll_period_id',p.id,'pay_date',p_pay_date,
    'pay_periods_per_year',52,'no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_set_weekly_pay_schedule(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_set_weekly_pay_schedule(uuid,date) TO authenticated,service_role;
