CREATE OR REPLACE FUNCTION public.ppd_get_maintenance_dashboard_state()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('maintenance')) THEN
    RAISE EXCEPTION 'PPD maintenance dashboard access denied' USING ERRCODE='42501';
  END IF;
  RETURN public.ppd_maintenance_ai_bridge_status();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ppd_get_maintenance_dashboard_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_maintenance_dashboard_state() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ppd_get_maintenance_bridge_detail(text,uuid) TO authenticated;
