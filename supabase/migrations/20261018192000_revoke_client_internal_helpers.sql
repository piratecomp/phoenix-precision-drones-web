-- Internal helpers are invoked by trusted definer functions and workers, not portal clients.
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname = ANY(ARRAY['ppd_add_payroll_check','ppd_classify_all_funding_fit','ppd_classify_funding_fit','ppd_clear_payroll_preflight_checks','ppd_enforce_funding_go_gate','ppd_enforce_payroll_batch_gate','ppd_generate_contractor_payout_draft','ppd_generate_employee_payroll_draft','ppd_payroll_rate_status','ppd_refresh_all_funding_readiness','ppd_refresh_funding_readiness','ppd_review_payroll_tax_rates','ppd_run_payroll_preflight','ppd_sync_contractor_payroll_workers','ppd_sync_funding_opportunity_compat','ppd_sync_payroll_finance_control_items','ppd_sync_payroll_worker_profiles','ppd_sync_w2_payroll_workers'])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', f.proname, f.args);
  END LOOP;
END $$;
