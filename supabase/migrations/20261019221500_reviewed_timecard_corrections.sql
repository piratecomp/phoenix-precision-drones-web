CREATE OR REPLACE FUNCTION public.ppd_correct_payroll_timecard_minutes(p_card_type text,p_card_id uuid,p_minutes integer,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE v_start timestamp; v_end timestamp; v_break numeric; v_old numeric; v_status text; v_period uuid; v_max numeric;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  IF p_card_type NOT IN ('w2','contract') OR p_minutes IS NULL OR p_minutes<1 OR length(trim(coalesce(p_reason,'')))<12 THEN
    RAISE EXCEPTION 'Timecard type, positive minutes, and correction reason required' USING ERRCODE='22023';
  END IF;
  IF p_card_type='w2' THEN
    SELECT clock_in,clock_out,coalesce(break_minutes,0),total_minutes,timecard_status
    INTO v_start,v_end,v_break,v_old,v_status FROM public.employee_time_entries WHERE id=p_card_id FOR UPDATE;
  ELSE
    SELECT clock_in,clock_out,coalesce(break_minutes,0),total_hours*60,timecard_status
    INTO v_start,v_end,v_break,v_old,v_status FROM public.pilot_time_cards WHERE id=p_card_id FOR UPDATE;
  END IF;
  IF v_start IS NULL OR v_end IS NULL OR v_end<=v_start OR v_status IN ('drafted','paid','locked') THEN
    RAISE EXCEPTION 'Only closed, undrafted timecards can be corrected' USING ERRCODE='22023';
  END IF;
  v_max:=extract(epoch FROM (v_end-v_start))/60-v_break;
  IF p_minutes>v_max OR v_max<=0 THEN RAISE EXCEPTION 'Minutes exceed clocked time after breaks' USING ERRCODE='22023'; END IF;
  SELECT id INTO v_period FROM public.payroll_periods WHERE v_start::date BETWEEN start_date AND end_date
    AND status IN ('open','time_review','pending') ORDER BY start_date DESC LIMIT 1;
  IF v_period IS NULL THEN RAISE EXCEPTION 'No open period for timecard correction' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.payroll_payment_batches WHERE payroll_period_id=v_period AND owner_approved_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Payroll already authorized for this period' USING ERRCODE='22023';
  END IF;
  IF p_card_type='w2' THEN
    UPDATE public.employee_time_entries SET total_minutes=p_minutes,approved=false,approval_status='needs_review',approved_by=NULL,approved_at=NULL,updated_at=now()
    WHERE id=p_card_id;
  ELSE
    UPDATE public.pilot_time_cards SET total_hours=round(p_minutes::numeric/60,4),approved=false,approval_status='needs_review',approved_by=NULL,approved_at=NULL,updated_at=now()
    WHERE id=p_card_id;
  END IF;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note,details)
  VALUES(v_period,'timecard_minutes_corrected',p_card_id,public.portal_current_public_user_id(),left(trim(p_reason),1000),
    jsonb_build_object('old_minutes',v_old,'new_minutes',p_minutes,'card_type',p_card_type));
  RETURN jsonb_build_object('ok',true,'period_id',v_period,'new_minutes',p_minutes,'requires_reapproval',true,'no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_correct_payroll_timecard_minutes(text,uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_correct_payroll_timecard_minutes(text,uuid,integer,text) TO authenticated,service_role;
