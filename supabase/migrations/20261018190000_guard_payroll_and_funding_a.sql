CREATE OR REPLACE FUNCTION public.ppd_apply_draft_tax_rates_to_period(p_payroll_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  r record;
  v_tax_review jsonb;
  v_ss_rate numeric := 0.062;
  v_medicare_rate numeric := 0.0145;
  v_addl_medicare_rate numeric := 0.009;
  v_addl_medicare_threshold numeric := 200000;
  v_futa_rate numeric := 0.06;
  v_futa_wage_base numeric := 7000;
  v_az_default numeric := 0.02;
  v_az_rate numeric;
  v_fica_wage numeric;
  v_ss numeric;
  v_medicare numeric;
  v_addl_medicare numeric;
  v_az numeric;
  v_futa numeric;
  v_employee_tax numeric;
  v_employer_tax numeric;
  v_updated integer := 0;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_tax_review := public.ppd_review_payroll_tax_rates();

  select rate into v_ss_rate from public.payroll_tax_rate_versions where tax_type='social_security_employee' and effective_start <= current_date and (effective_end is null or effective_end >= current_date) order by effective_start desc limit 1;
  select rate into v_medicare_rate from public.payroll_tax_rate_versions where tax_type='medicare_employee' and effective_start <= current_date and (effective_end is null or effective_end >= current_date) order by effective_start desc limit 1;
  select rate, wage_base into v_addl_medicare_rate, v_addl_medicare_threshold from public.payroll_tax_rate_versions where tax_type='additional_medicare_employee' and effective_start <= current_date and (effective_end is null or effective_end >= current_date) order by effective_start desc limit 1;
  select rate, wage_base into v_futa_rate, v_futa_wage_base from public.payroll_tax_rate_versions where tax_type='futa_employer_before_credit' and effective_start <= current_date and (effective_end is null or effective_end >= current_date) order by effective_start desc limit 1;
  select rate into v_az_default from public.payroll_tax_rate_versions where tax_type='az_withholding_default' and effective_start <= current_date and (effective_end is null or effective_end >= current_date) order by effective_start desc limit 1;

  for r in
    select pe.*, ep.az_withholding_percent, ep.az_extra_withholding
    from public.payroll_entries pe
    left join public.payroll_worker_profiles w on w.id = pe.worker_profile_id
    left join public.employee_profiles ep on ep.id = w.employee_profile_id
    where pe.payroll_period_id = p_payroll_period_id
      and coalesce(pe.draft_status,'draft') = 'draft'
  loop
    v_fica_wage := coalesce(r.gross_pay,0);
    v_ss := round(v_fica_wage * coalesce(v_ss_rate,0.062), 2);
    v_medicare := round(v_fica_wage * coalesce(v_medicare_rate,0.0145), 2);
    v_addl_medicare := case when v_fica_wage > coalesce(v_addl_medicare_threshold,200000) then round((v_fica_wage - coalesce(v_addl_medicare_threshold,200000)) * coalesce(v_addl_medicare_rate,0.009), 2) else 0 end;
    v_az_rate := coalesce(r.az_withholding_percent, v_az_default, 0.02);
    v_az := round(v_fica_wage * v_az_rate, 2) + coalesce(r.az_extra_withholding,0);
    v_futa := round(least(v_fica_wage, coalesce(v_futa_wage_base,7000)) * coalesce(v_futa_rate,0.06), 2);

    v_employee_tax := v_ss + v_medicare + v_addl_medicare + v_az;
    v_employer_tax := v_ss + v_medicare + v_futa;

    update public.payroll_entries
    set state_withholding = v_az,
        social_security_employee = v_ss,
        medicare_employee = v_medicare,
        additional_medicare_employee = v_addl_medicare,
        employer_social_security = v_ss,
        employer_medicare = v_medicare,
        futa_employer = v_futa,
        tax_withheld = v_employee_tax,
        employee_tax_total = v_employee_tax,
        employer_tax_total = v_employer_tax,
        net_pay = greatest(coalesce(gross_pay,0) - v_employee_tax, 0),
        income_tax_status = 'held_requires_pub15t_engine',
        payroll_tax_calculation_status = 'partial_verified_fica_az_futa_income_tax_held',
        tax_calculation_metadata = jsonb_build_object('tax_review', v_tax_review, 'income_tax_hold_reason', 'Federal income withholding requires Pub 15-T bracket engine and employee tax profile review.', 'no_money_movement', true),
        updated_at = now()
    where id = r.id;

    v_updated := v_updated + 1;
  end loop;

  update public.payroll_periods
  set w2_net_total = coalesce((select sum(net_pay) from public.payroll_entries where payroll_period_id=p_payroll_period_id and coalesce(draft_status,'draft')='draft'),0),
      w2_tax_total = coalesce((select sum(employee_tax_total + employer_tax_total) from public.payroll_entries where payroll_period_id=p_payroll_period_id and coalesce(draft_status,'draft')='draft'),0),
      updated_at = now()
  where id = p_payroll_period_id;

  return jsonb_build_object('ok', true, 'payroll_period_id', p_payroll_period_id, 'entries_updated', v_updated, 'tax_review', v_tax_review, 'income_tax_status', 'held_requires_pub15t_engine');
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_create_payroll_provider_export(p_payment_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  b record;
  v_gate jsonb;
  v_rows jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_export_id uuid;
  v_row_count integer := 0;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  select * into b from public.payroll_payment_batches where id = p_payment_batch_id;
  if b.id is null then
    return jsonb_build_object('ok', false, 'error', 'batch_not_found');
  end if;

  v_gate := public.ppd_enforce_payroll_batch_gate(b.id);

  if coalesce(v_gate->>'batch_status','blocked') <> 'ready_for_owner_approval' then
    v_warnings := v_warnings || jsonb_build_array('Batch is not ready. Export is for review only and cannot be used for payment.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', i.id,
    'item_type', i.item_type,
    'worker_profile_id', i.worker_profile_id,
    'worker_name', w.display_name,
    'worker_type', w.worker_type,
    'gross_amount', i.gross_amount,
    'tax_amount', i.tax_amount,
    'net_amount', i.net_amount,
    'payment_status', i.payment_status,
    'hold_reason', i.hold_reason,
    'bank_token_status', w.payment_token_status,
    'account_last4', bt.account_last4,
    'provider_token_present', bt.id is not null,
    'safe_for_provider_review', i.payment_status not in ('paid')
  ) order by i.created_at), '[]'::jsonb), count(*)
  into v_rows, v_row_count
  from public.payroll_payment_items i
  left join public.payroll_worker_profiles w on w.id = i.worker_profile_id
  left join public.payroll_bank_tokens bt on bt.worker_profile_id = w.id and bt.token_status in ('verified','tokenized')
  where i.payment_batch_id = b.id;

  insert into public.payroll_export_packages (
    payment_batch_id, payroll_period_id, export_type, export_status, row_count, gross_total, net_total, tax_total, package_payload, warnings, created_by, created_at, updated_at
  ) values (
    b.id, b.payroll_period_id, 'provider_review', 'draft_review_only', v_row_count, b.gross_total, b.net_total, b.tax_total,
    jsonb_build_object('batch', row_to_json(b)::jsonb, 'items', v_rows, 'gate', v_gate, 'no_money_movement', true, 'raw_bank_numbers_included', false),
    v_warnings,
    auth.uid(), now(), now()
  ) returning id into v_export_id;

  return jsonb_build_object('ok', true, 'export_package_id', v_export_id, 'payment_batch_id', b.id, 'row_count', v_row_count, 'warnings', v_warnings, 'no_money_movement', true, 'raw_bank_numbers_included', false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_funding_dashboard_refresh()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_result jsonb;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin')) THEN
    RAISE EXCEPTION 'PPD funding access denied' USING ERRCODE='42501';
  END IF;
  begin
    perform public.score_all_funding_opportunities();
  exception when others then
    null;
  end;

  begin
    perform public.generate_funding_recommendations();
  exception when others then
    null;
  end;

  begin
    perform public.run_master_funding_ai();
  exception when others then
    null;
  end;

  select public.ppd_get_funding_control_panel() into v_result;
  return jsonb_build_object('ok', true, 'refreshed_at', now(), 'panel', v_result);
end;
$function$;
