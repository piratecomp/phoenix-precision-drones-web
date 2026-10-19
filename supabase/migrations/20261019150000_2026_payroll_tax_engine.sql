-- 2026 W-2 tax computation only. No payment or provider action.
CREATE TABLE IF NOT EXISTS public.ppd_federal_withholding_brackets (
 tax_year integer NOT NULL, filing_status text NOT NULL, multiple_jobs boolean NOT NULL,
 annual_floor numeric NOT NULL, base_tax numeric NOT NULL, marginal_rate numeric NOT NULL,
 source_url text NOT NULL, PRIMARY KEY(tax_year,filing_status,multiple_jobs,annual_floor),
 CONSTRAINT ppd_bracket_nonnegative CHECK(annual_floor>=0 AND base_tax>=0 AND marginal_rate BETWEEN 0 AND 1)
);
ALTER TABLE public.ppd_federal_withholding_brackets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ppd_federal_withholding_brackets FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ppd_federal_withholding_brackets TO service_role;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,19300,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,44100,2480,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,120100,11600,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,230700,35932,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,422850,82048,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,531750,116896,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',false,788000,206583.5,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,16100,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,28500,1240,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,66500,5800,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,121800,17966,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,217875,41024,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,272325,58448,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'married_filing_jointly',true,400450,103291.75,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,7500,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,19900,1240,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,57900,5800,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,113200,17966,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,209275,41024,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,263725,58448,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',false,648100,192979.25,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,8050,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,14250,620,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,33250,2900,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,60900,8983,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,108938,20512,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,136163,29224,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'single',true,328350,96489.63,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,15550,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,33250,1770,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,83000,7740,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,121250,16155,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,217300,39207,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,271750,56631,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',false,656150,191171,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,0,0,0,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,12075,0,0.1,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,20925,885,0.12,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,45800,3870,0.22,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,64925,8077.5,0.24,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,112950,19603.5,0.32,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,140175,28315.5,0.35,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;
INSERT INTO public.ppd_federal_withholding_brackets VALUES (2026,'head_of_household',true,332375,95585.5,0.37,'https://www.irs.gov/publications/p15t') ON CONFLICT (tax_year,filing_status,multiple_jobs,annual_floor) DO UPDATE SET base_tax=excluded.base_tax,marginal_rate=excluded.marginal_rate;

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
REVOKE ALL ON FUNCTION public.ppd_calculate_2026_w2_taxes(numeric,numeric,numeric,integer,text,boolean,numeric,numeric,numeric,numeric,numeric,numeric,boolean,numeric,numeric,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppd_calculate_2026_w2_taxes(numeric,numeric,numeric,integer,text,boolean,numeric,numeric,numeric,numeric,numeric,numeric,boolean,numeric,numeric,boolean) TO service_role;
