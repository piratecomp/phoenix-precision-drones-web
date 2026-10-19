-- Protected payroll work queue. Review actions never settle payments or file taxes.
CREATE TABLE IF NOT EXISTS public.ppd_payroll_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id uuid REFERENCES public.payroll_periods(id),
  action text NOT NULL,
  target_id uuid,
  actor_id uuid,
  note text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ppd_payroll_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id),
  worker_profile_id uuid REFERENCES public.payroll_worker_profiles(id),
  category text NOT NULL CHECK (category IN ('timecard','pay_rate','tax_inputs','other')),
  proposed_change text NOT NULL CHECK (length(proposed_change) BETWEEN 12 AND 2000),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved_for_recalculation','rejected')),
  requested_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ppd_payroll_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppd_payroll_change_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ppd_payroll_review_events,public.ppd_payroll_change_requests FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS ppd_payroll_change_requests_period_idx ON public.ppd_payroll_change_requests(payroll_period_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ppd_payroll_review_events_period_idx ON public.ppd_payroll_review_events(payroll_period_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.ppd_get_payroll_workspace(p_payroll_period_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE p public.payroll_periods%rowtype;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  IF p_payroll_period_id IS NULL THEN
    SELECT * INTO p FROM public.payroll_periods ORDER BY
      CASE WHEN current_date BETWEEN start_date AND end_date THEN 0 ELSE 1 END,start_date DESC LIMIT 1;
  ELSE
    SELECT * INTO p FROM public.payroll_periods WHERE id=p_payroll_period_id;
  END IF;
  RETURN jsonb_build_object(
    'period',CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('id',p.id,'start_date',p.start_date,'end_date',p.end_date,'pay_date',p.pay_date,
      'pay_periods_per_year',p.pay_periods_per_year,'status',p.status,'preflight_status',p.preflight_status,'preflight_score',p.preflight_score,
      'owner_approved_at',p.owner_approved_at,'finance_approved_at',p.finance_approved_at,'hr_approved_at',p.hr_approved_at) END,
    'periods',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'start_date',q.start_date,'end_date',q.end_date,'status',q.status) ORDER BY q.start_date DESC)
      FROM (SELECT * FROM public.payroll_periods ORDER BY start_date DESC LIMIT 16) q),'[]'::jsonb),
    'timecards',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.clock_in DESC) FROM (
      SELECT e.id,'w2'::text AS card_type,w.display_name,e.clock_in,e.clock_out,e.total_minutes,e.approved,e.timecard_status
      FROM public.employee_time_entries e LEFT JOIN public.payroll_worker_profiles w ON w.employee_profile_id IN
        (SELECT ep.id FROM public.employee_profiles ep WHERE ep.user_id=e.user_id)
      WHERE e.clock_in::date BETWEEN p.start_date AND p.end_date
      UNION ALL
      SELECT t.id,'contract'::text,w.display_name,t.clock_in,t.clock_out,round(t.total_hours*60)::integer,t.approved,t.timecard_status
      FROM public.pilot_time_cards t LEFT JOIN public.payroll_worker_profiles w ON w.pilot_id=t.pilot_id
      WHERE t.clock_in::date BETWEEN p.start_date AND p.end_date
      ORDER BY clock_in DESC LIMIT 60
    ) t),'[]'::jsonb),
    'entries',coalesce((SELECT jsonb_agg(jsonb_build_object('id',e.id,'worker',w.display_name,'gross',e.gross_pay,'net',e.net_pay,
       'federal',e.federal_withholding,'az',e.state_withholding,'social_security',e.social_security_employee,
       'medicare',e.medicare_employee,'futa',e.futa_employer,'status',e.payroll_tax_calculation_status,
       'hold_reason',e.tax_calculation_metadata->>'hold_reason') ORDER BY w.display_name)
       FROM public.payroll_entries e LEFT JOIN public.payroll_worker_profiles w ON w.id=e.worker_profile_id
       WHERE e.payroll_period_id=p.id),'[]'::jsonb),
    'batches',coalesce((SELECT jsonb_agg(jsonb_build_object('id',b.id,'status',b.batch_status,'gross',b.gross_total,'net',b.net_total,
       'tax',b.tax_total,'item_count',b.item_count,'owner_approved_at',b.owner_approved_at) ORDER BY b.created_at DESC)
       FROM public.payroll_payment_batches b WHERE b.payroll_period_id=p.id),'[]'::jsonb),
    'changes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'category',r.category,'worker',w.display_name,'proposed_change',r.proposed_change,
       'status',r.status,'created_at',r.created_at,'review_note',r.review_note) ORDER BY r.created_at DESC)
       FROM public.ppd_payroll_change_requests r LEFT JOIN public.payroll_worker_profiles w ON w.id=r.worker_profile_id
       WHERE r.payroll_period_id=p.id),'[]'::jsonb),
    'tax_rates',coalesce((SELECT jsonb_agg(jsonb_build_object('type',r.tax_type,'jurisdiction',r.jurisdiction,'rate',r.rate,
       'status',r.verification_status,'source_url',r.source_url,'requires_external_table',r.requires_external_table) ORDER BY r.jurisdiction,r.tax_type)
       FROM public.payroll_tax_rate_versions r WHERE r.effective_start<=current_date AND (r.effective_end IS NULL OR r.effective_end>=current_date)),'[]'::jsonb),
    'audit',coalesce((SELECT jsonb_agg(jsonb_build_object('action',a.action,'note',a.note,'created_at',a.created_at) ORDER BY a.created_at DESC)
       FROM (SELECT * FROM public.ppd_payroll_review_events WHERE payroll_period_id=p.id ORDER BY created_at DESC LIMIT 20) a),'[]'::jsonb),
    'permissions',jsonb_build_object('owner',public.portal_current_user_has_role('owner'),'review',true),
    'no_money_movement',true
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.ppd_review_payroll_timecard(p_card_type text,p_card_id uuid,p_decision text,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE v_period uuid; v_start timestamp; v_end timestamp; v_minutes numeric; v_status text;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  IF p_card_type NOT IN ('w2','contract') OR p_decision NOT IN ('approve','hold') THEN
    RAISE EXCEPTION 'Invalid timecard review action' USING ERRCODE='22023';
  END IF;
  IF p_card_type='w2' THEN
    SELECT e.clock_in,e.clock_out,coalesce(e.total_minutes,public.ppd_minutes_between(e.clock_in,e.clock_out,e.break_minutes)),e.timecard_status
    INTO v_start,v_end,v_minutes,v_status FROM public.employee_time_entries e WHERE e.id=p_card_id FOR UPDATE;
  ELSE
    SELECT t.clock_in,t.clock_out,coalesce(t.total_hours*60,extract(epoch FROM (t.clock_out-t.clock_in))/60-coalesce(t.break_minutes,0)),t.timecard_status
    INTO v_start,v_end,v_minutes,v_status FROM public.pilot_time_cards t WHERE t.id=p_card_id FOR UPDATE;
  END IF;
  IF v_start IS NULL OR v_end IS NULL OR v_end<=v_start OR v_minutes<=0 OR v_status IN ('drafted','paid','locked') THEN
    RAISE EXCEPTION 'Timecard is incomplete or already drafted' USING ERRCODE='22023';
  END IF;
  SELECT id INTO v_period FROM public.payroll_periods WHERE v_start::date BETWEEN start_date AND end_date
    AND status IN ('open','time_review','pending') ORDER BY start_date DESC LIMIT 1;
  IF v_period IS NULL THEN RAISE EXCEPTION 'No open period for this timecard' USING ERRCODE='22023'; END IF;
  IF p_card_type='w2' THEN
    UPDATE public.employee_time_entries SET approved=(p_decision='approve'),approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'held' END,
      approved_by=public.portal_current_public_user_id(),approved_at=now(),updated_at=now() WHERE id=p_card_id;
  ELSE
    UPDATE public.pilot_time_cards SET approved=(p_decision='approve'),approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'held' END,
      approved_by=public.portal_current_public_user_id(),approved_at=now(),updated_at=now() WHERE id=p_card_id;
  END IF;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note)
  VALUES(v_period,'timecard_'||p_decision,p_card_id,public.portal_current_public_user_id(),left(p_note,1000));
  RETURN jsonb_build_object('ok',true,'period_id',v_period,'decision',p_decision,'no_money_movement',true);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.ppd_request_payroll_change(p_period_id uuid,p_worker_id uuid,p_category text,p_proposed_change text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE v_id uuid;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  IF p_category NOT IN ('timecard','pay_rate','tax_inputs','other') OR length(trim(coalesce(p_proposed_change,''))) NOT BETWEEN 12 AND 2000 THEN
    RAISE EXCEPTION 'Choose a category and describe the change in 12-2000 characters' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payroll_periods WHERE id=p_period_id AND status NOT IN ('paid','closed','locked')) OR
     (p_worker_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.payroll_worker_profiles WHERE id=p_worker_id)) THEN
    RAISE EXCEPTION 'Period closed or worker absent' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.ppd_payroll_change_requests(payroll_period_id,worker_profile_id,category,proposed_change,requested_by)
  VALUES(p_period_id,p_worker_id,p_category,trim(p_proposed_change),public.portal_current_public_user_id()) RETURNING id INTO v_id;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id)
  VALUES(p_period_id,'change_requested',v_id,public.portal_current_public_user_id());
  RETURN jsonb_build_object('ok',true,'request_id',v_id,'status','pending_review','no_money_movement',true);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.ppd_review_payroll_change(p_request_id uuid,p_decision text,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE r public.ppd_payroll_change_requests%rowtype;
BEGIN
  IF NOT public.portal_current_user_has_role('owner') THEN RAISE EXCEPTION 'Active owner required' USING ERRCODE='42501'; END IF;
  IF p_decision NOT IN ('approved_for_recalculation','rejected') OR length(trim(coalesce(p_note,'')))<8 THEN
    RAISE EXCEPTION 'Decision and review note required' USING ERRCODE='22023';
  END IF;
  SELECT * INTO r FROM public.ppd_payroll_change_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR r.status<>'pending_review' OR NOT EXISTS
     (SELECT 1 FROM public.payroll_periods WHERE id=r.payroll_period_id AND status NOT IN ('paid','closed','locked')) THEN
    RAISE EXCEPTION 'Request absent, reviewed, or period closed' USING ERRCODE='22023';
  END IF;
  UPDATE public.ppd_payroll_change_requests SET status=p_decision,reviewed_by=public.portal_current_public_user_id(),
    reviewed_at=now(),review_note=left(trim(p_note),1000) WHERE id=r.id;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note)
  VALUES(r.payroll_period_id,'change_'||p_decision,r.id,public.portal_current_public_user_id(),left(trim(p_note),1000));
  RETURN jsonb_build_object('ok',true,'request_id',r.id,'status',p_decision,'requires_recalculation',p_decision='approved_for_recalculation','no_money_movement',true);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.ppd_hold_payroll_batch(p_batch_id uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE b public.payroll_payment_batches%rowtype;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'Payroll finance access denied' USING ERRCODE='42501';
  END IF;
  IF length(trim(coalesce(p_reason,'')))<8 THEN RAISE EXCEPTION 'Give a reason for the hold' USING ERRCODE='22023'; END IF;
  SELECT * INTO b FROM public.payroll_payment_batches WHERE id=p_batch_id FOR UPDATE;
  IF NOT FOUND OR b.batch_status IN ('paid','closed') OR b.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'Batch absent or already paid' USING ERRCODE='22023';
  END IF;
  UPDATE public.payroll_payment_batches SET batch_status='blocked',owner_approved_by=NULL,owner_approved_at=NULL,
    metadata=metadata||jsonb_build_object('manual_hold_reason',left(trim(p_reason),1000)),updated_at=now() WHERE id=b.id;
  UPDATE public.payroll_payment_items SET payment_status='hold',hold_reason=left(trim(p_reason),1000),updated_at=now()
  WHERE payment_batch_id=b.id AND payment_status NOT IN ('paid','settled');
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note)
  VALUES(b.payroll_period_id,'batch_held',b.id,public.portal_current_public_user_id(),left(trim(p_reason),1000));
  RETURN jsonb_build_object('ok',true,'batch_id',b.id,'status','blocked','no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_get_payroll_workspace(uuid),public.ppd_review_payroll_timecard(text,uuid,text,text),
  public.ppd_request_payroll_change(uuid,uuid,text,text),public.ppd_review_payroll_change(uuid,text,text),
  public.ppd_hold_payroll_batch(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_payroll_workspace(uuid),public.ppd_review_payroll_timecard(text,uuid,text,text),
  public.ppd_request_payroll_change(uuid,uuid,text,text),public.ppd_review_payroll_change(uuid,text,text),
  public.ppd_hold_payroll_batch(uuid,text) TO authenticated,service_role;
