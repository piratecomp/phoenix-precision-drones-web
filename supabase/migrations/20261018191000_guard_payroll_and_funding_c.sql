CREATE OR REPLACE FUNCTION public.ppd_get_payroll_control_panel(p_payroll_period_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_sync jsonb;
  v_period_id uuid;
  v_result jsonb;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_sync := public.ppd_sync_payroll_finance_control_items(p_payroll_period_id);
  v_period_id := nullif(v_sync->'preflight'->>'payroll_period_id','')::uuid;

  select jsonb_build_object(
    'ok', true,
    'generated_at', now(),
    'preflight', v_sync->'preflight',
    'counts', jsonb_build_object(
      'w2_workers', (select count(*) from public.payroll_worker_profiles where worker_type='w2_employee' and active is true),
      'w2_ready', (select count(*) from public.payroll_worker_profiles where worker_type='w2_employee' and active is true and payroll_ready is true),
      'contract_workers', (select count(*) from public.payroll_worker_profiles where worker_type in ('1099_pilot','1099_contractor') and active is true),
      'contract_ready', (select count(*) from public.payroll_worker_profiles where worker_type in ('1099_pilot','1099_contractor') and active is true and payroll_ready is true),
      'open_checks', (select count(*) from public.payroll_readiness_checks where check_status='open'),
      'blockers', (select count(*) from public.payroll_readiness_checks where check_status='open' and severity='blocker'),
      'warnings', (select count(*) from public.payroll_readiness_checks where check_status='open' and severity='warning'),
      'open_w2_timecards', (select count(*) from public.employee_time_entries where clock_out is null),
      'unapproved_w2_timecards', (select count(*) from public.employee_time_entries where clock_out is not null and coalesce(approved,false)=false),
      'open_contract_timecards', (select count(*) from public.pilot_time_cards where clock_out is null),
      'unapproved_contract_timecards', (select count(*) from public.pilot_time_cards where clock_out is not null and coalesce(approved,false)=false)
    ),
    'company', coalesce((
      select jsonb_build_object(
        'company_name', company_name,
        'legal_name', legal_name,
        'ein_status', ein_status,
        'state_withholding_status', state_withholding_status,
        'unemployment_tax_status', unemployment_tax_status,
        'workers_comp_policy_status', workers_comp_policy_status,
        'payroll_provider_status', payroll_provider_status,
        'direct_deposit_enabled', direct_deposit_enabled,
        'tax_rate_monitoring_enabled', tax_rate_monitoring_enabled
      )
      from public.payroll_company_profile
      order by created_at
      limit 1
    ), '{}'::jsonb),
    'active_period', coalesce((
      select jsonb_build_object(
        'id', id,
        'start_date', start_date,
        'end_date', end_date,
        'status', status,
        'preflight_status', preflight_status,
        'preflight_score', preflight_score,
        'payroll_provider_status', payroll_provider_status
      )
      from public.payroll_periods
      where id=v_period_id
      limit 1
    ), '{}'::jsonb),
    'workers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'worker_type', worker_type,
        'display_name', display_name,
        'payroll_ready', payroll_ready,
        'readiness_score', readiness_score,
        'readiness_status', readiness_status,
        'readiness_missing', readiness_missing,
        'pay_type', pay_type,
        'updated_at', updated_at
      ) order by worker_type, readiness_score desc, updated_at desc)
      from (
        select * from public.payroll_worker_profiles
        where active is true
        order by worker_type, readiness_score desc, updated_at desc
        limit 20
      ) w
    ), '[]'::jsonb),
    'readiness_checks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'check_scope', check_scope,
        'check_key', check_key,
        'severity', severity,
        'title', title,
        'summary', summary,
        'next_step', next_step,
        'created_at', created_at
      ) order by case severity when 'blocker' then 0 when 'warning' then 1 else 2 end, created_at desc)
      from (
        select * from public.payroll_readiness_checks
        where check_status='open'
        order by case severity when 'blocker' then 0 when 'warning' then 1 else 2 end, created_at desc
        limit 20
      ) ch
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_payroll_draft_batches()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  return jsonb_build_object(
    'ok', true,
    'generated_at', now(),
    'counts', jsonb_build_object(
      'batches', (select count(*) from public.payroll_payment_batches),
      'draft_batches', (select count(*) from public.payroll_payment_batches where batch_status ilike '%draft%'),
      'blocked_batches', (select count(*) from public.payroll_payment_batches where batch_status='blocked' or batch_status='draft_blocked'),
      'held_items', (select count(*) from public.payroll_payment_items where payment_status in ('hold','blocked')),
      'draft_items', (select count(*) from public.payroll_payment_items where payment_status='draft')
    ),
    'batches', coalesce((
      select jsonb_agg(row_to_json(b)::jsonb order by b.created_at desc)
      from (
        select id, payroll_period_id, batch_type, batch_status, gross_total, net_total, tax_total, contractor_total, item_count, created_at, updated_at
        from public.payroll_payment_batches
        order by created_at desc
        limit 12
      ) b
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(row_to_json(i)::jsonb order by i.created_at desc)
      from (
        select id, payment_batch_id, worker_profile_id, payroll_entry_id, pilot_payout_id, item_type, gross_amount, tax_amount, net_amount, payment_status, hold_reason, created_at
        from public.payroll_payment_items
        order by created_at desc
        limit 30
      ) i
    ), '[]'::jsonb)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_open_payroll_period(p_start_date date, p_end_date date, p_scope text DEFAULT 'mixed'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_id uuid;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    return jsonb_build_object('ok', false, 'error', 'invalid_period_dates');
  end if;

  select id into v_id
  from public.payroll_periods
  where start_date = p_start_date
    and end_date = p_end_date
    and coalesce(payroll_scope,'mixed') = coalesce(p_scope,'mixed')
  limit 1;

  if v_id is null then
    insert into public.payroll_periods (start_date, end_date, status, payroll_scope, preflight_status, preflight_score, created_at, updated_at)
    values (p_start_date, p_end_date, 'open', coalesce(p_scope,'mixed'), 'not_run', 0, now(), now())
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'payroll_period_id', v_id, 'start_date', p_start_date, 'end_date', p_end_date, 'scope', coalesce(p_scope,'mixed'));
end;
$function$;
