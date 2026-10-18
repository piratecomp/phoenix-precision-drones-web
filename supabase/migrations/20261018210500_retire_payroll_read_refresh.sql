-- Retire legacy read-refresh RPCs now that the finance dashboard uses the pure snapshot.
REVOKE EXECUTE ON FUNCTION public.ppd_get_payroll_control_panel(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ppd_sync_payroll_role_operations() FROM authenticated;
