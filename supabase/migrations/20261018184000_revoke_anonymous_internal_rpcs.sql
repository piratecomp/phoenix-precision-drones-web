-- Keep only intentionally public preview, configuration, and intake endpoints.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.prosecdef
      AND p.proname ~ '^(ppd_|portal_)'
      AND p.proname NOT IN (
        'portal_get_public_dashboard_preview',
        'portal_get_public_feature_flags',
        'portal_get_runtime_config',
        'ppd_customer_submit_quote_intake',
        'ppd_submit_pilot_application',
        'ppd_submit_quote_intake'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon', f.proname, f.args);
  END LOOP;
END $$;
