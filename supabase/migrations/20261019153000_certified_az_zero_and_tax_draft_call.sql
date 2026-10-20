ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS az_zero_certified boolean NOT NULL DEFAULT false;
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
     ep.az_extra_withholding,ep.arizona_a4_status,ep.az_zero_certified,ep.tax_profile_status,
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
   ELSIF r.az_withholding_percent=0 AND NOT coalesce(r.az_zero_certified,false) THEN
     v_reason:='Arizona zero election requires a certified A-4.';
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
      r.az_withholding_percent,coalesce(r.az_extra_withholding,0),coalesce(r.az_zero_certified,false),
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

CREATE OR REPLACE FUNCTION public.ppd_generate_payroll_draft_batch(p_payroll_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_preflight jsonb;
  v_employee jsonb;
  v_contract jsonb;
  v_tax_calc jsonb;
  v_batch_id uuid;
  v_blockers integer;
  v_gross numeric;
  v_net numeric;
  v_tax numeric;
  v_contract_total numeric;
  v_items integer := 0;
  r record;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_preflight := public.ppd_run_payroll_preflight(p_payroll_period_id);
  v_blockers := coalesce((v_preflight->>'blockers')::integer,0);

  v_employee := public.ppd_generate_employee_payroll_draft(p_payroll_period_id);
  v_contract := public.ppd_generate_contractor_payout_draft(p_payroll_period_id);
  v_tax_calc := public.ppd_apply_draft_tax_rates_to_period(p_payroll_period_id);

  delete from public.payroll_payment_batches
  where payroll_period_id = p_payroll_period_id
    and batch_status = 'draft';

  insert into public.payroll_payment_batches (
    payroll_period_id, batch_type, batch_status, gross_total, net_total, tax_total, contractor_total, item_count, metadata, created_at, updated_at
  ) values (
    p_payroll_period_id, 'mixed', case when v_blockers = 0 then 'draft_ready_for_review' else 'draft_blocked' end,
    0, 0, 0, 0, 0,
    jsonb_build_object('preflight', v_preflight, 'employee_draft', v_employee, 'contractor_draft', v_contract, 'tax_calculation', v_tax_calc, 'no_money_movement', true),
    now(), now()
  ) returning id into v_batch_id;

  for r in
    select pe.id as payroll_entry_id, pe.worker_profile_id, pe.gross_pay, pe.tax_withheld, pe.net_pay
    from public.payroll_entries pe
    where pe.payroll_period_id = p_payroll_period_id
      and coalesce(pe.draft_status,'draft') = 'draft'
  loop
    insert into public.payroll_payment_items (
      payment_batch_id, worker_profile_id, payroll_entry_id, item_type, gross_amount, tax_amount, net_amount, payment_status, hold_reason, metadata, created_at, updated_at
    ) values (
      v_batch_id, r.worker_profile_id, r.payroll_entry_id, 'w2_employee_draft', coalesce(r.gross_pay,0), coalesce(r.tax_withheld,0), coalesce(r.net_pay,0),
      'hold', 'Employee payroll draft requires verified tax engine and payroll preflight approval.', jsonb_build_object('source','payroll_entries'), now(), now()
    );
    v_items := v_items + 1;
  end loop;

  for r in
    select pp.id as pilot_payout_id, pp.worker_profile_id, pp.amount, pp.net_amount, pp.status, pp.payout_hold_reason
    from public.pilot_payouts pp
    where pp.payroll_period_id = p_payroll_period_id
      and pp.status in ('draft','draft_hold','pending')
  loop
    insert into public.payroll_payment_items (
      payment_batch_id, worker_profile_id, pilot_payout_id, item_type, gross_amount, tax_amount, net_amount, payment_status, hold_reason, metadata, created_at, updated_at
    ) values (
      v_batch_id, r.worker_profile_id, r.pilot_payout_id, 'contract_pilot_draft', coalesce(r.amount,0), 0, coalesce(r.net_amount,r.amount,0),
      case when r.status='draft' and v_blockers=0 then 'draft' else 'hold' end,
      case when r.status='draft' and v_blockers=0 then null else coalesce(r.payout_hold_reason,'Payroll preflight blocked.') end,
      jsonb_build_object('source','pilot_payouts'), now(), now()
    );
    v_items := v_items + 1;
  end loop;

  select coalesce(sum(gross_amount),0), coalesce(sum(net_amount),0), coalesce(sum(tax_amount),0),
         coalesce(sum(case when item_type='contract_pilot_draft' then net_amount else 0 end),0)
  into v_gross, v_net, v_tax, v_contract_total
  from public.payroll_payment_items
  where payment_batch_id = v_batch_id;

  update public.payroll_payment_batches
  set gross_total = v_gross,
      net_total = v_net,
      tax_total = v_tax,
      contractor_total = v_contract_total,
      item_count = v_items,
      updated_at = now()
  where id = v_batch_id;

  perform public.ppd_sync_payroll_finance_control_items(p_payroll_period_id);

  return jsonb_build_object(
    'ok', true,
    'payroll_period_id', p_payroll_period_id,
    'payment_batch_id', v_batch_id,
    'batch_status', case when v_blockers = 0 then 'draft_ready_for_review' else 'draft_blocked' end,
    'items', v_items,
    'employee_draft', v_employee,
    'contractor_draft', v_contract,
    'tax_calculation', v_tax_calc,
    'preflight', v_preflight,
    'no_money_movement', true
  );
end;
$function$;
