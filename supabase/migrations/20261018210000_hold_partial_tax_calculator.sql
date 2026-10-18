-- The tax calculator is partial and records an explicit federal withholding hold. Keep it internal until the full engine is verified.
REVOKE EXECUTE ON FUNCTION public.ppd_apply_draft_tax_rates_to_period(uuid) FROM authenticated;
