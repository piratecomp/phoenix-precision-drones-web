-- Safety dashboard reads and actions are scoped to signed-in safety staff.
create or replace function public.ppd_get_safety_dashboard_state()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_weather jsonb; v_jobs jsonb; v_reviews jsonb; v_checklists jsonb; v_events jsonb; v_counts jsonb;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Safety dashboard access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(w) order by w.location_name),'[]'::jsonb) into v_weather from (
    select l.location_name, l.source_type, z.fetched_at, z.valid_until,
      z.raw_payload->>'kind' as source_kind, z.raw_payload->>'observation_time' as observation_time,
      z.raw_payload->>'forecast_period_start' as forecast_period_start,
      z.wind_mph, z.wind_gust_mph, z.temperature_f, z.precip_probability,
      case when z.id is null or z.valid_until is null or z.valid_until <= now() or z.fetched_at < now()-interval '60 minutes'
        then 'stale' when z.raw_payload->>'kind' <> 'station_observation' or z.raw_payload->>'observation_time' is null
        or (z.raw_payload->>'observation_time')::timestamptz < now()-interval '90 minutes'
        then 'review' else public.evaluate_weather_status_values(z.wind_mph,z.wind_gust_mph,z.precip_probability,z.temperature_f,z.heat_index_f)
      end as assessment
    from public.weather_locations l left join public.zone_weather_cache z on z.weather_location_id=l.id
    where l.active is true order by l.location_name limit 50
  ) w;
  select coalesce(jsonb_agg(to_jsonb(j) order by j.scheduled_start nulls last),'[]'::jsonb) into v_jobs from (
    select id,status::text as status,job_address,scheduled_start,weather_status,safety_status,requires_manual_approval,accepted_pilot_id,drone_id
    from public.jobs where status::text not in ('completed','cancelled') order by scheduled_start nulls last limit 30
  ) j;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]'::jsonb) into v_reviews from (
    select id,job_id,title,summary,review_status,risk_level,risk_score,required_action,created_at
    from public.ppd_safety_review_items where review_status in ('open','in_review','blocked','waiver_required') order by created_at desc limit 40
  ) r;
  select coalesce(jsonb_agg(to_jsonb(c) order by c.updated_at desc),'[]'::jsonb) into v_checklists from (
    select id,job_id,checklist_status,weather_checked,airspace_checked,pilot_verified,drone_verified,insurance_checked,
      customer_site_confirmed,risk_score,required_action,metadata->>'airspace_evidence' as airspace_evidence,
      metadata->>'site_weather_evidence' as site_weather_evidence,metadata->>'site_observation_at' as site_observation_at,updated_at
    from public.ppd_safety_checklists where checklist_status <> 'closed' order by updated_at desc limit 40
  ) c;
  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_events from (
    select id,module_key,event_type,event_status,severity,title,summary,created_at from public.ppd_operational_events
    where module_key in ('safety','weather') and event_status='open' order by created_at desc limit 30
  ) e;
  select jsonb_build_object('active_jobs',(select count(*) from public.jobs where status::text not in ('completed','cancelled')),
    'open_reviews',(select count(*) from public.ppd_safety_review_items where review_status in ('open','in_review','blocked','waiver_required')),
    'blocked_checklists',(select count(*) from public.ppd_safety_checklists where checklist_status='blocked'),
    'cleared_checklists',(select count(*) from public.ppd_safety_checklists where checklist_status='cleared'),
    'open_events',(select count(*) from public.ppd_operational_events where module_key in ('safety','weather') and event_status='open')) into v_counts;
  return jsonb_build_object('generated_at',now(),'flight_commands_held',true,'can_clear',
    (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin')),
    'weather',v_weather,'jobs',v_jobs,'reviews',v_reviews,'checklists',v_checklists,'events',v_events,'counts',v_counts);
end $$;

create or replace function public.ppd_safety_dashboard_action(p_action text,p_target_id uuid,p_note text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_actor uuid; v_job record; v_review record;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Safety action access denied' using errcode='42501';
  end if;
  v_actor:=public.portal_current_public_user_id();
  if p_target_id is null or length(btrim(coalesce(p_note,''))) < 10 or length(p_note)>2000 then
    raise exception 'Select an item and provide a reason of 10 to 2000 characters';
  end if;
  if p_action='hold_job' then
    select id,safety_status into v_job from public.jobs where id=p_target_id for update;
    if not found then raise exception 'Job not found'; end if;
    update public.jobs set safety_status='blocked',requires_manual_approval=true,updated_at=now() where id=p_target_id;
    update public.ppd_safety_checklists set checklist_status='blocked',required_action=p_note,updated_at=now()
      where job_id=p_target_id and checklist_status <> 'closed';
    update public.ppd_safety_review_items set review_status='blocked',required_action=p_note,updated_at=now()
      where job_id=p_target_id and review_status not in ('closed');
    insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,source_table,source_record_id,actor_user_id,title,summary,requires_human_review)
    values ('safety:job_hold:'||gen_random_uuid(),'safety_job_hold','open','high','safety','jobs',p_target_id,v_actor,'Job held by Safety',p_note,true);
    return jsonb_build_object('ok',true,'action','hold_job','job_id',p_target_id);
  elsif p_action='start_review' then
    select id,review_status into v_review from public.ppd_safety_review_items where id=p_target_id for update;
    if not found then raise exception 'Review item not found'; end if;
    if v_review.review_status not in ('open','in_review') then raise exception 'Only open reviews can be started'; end if;
    update public.ppd_safety_review_items set review_status='in_review',reviewed_by=v_actor,reviewed_at=now(),
      required_action=p_note,updated_at=now() where id=p_target_id;
    return jsonb_build_object('ok',true,'action','start_review','review_id',p_target_id);
  end if;
  raise exception 'Unsupported Safety action';
end $$;

create or replace function public.ppd_safety_dashboard_clear_checklist(
  p_checklist_id uuid,p_airspace_evidence text,p_site_weather_evidence text,p_observed_at timestamptz,p_note text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_actor uuid; v_result jsonb;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin')) then
    raise exception 'Owner or admin clearance required' using errcode='42501';
  end if;
  v_actor:=public.portal_current_public_user_id();
  if not exists (select 1 from public.users where id=v_actor and status::text='active' and role::text in ('owner','admin')) then
    raise exception 'Active owner or admin reviewer required' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_airspace_evidence,'')))<10 or length(btrim(coalesce(p_site_weather_evidence,'')))<10
    or length(p_airspace_evidence)>2000 or length(p_site_weather_evidence)>2000
    or p_observed_at not between now()-interval '30 minutes' and now()+interval '5 minutes' then
    raise exception 'Current airspace and site weather evidence is required';
  end if;
  update public.ppd_safety_checklists set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
    'airspace_evidence',btrim(p_airspace_evidence),'site_weather_evidence',btrim(p_site_weather_evidence),
    'site_observation_at',p_observed_at,'evidence_recorded_by',v_actor),updated_at=now()
    where id=p_checklist_id and checklist_status in ('open','in_review','blocked');
  if not found then raise exception 'Open checklist not found'; end if;
  v_result:=public.ppd_clear_safety_checklist(p_checklist_id,v_actor,nullif(btrim(p_note),''));
  return v_result;
end $$;

create or replace function public.ppd_safety_dashboard_refresh_weather()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Weather refresh access denied' using errcode='42501';
  end if;
  if not pg_try_advisory_xact_lock(1971,2026) then raise exception 'Weather refresh already running'; end if;
  if exists (select 1 from public.ppd_operational_events where event_type='manual_weather_refresh'
    and created_at>now()-interval '2 minutes') then raise exception 'Wait two minutes between manual refreshes'; end if;
  insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,actor_user_id,title,summary)
  values ('weather:manual:'||gen_random_uuid(),'manual_weather_refresh','resolved','info','weather',
    public.portal_current_public_user_id(),'Manual weather refresh','Safety dashboard requested NOAA service-area refresh');
  v_result:=public.ppd_checked_weather_refresh();
  perform public.refresh_jobs_from_weather_cache();
  return v_result;
end $$;

revoke all on function public.ppd_get_safety_dashboard_state(),public.ppd_safety_dashboard_action(text,uuid,text),
 public.ppd_safety_dashboard_clear_checklist(uuid,text,text,timestamptz,text),public.ppd_safety_dashboard_refresh_weather() from public,anon;
grant execute on function public.ppd_get_safety_dashboard_state(),public.ppd_safety_dashboard_action(text,uuid,text),
 public.ppd_safety_dashboard_clear_checklist(uuid,text,text,timestamptz,text),public.ppd_safety_dashboard_refresh_weather() to authenticated,service_role;
