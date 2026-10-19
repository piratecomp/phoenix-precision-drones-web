ALTER TABLE public.ppd_payroll_change_requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.ppd_payroll_change_requests ADD COLUMN IF NOT EXISTS resolution_note text;

CREATE OR REPLACE FUNCTION public.ppd_mark_payroll_batch_owner_approved(p_payment_batch_id uuid,p_owner_id uuid DEFAULT auth.uid())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE b public.payroll_payment_batches%rowtype; v_gate jsonb;
BEGIN
  IF NOT public.portal_current_user_has_role('owner') THEN RAISE EXCEPTION 'Active owner required' USING ERRCODE='42501'; END IF;
  IF p_owner_id IS NOT NULL AND p_owner_id NOT IN (auth.uid(),public.portal_current_public_user_id()) THEN
    RAISE EXCEPTION 'Owner identity mismatch' USING ERRCODE='42501';
  END IF;
  SELECT * INTO b FROM public.payroll_payment_batches WHERE id=p_payment_batch_id FOR UPDATE;
  IF NOT FOUND OR b.paid_at IS NOT NULL OR b.owner_approved_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'error','batch_absent_or_already_approved');
  END IF;
  IF coalesce(b.metadata->>'manual_hold_reason','')<>'' THEN
    RETURN jsonb_build_object('ok',false,'error','batch_manually_held');
  END IF;
  IF EXISTS (SELECT 1 FROM public.ppd_payroll_change_requests r WHERE r.payroll_period_id=b.payroll_period_id
    AND (r.status='pending_review' OR (r.status='approved_for_recalculation' AND r.resolved_at IS NULL))) THEN
    RETURN jsonb_build_object('ok',false,'error','payroll_changes_unresolved');
  END IF;
  v_gate:=public.ppd_enforce_payroll_batch_gate(p_payment_batch_id);
  IF coalesce(v_gate->>'batch_status','blocked')<>'ready_for_owner_approval' THEN
    RETURN jsonb_build_object('ok',false,'error','batch_not_ready_for_owner_approval','gate',v_gate);
  END IF;
  UPDATE public.payroll_payment_batches SET batch_status='owner_approved_hold_for_provider',
    owner_approved_by=public.portal_current_public_user_id(),owner_approved_at=now(),updated_at=now(),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('owner_approved_hold_only',true,'no_money_movement',true)
  WHERE id=b.id;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id)
  VALUES(b.payroll_period_id,'owner_authorized_hold_only',b.id,public.portal_current_public_user_id());
  RETURN jsonb_build_object('ok',true,'payment_batch_id',b.id,'batch_status','owner_approved_hold_for_provider','no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_mark_payroll_batch_owner_approved(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_mark_payroll_batch_owner_approved(uuid,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.ppd_release_payroll_batch_hold(p_batch_id uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE b public.payroll_payment_batches%rowtype;
BEGIN
  IF NOT public.portal_current_user_has_role('owner') THEN RAISE EXCEPTION 'Active owner required' USING ERRCODE='42501'; END IF;
  IF length(trim(coalesce(p_reason,'')))<8 THEN RAISE EXCEPTION 'Release reason required' USING ERRCODE='22023'; END IF;
  SELECT * INTO b FROM public.payroll_payment_batches WHERE id=p_batch_id FOR UPDATE;
  IF NOT FOUND OR b.batch_status IN ('paid','closed') OR b.paid_at IS NOT NULL OR coalesce(b.metadata->>'manual_hold_reason','')='' THEN
    RAISE EXCEPTION 'No releasable manual hold' USING ERRCODE='22023';
  END IF;
  UPDATE public.payroll_payment_batches SET batch_status='draft_blocked',metadata=(metadata-'manual_hold_reason'),updated_at=now() WHERE id=b.id;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note)
  VALUES(b.payroll_period_id,'batch_hold_released',b.id,public.portal_current_public_user_id(),left(trim(p_reason),1000));
  RETURN jsonb_build_object('ok',true,'batch_id',b.id,'status','draft_blocked','requires_new_review',true,'no_money_movement',true);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.ppd_resolve_payroll_change(p_request_id uuid,p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE r public.ppd_payroll_change_requests%rowtype;
BEGIN
  IF NOT public.portal_current_user_has_role('owner') THEN RAISE EXCEPTION 'Active owner required' USING ERRCODE='42501'; END IF;
  IF length(trim(coalesce(p_note,'')))<12 THEN RAISE EXCEPTION 'Describe the correction and new draft' USING ERRCODE='22023'; END IF;
  SELECT * INTO r FROM public.ppd_payroll_change_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR r.status<>'approved_for_recalculation' OR r.resolved_at IS NOT NULL THEN
    RAISE EXCEPTION 'Request not awaiting recalculation' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payroll_payment_batches b WHERE b.payroll_period_id=r.payroll_period_id
    AND b.created_at>r.reviewed_at AND b.item_count>0 AND b.paid_at IS NULL) THEN
    RAISE EXCEPTION 'Prepare a new, nonempty draft after approval before resolving' USING ERRCODE='22023';
  END IF;
  UPDATE public.ppd_payroll_change_requests SET resolved_at=now(),resolution_note=left(trim(p_note),1000) WHERE id=r.id;
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,target_id,actor_id,note)
  VALUES(r.payroll_period_id,'change_resolved_after_redraft',r.id,public.portal_current_public_user_id(),left(trim(p_note),1000));
  RETURN jsonb_build_object('ok',true,'request_id',r.id,'requires_owner_review',true,'no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_release_payroll_batch_hold(uuid,text),public.ppd_resolve_payroll_change(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_release_payroll_batch_hold(uuid,text),public.ppd_resolve_payroll_change(uuid,text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.ppd_get_payroll_review_flags(p_period_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object(
    'changes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'resolved_at',resolved_at,'resolution_note',resolution_note))
      FROM public.ppd_payroll_change_requests WHERE payroll_period_id=p_period_id),'[]'::jsonb),
    'batches',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'manual_hold_reason',metadata->>'manual_hold_reason'))
      FROM public.payroll_payment_batches WHERE payroll_period_id=p_period_id),'[]'::jsonb)
  );
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_get_payroll_review_flags(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_payroll_review_flags(uuid) TO authenticated,service_role;
