CREATE OR REPLACE FUNCTION public.ppd_recheck_payroll_tax_rules(p_period_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE v_review jsonb; v_status jsonb;
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_review:=public.ppd_review_payroll_tax_rates();
  v_status:=public.ppd_payroll_rate_status();
  INSERT INTO public.ppd_payroll_review_events(payroll_period_id,action,actor_id,note)
  VALUES(p_period_id,'tax_rule_status_rechecked',public.portal_current_public_user_id(),
    'Checked recorded tax-rate versions; no external source refresh or tax payment.');
  RETURN jsonb_build_object('ok',true,'review',v_review,'status',v_status,'external_source_refresh',false,'no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_recheck_payroll_tax_rules(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ppd_recheck_payroll_tax_rules(uuid) TO authenticated,service_role;
