CREATE OR REPLACE FUNCTION public.ppd_funding_owner_go(p_opportunity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  o record;
  v_application_id uuid;
  v_queue_id uuid;
begin
  if not public.portal_current_user_has_role('owner') then
    raise exception 'PPD access denied: active owner required' using errcode = '42501';
  end if;
  select * into o from public.funding_opportunities where id = p_opportunity_id;
  if o.id is null then
    return jsonb_build_object('ok', false, 'error', 'opportunity_not_found');
  end if;

  if coalesce(o.accuracy_status,'unverified') in ('rejected_noise','duplicate_hidden') or coalesce(o.status,'review') in ('rejected','duplicate_hidden') then
    return jsonb_build_object('ok', false, 'error', 'owner_go_blocked_accuracy_filter', 'accuracy_status', o.accuracy_status, 'status', o.status);
  end if;

  perform public.ppd_funding_prepare_package(o.id);

  select id into v_application_id from public.funding_applications where opportunity_id=o.id order by created_at desc limit 1;

  update public.funding_applications
  set owner_approved=true, approved_at=now(), application_status='owner_go_approved', updated_at=now()
  where id=v_application_id;

  update public.funding_opportunities
  set go_status='owner_go_approved', owner_go_enabled=true, updated_at=now()
  where id=o.id;

  insert into public.funding_execution_queue (action, opportunity_id, payload, status, priority, idempotency_key, created_at)
  values (
    'owner_go_ready',
    o.id,
    jsonb_build_object('opportunity_id', o.id, 'application_id', v_application_id, 'link', coalesce(o.application_url,o.submission_url,o.source_url,o.url), 'method', coalesce(o.submission_method,'owner_portal_review')),
    'pending',
    100,
    'owner_go:' || o.id::text,
    now()
  )
  on conflict (idempotency_key) do update set status='pending', payload=excluded.payload, created_at=now()
  returning id into v_queue_id;

  return jsonb_build_object('ok', true, 'opportunity_id', o.id, 'application_id', v_application_id, 'queue_id', v_queue_id, 'go_status', 'owner_go_approved');
end;
$function$;


CREATE OR REPLACE FUNCTION public.ppd_mark_payroll_batch_owner_approved(p_payment_batch_id uuid, p_owner_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_gate jsonb;
  v_status text;
begin
  if not public.portal_current_user_has_role('owner') then
    raise exception 'PPD access denied: active owner required' using errcode = '42501';
  end if;
  if p_owner_id is not null and p_owner_id not in (auth.uid(), public.portal_current_public_user_id()) then
    raise exception 'PPD access denied: owner identity mismatch' using errcode = '42501';
  end if;
  v_gate := public.ppd_enforce_payroll_batch_gate(p_payment_batch_id);
  v_status := coalesce(v_gate->>'batch_status','blocked');

  if v_status <> 'ready_for_owner_approval' then
    return jsonb_build_object('ok', false, 'error', 'batch_not_ready_for_owner_approval', 'gate', v_gate);
  end if;

  update public.payroll_payment_batches
  set batch_status = 'owner_approved_hold_for_provider',
      owner_approved_by = public.portal_current_public_user_id(),
      owner_approved_at = now(),
      updated_at = now(),
      metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('owner_approved_hold_only', true, 'no_money_movement', true)
  where id = p_payment_batch_id;

  return jsonb_build_object('ok', true, 'payment_batch_id', p_payment_batch_id, 'batch_status', 'owner_approved_hold_for_provider', 'no_money_movement', true);
end;
$function$;


CREATE OR REPLACE FUNCTION public.ppd_get_funding_control_panel()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_result jsonb;
begin
  if not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('finance_payroll')) then
    raise exception 'PPD access denied: funding team required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'ok', true,
    'generated_at', now(),
    'counts', jsonb_build_object(
      'research_queries', (select count(*) from public.funding_ai_research where active is true),
      'startup_research_queries', (select count(*) from public.funding_ai_research where active is true and coalesce(source_category,'')='startup_grants'),
      'watch_sources', (select count(*) from public.funding_source_watchlist where coalesce(active, enabled, true) is true),
      'startup_grants', (select count(*) from public.funding_opportunities where funding_lane='startup_grants' and funding_instrument='grant_program' and source_quality in ('official_source','trusted_business_resource') and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden')),
      'startup_loans', (select count(*) from public.funding_opportunities where funding_lane='startup_grants' and funding_instrument='loan_program' and source_quality in ('official_source','trusted_business_resource') and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden')),
      'startup_resources', (select count(*) from public.funding_opportunities where funding_lane='startup_grants' and funding_instrument in ('funding_resource','resource_or_unknown') and source_quality in ('official_source','trusted_business_resource') and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden')),
      'sbir_sttr', (select count(*) from public.funding_opportunities where funding_lane='sbir_sttr' and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden') and coalesce(applyability_status,'needs_review') not in ('not_applyable','blocked')),
      'contracts_procurement', (select count(*) from public.funding_opportunities where funding_lane='contracts_procurement' and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden') and coalesce(applyability_status,'needs_review') not in ('not_applyable','blocked')),
      'opportunities', (select count(*) from public.funding_opportunities where coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden') and coalesce(fit_status,'needs_review') in ('strong_fit','possible_fit') and coalesce(applyability_status,'needs_review') in ('package_ready_review','needs_owner_fit_review')),
      'needs_review', (select count(*) from public.funding_opportunities where coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(status,'review') not in ('rejected','duplicate_hidden') and (coalesce(fit_status,'needs_review') not in ('strong_fit','possible_fit') or coalesce(applyability_status,'needs_review') in ('needs_review','not_ready','loan_review_only'))),
      'rejected_noise', (select count(*) from public.funding_opportunities where coalesce(accuracy_status,'') = 'rejected_noise' or coalesce(status,'') = 'rejected'),
      'duplicates_hidden', (select count(*) from public.funding_opportunities where coalesce(accuracy_status,'') = 'duplicate_hidden' or coalesce(status,'') = 'duplicate_hidden'),
      'package_ready', (select count(*) from public.funding_opportunities where package_status='package_ready' and coalesce(fit_status,'') in ('strong_fit','possible_fit') and coalesce(applyability_status,'') in ('package_ready_review','needs_owner_fit_review')),
      'go_ready', (select count(*) from public.funding_opportunities where owner_go_enabled is true and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')),
      'applications', (select count(*) from public.funding_applications fa join public.funding_opportunities fo on fo.id=fa.opportunity_id where coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(fo.fit_status,'') in ('strong_fit','possible_fit')),
      'documents', (select count(*) from public.funding_documents fd left join public.funding_opportunities fo on fo.id=fd.opportunity_id where fd.opportunity_id is null or (coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(fo.fit_status,'') in ('strong_fit','possible_fit'))),
      'pending_execution', (select count(*) from public.funding_execution_queue q left join public.funding_opportunities fo on fo.id=q.opportunity_id where q.status='pending' and (q.opportunity_id is null or coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden'))),
      'open_recommendations', (select count(*) from public.ai_recommendations where module='funding_ai' and coalesce(resolved,false)=false)
    ),
    'control', coalesce((
      select jsonb_build_object(
        'control_key', control_key,
        'enabled', enabled,
        'funding_ai_enabled', funding_ai_enabled,
        'advisor_mode_enabled', advisor_mode_enabled,
        'min_match_score', min_match_score,
        'min_win_probability', min_win_probability,
        'max_daily_recommendations', max_daily_recommendations,
        'updated_at', updated_at
      )
      from public.funding_ai_control
      order by updated_at desc nulls last
      limit 1
    ), '{}'::jsonb),
    'opportunities', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select id, title, source_name, source_type, source_url, application_url, deadline_date, deadline_text,
               coalesce(funding_amount_max, estimated_funding_max, expected_award_max, detected_amount, 0) as value,
               score, confidence_score, launch_stage_fit_score, opportunity_status, status, package_status,
               owner_go_enabled, go_status, accuracy_status, accuracy_reason,
               fit_status, fit_score, fit_reason, applyability_status, applyability_reason,
               funding_lane, funding_lane_reason, source_quality, funding_instrument, source_quality_reason,
               created_at, updated_at
        from public.funding_opportunities
        where coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')
          and coalesce(status,'review') not in ('rejected','duplicate_hidden')
          and coalesce(fit_status,'needs_review') in ('strong_fit','possible_fit')
          and coalesce(applyability_status,'needs_review') in ('package_ready_review','needs_owner_fit_review')
        order by case when funding_lane='startup_grants' and funding_instrument='grant_program' then 0 when funding_lane='startup_grants' then 1 when funding_lane='sbir_sttr' then 2 else 3 end,
                 coalesce(score,0) desc, coalesce(fit_score,0) desc, coalesce(confidence_score,0) desc, created_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'startup_grants', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select id, title, source_name, source_type, source_url, application_url, deadline_date, deadline_text,
               coalesce(funding_amount_max, estimated_funding_max, expected_award_max, detected_amount, 0) as value,
               score, confidence_score, fit_status, fit_score, applyability_status, package_status, owner_go_enabled, go_status,
               funding_lane, source_quality, funding_instrument, created_at, updated_at
        from public.funding_opportunities
        where funding_lane='startup_grants'
          and source_quality in ('official_source','trusted_business_resource')
          and funding_instrument in ('grant_program','competition_or_accelerator','loan_program','funding_resource')
          and coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')
          and coalesce(status,'review') not in ('rejected','duplicate_hidden')
        order by case funding_instrument when 'grant_program' then 0 when 'competition_or_accelerator' then 1 when 'loan_program' then 2 else 3 end,
                 coalesce(score,0) desc, coalesce(fit_score,0) desc, created_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'needs_review', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select id, title, source_name, source_type, source_url, application_url, score, confidence_score, fit_status, fit_score, applyability_status, go_status, funding_lane, source_quality, funding_instrument, updated_at
        from public.funding_opportunities
        where coalesce(accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')
          and coalesce(status,'review') not in ('rejected','duplicate_hidden')
          and (coalesce(fit_status,'needs_review') not in ('strong_fit','possible_fit') or coalesce(applyability_status,'needs_review') in ('needs_review','not_ready','loan_review_only'))
        order by updated_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select fa.id, fa.opportunity_id, fo.title as opportunity_title, fa.application_status, fa.owner_approved,
               fa.approved_at, fa.submitted_at, fa.created_at, fa.updated_at
        from public.funding_applications fa
        left join public.funding_opportunities fo on fo.id = fa.opportunity_id
        where coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')
          and coalesce(fo.fit_status,'') in ('strong_fit','possible_fit')
        order by fa.updated_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select fd.id, fd.opportunity_id, fo.title as opportunity_title, fd.document_type, fd.title, fd.status,
               fd.owner_action_required, fd.updated_at
        from public.funding_documents fd
        left join public.funding_opportunities fo on fo.id = fd.opportunity_id
        where fd.opportunity_id is null or (coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden') and coalesce(fo.fit_status,'') in ('strong_fit','possible_fit'))
        order by fd.updated_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'execution_queue', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select q.id, q.action, q.opportunity_id, fo.title as opportunity_title, q.status, q.priority,
               q.created_at, q.processed_at, q.last_error
        from public.funding_execution_queue q
        left join public.funding_opportunities fo on fo.id = q.opportunity_id
        where q.opportunity_id is null or coalesce(fo.accuracy_status,'unverified') not in ('rejected_noise','duplicate_hidden')
        order by q.created_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'cron_jobs', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb)
      from (
        select jobid, jobname, schedule, active
        from cron.job
        where jobname ilike '%funding%'
        order by jobid
      ) x
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;


REVOKE EXECUTE ON FUNCTION public.ppd_funding_owner_go(uuid) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.ppd_mark_payroll_batch_owner_approved(uuid, uuid) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.ppd_get_funding_control_panel() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ppd_funding_owner_go(uuid), public.ppd_mark_payroll_batch_owner_approved(uuid, uuid), public.ppd_get_funding_control_panel() TO authenticated, service_role;
