-- Owner compensation configuration for a revocable grantor trust and
-- single-member LLC chain. This changes planning labels only; no payments.
ALTER TABLE public.ppd_owner_compensation_setup
  DROP CONSTRAINT IF EXISTS ppd_owner_compensation_setup_status_check;

ALTER TABLE public.ppd_owner_compensation_setup
  ADD CONSTRAINT ppd_owner_compensation_setup_status_check
  CHECK (status IN ('draft_tax_review', 'draft_owner_draw', 'approved_configuration', 'retired'));

COMMENT ON COLUMN public.ppd_owner_compensation_setup.pilot_hourly_rate_proposal IS
  'Planning rate for owner pilot hours and owner draws; never W-2 wages by itself.';
COMMENT ON COLUMN public.ppd_owner_compensation_setup.profit_cash_target IS
  'Planning target for owner distributions of available cash, not a payroll tax rate.';
