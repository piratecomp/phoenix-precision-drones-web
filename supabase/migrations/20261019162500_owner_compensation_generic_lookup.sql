CREATE OR REPLACE FUNCTION public.ppd_get_owner_compensation_setup()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE v public.ppd_owner_compensation_setup%rowtype;
BEGIN
 IF NOT public.portal_current_user_has_role('owner') THEN
   RAISE EXCEPTION 'PPD owner access required' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v FROM public.ppd_owner_compensation_setup
 WHERE owner_user_id=public.portal_current_public_user_id() LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'status','missing'); END IF;
 RETURN jsonb_build_object('ok',true,'status',v.status,'owner_user_id',v.owner_user_id,
  'pilot_hourly_rate_proposal',v.pilot_hourly_rate_proposal,'profit_cash_target',v.profit_cash_target,
  'reserve_months',v.reserve_months,'pilot_payment_method',v.pilot_payment_method,
  'distribution_method',v.distribution_method,'tax_treatment',v.tax_treatment,
  'payroll_enabled',v.payroll_enabled,'distributions_enabled',v.distributions_enabled,
  'notes',v.notes);
END;
$fn$;
REVOKE ALL ON FUNCTION public.ppd_get_owner_compensation_setup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_owner_compensation_setup() TO authenticated, service_role;
