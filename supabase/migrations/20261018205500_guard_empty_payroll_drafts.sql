-- Drafts and review exports must have a current period and real workers/items.
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
  IF NOT EXISTS (SELECT 1 FROM public.payroll_periods WHERE id=p_payroll_period_id AND current_date BETWEEN start_date AND end_date AND status IN ('open','draft','time_review','pending')) THEN
    RETURN jsonb_build_object('ok',false,'error','current_period_required');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payroll_worker_profiles WHERE active IS TRUE) THEN
    RETURN jsonb_build_object('ok',false,'error','active_worker_required');
  END IF;
  v_preflight := public.ppd_run_payroll_preflight(p_payroll_period_id);
  v_blockers := coalesce((v_preflight->>'blockers')::integer,0);

  v_employee := public.ppd_generate_employee_payroll_draft(p_payroll_period_id);
  v_contract := public.ppd_generate_contractor_payout_draft(p_payroll_period_id);

  delete from public.payroll_payment_batches
  where payroll_period_id = p_payroll_period_id
    and batch_status = 'draft';

  insert into public.payroll_payment_batches (
    payroll_period_id, batch_type, batch_status, gross_total, net_total, tax_total, contractor_total, item_count, metadata, created_at, updated_at
  ) values (
    p_payroll_period_id, 'mixed', case when v_blockers = 0 then 'draft_ready_for_review' else 'draft_blocked' end,
    0, 0, 0, 0, 0,
    jsonb_build_object('preflight', v_preflight, 'employee_draft', v_employee, 'contractor_draft', v_contract, 'no_money_movement', true),
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
    'preflight', v_preflight,
    'no_money_movement', true
  );
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

  IF coalesce(b.item_count,0)=0 OR NOT EXISTS (SELECT 1 FROM public.payroll_periods WHERE id=b.payroll_period_id AND current_date BETWEEN start_date AND end_date) THEN
    RETURN jsonb_build_object('ok',false,'error','current_nonempty_batch_required');
  END IF;
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
