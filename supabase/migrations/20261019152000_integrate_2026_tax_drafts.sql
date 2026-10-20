-- Tax basis and opening YTD amounts require human verification; no automatic zero defaults.
ALTER TABLE public.payroll_periods ADD COLUMN IF NOT EXISTS pay_date date;
ALTER TABLE public.payroll_periods ADD COLUMN IF NOT EXISTS pay_periods_per_year integer;
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS opening_ytd_fica numeric;
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS opening_ytd_futa numeric;
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS opening_ytd_tax_year integer;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS federal_taxable_wages numeric;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS az_taxable_wages numeric;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS fica_taxable_wages numeric;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS futa_taxable_wages numeric;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS tax_basis_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.ppd_apply_draft_tax_rates_to_period(p_payroll_period_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $fn$
DECLARE
 p public.payroll_periods%rowtype; r record; t jsonb; v_ytd_fica numeric; v_ytd_futa numeric;
 v_updated integer:=0; v_held integer:=0; v_reason text;
BEGIN
 IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
   RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
 END IF;
 SELECT * INTO p FROM public.payroll_periods WHERE id=p_payroll_period_id FOR UPDATE;
 IF NOT FOUND OR p.status IN ('paid','closed','locked') THEN
   RAISE EXCEPTION 'Payroll period absent or closed' USING ERRCODE='22023';
 END IF;
 FOR r IN
   SELECT pe.*, ep.id AS profile_id, ep.tax_form_version, ep.federal_w4_status,
     ep.filing_status,ep.multiple_jobs,ep.fed_dependents_amount,ep.fed_other_income,
     ep.fed_deductions,ep.fed_extra_withholding,ep.az_withholding_percent,
     ep.az_extra_withholding,ep.arizona_a4_status,ep.tax_profile_status,
     ep.opening_ytd_fica,ep.opening_ytd_futa,ep.opening_ytd_tax_year
   FROM public.payroll_entries pe
   LEFT JOIN public.payroll_worker_profiles w ON w.id=pe.worker_profile_id
   LEFT JOIN public.employee_profiles ep ON ep.id=w.employee_profile_id
   WHERE pe.payroll_period_id=p_payroll_period_id AND coalesce(pe.draft_status,'draft')='draft'
   ORDER BY pe.id
 LOOP
   v_reason:=NULL;
   IF p.pay_date IS NULL OR extract(year from p.pay_date)<>2026 OR p.pay_periods_per_year IS NULL OR p.pay_periods_per_year NOT IN (12,24,26,52,260) THEN
     v_reason:='A verified 2026 pay date and pay frequency are required.';
   ELSIF r.profile_id IS NULL OR r.federal_w4_status NOT IN ('verified','complete')
      OR r.tax_profile_status NOT IN ('verified','complete')
      OR coalesce(r.tax_form_version,'') NOT IN ('2020_or_later','2020','2021','2022','2023','2024','2025','2026') THEN
     v_reason:='Verified 2020-or-later W-4 and tax profile required; legacy forms are held.';
   ELSIF lower(coalesce(r.filing_status,'')) NOT IN ('single','married_filing_jointly','head_of_household') OR r.multiple_jobs IS NULL THEN
     v_reason:='A supported, verified filing status and W-4 multiple-jobs choice are required.';
   ELSIF r.opening_ytd_tax_year IS DISTINCT FROM 2026 OR r.opening_ytd_fica IS NULL OR r.opening_ytd_futa IS NULL THEN
     v_reason:='Verified opening 2026 FICA and FUTA wages are required.';
   ELSIF NOT coalesce(r.tax_basis_verified,false) OR r.federal_taxable_wages IS NULL
      OR r.az_taxable_wages IS NULL OR r.fica_taxable_wages IS NULL OR r.futa_taxable_wages IS NULL
      OR r.fica_taxable_wages IS DISTINCT FROM r.gross_pay OR r.futa_taxable_wages IS DISTINCT FROM r.gross_pay THEN
     v_reason:='Taxable wage bases need verification; nonstandard FICA/FUTA bases require additional rules.';
   ELSIF r.az_withholding_percent IS NOT NULL AND r.arizona_a4_status NOT IN ('verified','complete') THEN
     v_reason:='Arizona A-4 election is unverified; clear election for statutory 2% default.';
   ELSIF r.az_withholding_percent IS NOT NULL AND r.az_withholding_percent NOT IN (0,0.005,0.01,0.015,0.02,0.025,0.03,0.035) THEN
     v_reason:='Arizona A-4 percentage is invalid.';
   ELSIF r.az_withholding_percent=0 THEN
     v_reason:='Arizona zero election requires a separate certified exemption workflow.';
   END IF;
   IF v_reason IS NOT NULL THEN
     UPDATE public.payroll_entries SET federal_withholding=NULL, state_withholding=NULL,
       income_tax_status='held_tax_inputs',payroll_tax_calculation_status='held_tax_inputs',
       tax_withheld=NULL,employee_tax_total=NULL,employer_tax_total=NULL,net_pay=NULL,
       tax_calculation_metadata=jsonb_build_object('hold_reason',v_reason,'no_money_movement',true),updated_at=now()
     WHERE id=r.id;
     v_held:=v_held+1; CONTINUE;
   END IF;
   SELECT r.opening_ytd_fica+coalesce(sum(e.fica_taxable_wages),0),
          r.opening_ytd_futa+coalesce(sum(e.futa_taxable_wages),0)
   INTO v_ytd_fica,v_ytd_futa
   FROM public.payroll_entries e JOIN public.payroll_periods prev ON prev.id=e.payroll_period_id
   WHERE e.employee_id=r.employee_id AND prev.pay_date>=date '2026-01-01'
     AND prev.pay_date<p.pay_date AND e.status IN ('paid','closed')
     AND e.fica_taxable_wages IS NOT NULL AND e.futa_taxable_wages IS NOT NULL;
   t:=public.ppd_calculate_2026_w2_taxes(
      r.gross_pay,r.federal_taxable_wages,r.az_taxable_wages,p.pay_periods_per_year,
      lower(r.filing_status),coalesce(r.multiple_jobs,false),
      coalesce(r.fed_dependents_amount,0),coalesce(r.fed_other_income,0),
      coalesce(r.fed_deductions,0),coalesce(r.fed_extra_withholding,0),
      r.az_withholding_percent,coalesce(r.az_extra_withholding,0),false,
      v_ytd_fica,v_ytd_futa,true);
   UPDATE public.payroll_entries SET federal_withholding=(t->>'federal_withholding')::numeric,
     state_withholding=(t->>'az_withholding')::numeric,
     social_security_employee=(t->>'social_security_employee')::numeric,
     medicare_employee=(t->>'medicare_employee')::numeric,
     additional_medicare_employee=(t->>'additional_medicare_employee')::numeric,
     employer_social_security=(t->>'social_security_employer')::numeric,
     employer_medicare=(t->>'medicare_employer')::numeric,
     futa_employer=(t->>'futa_employer_before_credit')::numeric,
     employee_tax_total=(t->>'employee_tax_total')::numeric,
     employer_tax_total=(t->>'employer_tax_total')::numeric,
     tax_withheld=(t->>'employee_tax_total')::numeric,
     net_pay=greatest(r.gross_pay-(t->>'employee_tax_total')::numeric,0),
     income_tax_status='calculated_2026_requires_review',
     payroll_tax_calculation_status='calculated_2026_requires_review',
     tax_calculation_metadata=t || jsonb_build_object('opening_ytd_fica',v_ytd_fica,'opening_ytd_futa',v_ytd_futa),
     updated_at=now() WHERE id=r.id;
   v_updated:=v_updated+1;
 END LOOP;
 UPDATE public.payroll_periods SET
   w2_net_total=coalesce((SELECT sum(net_pay) FROM public.payroll_entries WHERE payroll_period_id=p.id AND coalesce(draft_status,'draft')='draft'),0),
   w2_tax_total=coalesce((SELECT sum(coalesce(employee_tax_total,0)+coalesce(employer_tax_total,0)) FROM public.payroll_entries WHERE payroll_period_id=p.id AND coalesce(draft_status,'draft')='draft'),0),
   updated_at=now() WHERE id=p.id;
 RETURN jsonb_build_object('ok',true,'payroll_period_id',p.id,'calculated',v_updated,'held',v_held,'no_money_movement',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.ppd_apply_draft_tax_rates_to_period(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppd_apply_draft_tax_rates_to_period(uuid) TO service_role;
