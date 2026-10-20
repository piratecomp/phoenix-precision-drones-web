-- The NOAA fetcher reports per-location errors in JSON rather than raising a cron error.
-- Expire failed locations immediately so a prior cache record cannot appear current.
create or replace function public.ppd_checked_weather_refresh()
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare r jsonb; e jsonb; v_failed integer:=0;
begin
  r:=public.ppd_refresh_briefing_weather();
  for e in select value from jsonb_array_elements(coalesce(r->'failed','[]'::jsonb)) loop
    update public.zone_weather_cache z set valid_until=now()-interval '1 second',
      weather_status='stale',updated_at=now()
    from public.weather_locations w
    where z.weather_location_id=w.id and w.location_name=e->>'location';
    v_failed:=v_failed+1;
  end loop;
  if v_failed>0 then
    insert into public.ppd_operational_events
      (event_key,event_type,event_status,severity,module_key,title,summary,payload)
    values ('weather:refresh_failed:'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),
      'weather_refresh_failed','open','warning','weather','Weather refresh incomplete',
      v_failed||' location(s) failed; cache expired for review.',r);
  end if;
  return r;
end $$;

revoke all on function public.ppd_checked_weather_refresh() from public,anon,authenticated;
select cron.schedule('ppd_weather_refresh_30m','10,40 * * * *',
  'select public.ppd_checked_weather_refresh(); select public.refresh_jobs_from_weather_cache();');
select cron.schedule('ppd_weather_prebrief_1255_az','55 19 * * *',
  'select public.ppd_checked_weather_refresh(); select public.refresh_jobs_from_weather_cache();');
