-- Owner compensation planning; no W-2 designation, payable, transfer, or payroll execution.
CREATE TABLE IF NOT EXISTS public.ppd_owner_compensation_setup (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_user_id uuid NOT NULL UNIQUE REFERENCES public.users(id),
 status text NOT NULL DEFAULT 'draft_tax_review' CHECK (status IN ('draft_tax_review','approved_configuration','retired')),
 tax_treatment text NOT NULL DEFAULT 'unconfirmed_trust_and_llc_chain',
 pilot_hourly_rate_proposal numeric(10,2) CHECK (pilot_hourly_rate_proposal >= 0),
 profit_cash_target numeric(5,4) CHECK (profit_cash_target BETWEEN 0 AND 1),
 reserve_months integer NOT NULL DEFAULT 3 CHECK (reserve_months BETWEEN 0 AND 24),
 pilot_payment_method text NOT NULL DEFAULT 'pending_tax_review',
 distribution_method text NOT NULL DEFAULT 'ppd_to_drh_then_trust_pending_review',
 payroll_enabled boolean NOT NULL DEFAULT false CHECK (payroll_enabled = false),
 distributions_enabled boolean NOT NULL DEFAULT false CHECK (distributions_enabled = false),
 approved_at timestamptz,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ppd_owner_compensation_setup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ppd_owner_compensation_setup FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ppd_owner_compensation_setup TO service_role;

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
