CREATE OR REPLACE FUNCTION public.ppd_calculate_2026_w2_taxes(
 p_gross numeric, p_federal_taxable numeric, p_az_taxable numeric,
 p_pay_periods integer, p_filing_status text, p_multiple_jobs boolean,
 p_w4_dependents numeric DEFAULT 0, p_w4_other_income numeric DEFAULT 0,
 p_w4_deductions numeric DEFAULT 0, p_w4_extra numeric DEFAULT 0,
 p_az_rate numeric DEFAULT NULL, p_az_extra numeric DEFAULT 0,
 p_az_zero_certified boolean DEFAULT false, p_ytd_fica numeric DEFAULT 0,
 p_ytd_futa numeric DEFAULT 0, p_w4_verified boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = 'public', 'pg_temp' AS $fn$
DECLARE
 v_status text; v_annual numeric; v_bracket public.ppd_federal_withholding_brackets%rowtype;
 v_federal numeric; v_az numeric; v_ss numeric; v_medicare numeric; v_addl numeric; v_futa numeric;
BEGIN
 IF p_gross IS NULL OR p_federal_taxable IS NULL OR p_az_taxable IS NULL OR p_gross<0 OR p_federal_taxable<0 OR p_az_taxable<0
 OR p_federal_taxable>p_gross OR p_az_taxable>p_gross OR p_pay_periods IS NULL OR p_pay_periods NOT IN (12,24,26,52,260)
 OR p_filing_status IS NULL OR p_filing_status NOT IN ('single','married_filing_jointly','head_of_household') OR p_multiple_jobs IS NULL OR NOT coalesce(p_w4_verified,false)
 OR p_w4_dependents IS NULL OR p_w4_other_income IS NULL OR p_w4_deductions IS NULL OR p_w4_extra IS NULL OR p_az_extra IS NULL OR p_ytd_fica IS NULL OR p_ytd_futa IS NULL
 OR least(p_w4_dependents,p_w4_other_income,p_w4_deductions,p_w4_extra,p_az_extra,p_ytd_fica,p_ytd_futa)<0
 OR p_az_rate IS NOT NULL AND p_az_rate NOT IN (0,0.005,0.01,0.015,0.02,0.025,0.03,0.035)
 OR (p_az_rate=0 AND NOT p_az_zero_certified) OR (p_az_zero_certified AND p_az_rate IS DISTINCT FROM 0)
 THEN RAISE EXCEPTION 'Invalid or unverified W-4/A-4 tax inputs' USING ERRCODE='22023'; END IF;
 v_annual:=greatest(p_federal_taxable*p_pay_periods+coalesce(p_w4_other_income,0)-coalesce(p_w4_deductions,0)-
   CASE WHEN p_multiple_jobs THEN 0 WHEN p_filing_status='married_filing_jointly' THEN 12900 ELSE 8600 END,0);
 SELECT * INTO v_bracket FROM public.ppd_federal_withholding_brackets
 WHERE tax_year=2026 AND filing_status=p_filing_status AND multiple_jobs=p_multiple_jobs AND annual_floor<=v_annual
 ORDER BY annual_floor DESC LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION '2026 federal withholding bracket missing' USING ERRCODE='22023'; END IF;
 v_federal:=round(greatest((v_bracket.base_tax+(v_annual-v_bracket.annual_floor)*v_bracket.marginal_rate)/p_pay_periods-
 coalesce(p_w4_dependents,0)/p_pay_periods,0)+coalesce(p_w4_extra,0),2);
 v_az:=round(p_az_taxable*coalesce(p_az_rate,0.02),2)+coalesce(p_az_extra,0);
 v_ss:=round(least(p_gross,greatest(184500-p_ytd_fica,0))*0.062,2);
 v_medicare:=round(p_gross*0.0145,2);
 v_addl:=round(greatest(p_gross-greatest(200000-p_ytd_fica,0),0)*0.009,2);
 v_futa:=round(least(p_gross,greatest(7000-p_ytd_futa,0))*0.06,2);
 RETURN jsonb_build_object('tax_year',2026,'method','pub15t_worksheet_1a_automated','federal_withholding',v_federal,
 'az_withholding',v_az,'social_security_employee',v_ss,'medicare_employee',v_medicare,'additional_medicare_employee',v_addl,
 'social_security_employer',v_ss,'medicare_employer',v_medicare,'futa_employer_before_credit',v_futa,
 'employee_tax_total',v_federal+v_az+v_ss+v_medicare+v_addl,
 'employer_tax_total',v_ss+v_medicare+v_futa,'annual_adjusted_wages',v_annual,
 'az_default_applied',p_az_rate IS NULL,'requires_employer_setup',true,'no_money_movement',true);
END;
$fn$;
