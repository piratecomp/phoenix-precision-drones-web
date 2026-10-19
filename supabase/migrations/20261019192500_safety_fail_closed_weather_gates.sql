-- Safety checks are advisory. A pilot's site inspection and flight authorization remain required.
create or replace function public.evaluate_job_weather_safety(p_job_id uuid)
returns text language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare c record;
begin
  if not exists (select 1 from public.jobs where id=p_job_id) then return 'unknown_job'; end if;
  select z.*, w.raw_payload->>'observation_time' as observed_text,
         w.raw_payload->>'kind' as source_kind,
         w.fetched_at, w.valid_until, w.wind_mph,w.wind_gust_mph,
         w.precip_probability,w.temperature_f,w.heat_index_f
    into c
    from public.weather_locations z
    join public.zone_weather_cache w on w.weather_location_id=z.id
   where (z.job_id=p_job_id or z.service_zone_id=(select zone_id from public.jobs where id=p_job_id))
     and z.active is true
   order by (z.job_id=p_job_id) desc,w.fetched_at desc limit 1;
  if not found or c.fetched_at is null or c.valid_until < now()
     or c.fetched_at < now()-interval '45 minutes' then return 'stale_or_missing'; end if;
  -- An hourly forecast is not a current site observation for flight clearance.
  if c.source_kind is distinct from 'station_observation' or c.observed_text is null then
    return 'review_missing_weather';
  end if;
  begin
    if c.observed_text::timestamptz < now()-interval '60 minutes'
       or c.observed_text::timestamptz > now()+interval '5 minutes' then
      return 'stale_or_missing';
    end if;
  exception when invalid_datetime_format then return 'stale_or_missing';
  end;
  return public.evaluate_weather_status_values(c.wind_mph,c.wind_gust_mph,
                                                c.precip_probability,c.temperature_f,c.heat_index_f);
end $$;

create or replace function public.evaluate_mission_weather(p_mission_id uuid)
returns boolean language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare v_job uuid;
begin
  select job_id into v_job from public.mission_days where id=p_mission_id;
  return v_job is not null and public.evaluate_job_weather_safety(v_job)='safe';
end $$;

create or replace function public.weather_safe(p_mission_id uuid)
returns boolean language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare v_job uuid; v_day date;
begin
  select job_id,mission_date into v_job,v_day from public.job_mission_days where id=p_mission_id;
  return v_job is not null and v_day=current_date
     and public.evaluate_job_weather_safety(v_job)='safe';
end $$;

-- A date without a location or job cannot support a safe decision.
create or replace function public.mission_weather_safe(mission_date date)
returns boolean language sql set search_path to 'public','pg_temp' as $$select false$$;

create or replace function public.mission_heat_safe(mission_date date)
returns boolean language sql set search_path to 'public','pg_temp' as $$select false$$;

create or replace function public.weather_safe_for_mission(mission_date date,lat double precision,lng double precision)
returns boolean language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare v_job uuid;
begin
  -- Coordinates without a site inspection or current job cannot establish clearance.
  return false;
end $$;

create or replace function public.validate_mission_safe(p_mission_id uuid)
returns boolean language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare m record;
begin
  select job_id,mission_date,weather_risk_score into m from public.job_mission_days where id=p_mission_id;
  return found and m.mission_date=current_date
     and m.weather_risk_score is not null and m.weather_risk_score<=0.7
     and public.evaluate_job_weather_safety(m.job_id)='safe';
end $$;

-- Old automatic scheduler loops indefinitely when all dates fail its weather test.
create or replace function public.auto_schedule_job(p_job_id uuid)
returns void language plpgsql set search_path to 'public','extensions','pg_temp' as $$
begin
  raise exception 'Automatic scheduling requires a separate bounded proposal and human weather review';
end $$;

create or replace function public.evaluate_mission_safety(p_mission_id uuid)
returns text language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare m record; v_reason text; v_weather text;
begin
  select id,job_id into m from public.mission_plans where id=p_mission_id;
  if not found then return 'unknown_mission'; end if;
  v_weather:=public.evaluate_job_weather_safety(m.job_id);
  if v_weather <> 'safe' then v_reason:='Weather requires review: '||v_weather;
  elsif not exists (select 1 from public.ppd_safety_checklists c
                    where c.job_id=m.job_id and c.checklist_status='cleared'
                      and c.approved_by is not null and c.approved_at is not null
                      and c.approved_at>now()-interval '24 hours'
                      and c.weather_checked and c.airspace_checked and c.pilot_verified
                      and c.drone_verified and c.insurance_checked and c.customer_site_confirmed)
    then v_reason:='Current human preflight checklist and airspace review required';
  end if;
  if v_reason is not null then
    update public.mission_plans set safety_status='blocked',safety_notes=v_reason where id=p_mission_id;
    return 'blocked';
  end if;
  update public.mission_plans set safety_status='clear',safety_notes='Advisory checks passed; pilot final authorization still required'
   where id=p_mission_id;
  return 'clear';
end $$;

create or replace function public.evaluate_flight_safety(p_drone_id uuid)
returns text language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare t record;
begin
  select * into t from public.drone_telemetry where drone_id=p_drone_id order by created_at desc limit 1;
  if not found or t.created_at is null or t.created_at<now()-interval '2 minutes' then return 'no_current_telemetry'; end if;
  if t.battery_percent is null or t.signal_strength is null or t.latitude is null or t.longitude is null or t.altitude is null
     then return 'missing_telemetry'; end if;
  if t.latitude not between -90 and 90 or t.longitude not between -180 and 180 then return 'invalid_position'; end if;
  if t.battery_percent<25 then return 'low_battery'; end if;
  if t.signal_strength<20 then return 'low_signal'; end if;
  if t.altitude<0 or t.altitude>400 then return 'altitude_violation'; end if;
  if public.is_in_no_fly_zone(t.latitude,t.longitude) then return 'no_fly_zone'; end if;
  return 'telemetry_checks_passed';
end $$;

-- This endpoint cannot select an autonomous action from incomplete safety evidence.
create or replace function public.get_drone_decision(p_drone_id uuid)
returns jsonb language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare v_safety text;
begin
  v_safety:=public.evaluate_flight_safety(p_drone_id);
  return jsonb_build_object('action','human_review_required','telemetry_status',v_safety,
    'reason','Telemetry checks alone do not authorize flight, reroute, or continuation');
end $$;

-- Scheduled refresh propagates cache state to active jobs; the status is advisory only.
select cron.schedule('ppd_weather_refresh_30m','10,40 * * * *',
  'select public.ppd_refresh_briefing_weather(); select public.refresh_jobs_from_weather_cache();');
select cron.schedule('ppd_weather_prebrief_1255_az','55 19 * * *',
  'select public.ppd_refresh_briefing_weather(); select public.refresh_jobs_from_weather_cache();');
