CREATE OR REPLACE FUNCTION public.ppd_get_payroll_dashboard_state()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  c public.payroll_company_profile%rowtype;
  p public.payroll_periods%rowtype;
  v_checks jsonb := '[]'::jsonb;
  v_tax_ready boolean;
  v_provider_ready boolean;
  v_workers integer;
  v_open_cards integer := 0;
  v_unapproved_cards integer := 0;
  v_counts jsonb;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;

  SELECT * INTO c FROM public.payroll_company_profile ORDER BY created_at LIMIT 1;
  SELECT * INTO p FROM public.payroll_periods
  WHERE current_date BETWEEN start_date AND end_date
    AND status IN ('open','draft','time_review','pending')
  ORDER BY start_date DESC LIMIT 1;

  SELECT count(*) INTO v_workers FROM public.payroll_worker_profiles WHERE active IS TRUE;
  v_provider_ready := coalesce(c.payroll_provider_status IN ('connected','verified','ready'),false)
    AND EXISTS (SELECT 1 FROM public.payroll_provider_connections
                WHERE environment='production' AND connection_status IN ('connected','verified','ready')
                  AND last_verified_at IS NOT NULL);
  v_tax_ready := NOT EXISTS (
    SELECT 1 FROM unnest(ARRAY['social_security_employee','medicare_employee','income_tax_withholding','az_withholding_default']) AS needed(tax_type)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.payroll_tax_rate_versions r
      WHERE r.tax_type=needed.tax_type AND r.effective_start <= current_date
        AND (r.effective_end IS NULL OR r.effective_end >= current_date)
        AND r.verification_status IN ('verified','current')
        AND r.requires_external_table IS NOT TRUE
    )
  );

  IF p.id IS NOT NULL THEN
    SELECT (SELECT count(*) FROM public.employee_time_entries e WHERE e.clock_in::date BETWEEN p.start_date AND p.end_date AND e.clock_out IS NULL)
         + (SELECT count(*) FROM public.pilot_time_cards t WHERE t.clock_in::date BETWEEN p.start_date AND p.end_date AND t.clock_out IS NULL),
           (SELECT count(*) FROM public.employee_time_entries e WHERE e.clock_in::date BETWEEN p.start_date AND p.end_date AND e.clock_out IS NOT NULL AND coalesce(e.approved,false)=false)
         + (SELECT count(*) FROM public.pilot_time_cards t WHERE t.clock_in::date BETWEEN p.start_date AND p.end_date AND t.clock_out IS NOT NULL AND coalesce(t.approved,false)=false)
    INTO v_open_cards, v_unapproved_cards;
  END IF;

  IF coalesce(c.ein_status,'missing') NOT IN ('verified','complete') THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','company_ein_missing','severity','blocker','title','Company EIN unverified','next_step','Complete LLC formation and verify the EIN in company setup.'));
  END IF;
  IF coalesce(c.state_withholding_status,'missing') NOT IN ('verified','complete') THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','az_withholding_missing','severity','blocker','title','Arizona withholding unverified','next_step','Verify employer withholding setup before production payroll.'));
  END IF;
  IF NOT v_provider_ready THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','payroll_provider_missing','severity','blocker','title','Production payroll provider unavailable','next_step','Connect and verify a production provider after company setup.'));
  END IF;
  IF NOT v_tax_ready THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','tax_method_unverified','severity','blocker','title','Payroll tax method needs review','next_step','Verify current federal withholding tables and required tax rates before using draft calculations.'));
  END IF;
  IF p.id IS NULL THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','current_period_missing','severity','setup','title','No current payroll period','next_step','Open the current period when worker and company setup is ready.'));
  END IF;
  IF v_workers=0 THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','workers_missing','severity','setup','title','No active payroll workers','next_step','Complete W-2 or 1099 worker onboarding before drafting a batch.'));
  END IF;
  IF v_open_cards+v_unapproved_cards>0 THEN
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_key','timecards_not_ready','severity','blocker','title','Timecards need review','next_step','Close and approve timecards for the current period.'));
  END IF;

  v_counts := jsonb_build_object(
    'w2_workers',(SELECT count(*) FROM public.payroll_worker_profiles WHERE active AND worker_type='w2_employee'),
    'w2_ready',(SELECT count(*) FROM public.payroll_worker_profiles WHERE active AND worker_type='w2_employee' AND payroll_ready),
    'contract_workers',(SELECT count(*) FROM public.payroll_worker_profiles WHERE active AND worker_type IN ('1099_pilot','1099_contractor')),
    'contract_ready',(SELECT count(*) FROM public.payroll_worker_profiles WHERE active AND worker_type IN ('1099_pilot','1099_contractor') AND payroll_ready),
    'blockers',jsonb_array_length(v_checks),
    'open_timecards',v_open_cards,
    'unapproved_timecards',v_unapproved_cards
  );

  RETURN jsonb_build_object(
    'ok',true,'generated_at',now(),'readiness_status',CASE WHEN jsonb_array_length(v_checks)>0 THEN 'setup_blocked' ELSE 'ready_for_review' END,
    'readiness_checks',v_checks,'counts',v_counts,
    'company',jsonb_build_object('company_name',c.company_name,'legal_name',c.legal_name,'ein_status',coalesce(c.ein_status,'missing'),'state_withholding_status',coalesce(c.state_withholding_status,'missing'),'payroll_provider_status',coalesce(c.payroll_provider_status,'not_connected')),
    'provider',jsonb_build_object('production_connected',v_provider_ready,'connection_count',(SELECT count(*) FROM public.payroll_provider_connections WHERE environment='production')),
    'tax',jsonb_build_object('method_verified',v_tax_ready,'rates_needing_review',(SELECT count(*) FROM public.payroll_tax_rate_versions WHERE effective_start <= current_date AND (effective_end IS NULL OR effective_end >= current_date) AND (verification_status NOT IN ('verified','current') OR requires_external_table IS TRUE))),
    'active_period',CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('id',p.id,'start_date',p.start_date,'end_date',p.end_date,'status',p.status,'preflight_status',p.preflight_status) END,
    'workers',coalesce((SELECT jsonb_agg(jsonb_build_object('id',w.id,'display_name',w.display_name,'worker_type',w.worker_type,'payroll_ready',w.payroll_ready,'readiness_status',w.readiness_status,'readiness_score',w.readiness_score) ORDER BY w.worker_type,w.display_name) FROM public.payroll_worker_profiles w WHERE w.active), '[]'::jsonb),
    'can_prepare_draft',p.id IS NOT NULL AND v_workers>0 AND v_open_cards=0 AND v_unapproved_cards=0,
    'can_export_for_review',p.id IS NOT NULL AND EXISTS (SELECT 1 FROM public.payroll_payment_batches b WHERE b.payroll_period_id=p.id AND b.item_count>0 AND b.batch_status NOT IN ('paid','closed'))
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ppd_get_payroll_dashboard_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_payroll_dashboard_state() TO authenticated, service_role;
