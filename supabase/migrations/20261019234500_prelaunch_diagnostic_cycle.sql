-- Prelaunch diagnostics observe existing systems without starting job/flight/payment execution.
create or replace function public.ppd_prelaunch_diagnostic_cycle()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gateway_active boolean;
  v_main_active boolean;
  v_competitors bigint;
  v_latest_funding_status text;
  v_weather_failures bigint;
  v_checked_at timestamptz := now();
begin
  select coalesce(bool_or(active), false) into v_gateway_active
    from public.ppd_ai_tool_credentials_status where tool_key = 'ai_gateway_runtime';
  select coalesce(bool_or(schedule_status = 'active'), false) into v_main_active
    from public.ppd_ai_autopilot_schedules where schedule_key = 'main_controlled_ai_cycle';
  select count(*) into v_competitors from public.competitor_raw_data;
  select d.status into v_latest_funding_status
    from cron.job_run_details d join cron.job j on j.jobid = d.jobid
    where j.jobname = 'ppd_funding_ai_workers_every_6_hours'
    order by d.start_time desc limit 1;
  select count(*) into v_weather_failures from public.ppd_operational_events
    where event_type = 'weather_refresh_failed'
      and event_status = 'open' and created_at >= now() - interval '24 hours';

  insert into public.ppd_ai_system_audit_findings
    (finding_key, audit_area, finding_status, severity, finding_title, finding_body,
     recommended_action, target_system, metadata, updated_at)
  values
    ('prelaunch_gateway', 'ai_runtime', case when v_gateway_active then 'passed' else 'warning' end,
     case when v_gateway_active then 'low' else 'high' end, 'Model gateway readiness',
     case when v_gateway_active then 'Gateway reports active.' else 'Gateway is inactive; model reasoning cannot complete.' end,
     'Verify provider connectivity and a controlled test request before enabling the main cycle.',
     'ppd-ai-gateway-executor', jsonb_build_object('checked_at',v_checked_at), v_checked_at),
    ('prelaunch_main_cycle', 'ai_runtime', case when v_main_active then 'passed' else 'warning' end,
     case when v_main_active then 'low' else 'medium' end, 'Main brain schedule',
     case when v_main_active then 'Main schedule is active.' else 'Main schedule is held pending gateway and action-gate validation.' end,
     'Keep unattended execution held until provider and authorization checks pass.',
     'ppd-ai-cycle', jsonb_build_object('checked_at',v_checked_at), v_checked_at),
    ('prelaunch_competitors', 'market_research', case when v_competitors > 0 then 'passed' else 'warning' end,
     case when v_competitors > 0 then 'low' else 'medium' end, 'Competitor research ingestion',
     'Competitor raw records: ' || v_competitors || '.',
     'Check scraper results, source quality, write responses, and recurring schedule.',
     'competitor_raw_data', jsonb_build_object('checked_at',v_checked_at,'records',v_competitors), v_checked_at),
    ('prelaunch_funding_worker', 'worker_health', case when v_latest_funding_status = 'failed' then 'warning' else 'passed' end,
     case when v_latest_funding_status = 'failed' then 'medium' else 'low' end, 'Funding worker last run',
     'Latest scheduled run: ' || coalesce(v_latest_funding_status,'no run history') || '.',
     'Inspect the latest cron failure and fix its authorization path.',
     'funding', jsonb_build_object('checked_at',v_checked_at,'last_status',v_latest_funding_status), v_checked_at),
    ('prelaunch_weather', 'worker_health', case when v_weather_failures > 0 then 'warning' else 'passed' end,
     case when v_weather_failures > 0 then 'high' else 'low' end, 'Unresolved weather refresh failures',
     'Open failures in the last 24 hours: ' || v_weather_failures || '.',
     'Inspect failed locations and verify current weather before safety use.',
     'weather', jsonb_build_object('checked_at',v_checked_at,'open_failures',v_weather_failures), v_checked_at)
  on conflict (finding_key) do update set
    finding_status=excluded.finding_status, severity=excluded.severity,
    finding_body=excluded.finding_body, recommended_action=excluded.recommended_action,
    metadata=excluded.metadata, updated_at=excluded.updated_at;

  return jsonb_build_object('ok',true,'checked_at',v_checked_at,'checks',5);
end;
$$;
revoke all on function public.ppd_prelaunch_diagnostic_cycle() from public, anon, authenticated;
grant execute on function public.ppd_prelaunch_diagnostic_cycle() to service_role;

create or replace function public.ppd_prelaunch_diagnostic_status()
returns jsonb
language plpgsql
stable security definer
set search_path = public, pg_temp
as $$
declare v_findings jsonb;
begin
  if not public.portal_current_user_has_role('owner') then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'key',finding_key,'area',audit_area,'status',finding_status,'severity',severity,
    'title',finding_title,'body',finding_body,'recommendation',recommended_action,
    'checked_at',updated_at) order by finding_key),'[]'::jsonb)
  into v_findings from public.ppd_ai_system_audit_findings
  where finding_key like 'prelaunch_%';
  return jsonb_build_object('ok',true,'findings',v_findings);
end;
$$;
revoke all on function public.ppd_prelaunch_diagnostic_status() from public, anon;
grant execute on function public.ppd_prelaunch_diagnostic_status() to authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'ppd_prelaunch_diagnostics_every_30m') then
    perform cron.schedule('ppd_prelaunch_diagnostics_every_30m','*/30 * * * *',
      'select public.ppd_prelaunch_diagnostic_cycle();');
  end if;
end;
$$;
