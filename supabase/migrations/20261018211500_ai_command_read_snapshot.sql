CREATE OR REPLACE FUNCTION public.ppd_get_ai_command_dashboard()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin')) THEN
    RAISE EXCEPTION 'PPD AI command access denied' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object(
    'ok',true,
    'cycle',public.ppd_ai_cycle_status(),
    'autopilot',public.ppd_ai_autopilot_status(),
    'gateway',public.ppd_ai_gateway_status(),
    'department',public.ppd_ai_department_orchestrator_status(),
    'generated_at',now()
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ppd_get_ai_command_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ppd_get_ai_command_dashboard() TO authenticated, service_role;
