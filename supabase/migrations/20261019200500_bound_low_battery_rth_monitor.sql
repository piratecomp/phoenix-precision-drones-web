create or replace function public.flight_safety_monitor()
returns void language plpgsql set search_path to 'public','extensions','pg_temp' as $$
declare t record;
begin
  for t in
    select distinct on (dt.drone_id) dt.drone_id,dt.mission_id,dt.battery_percent,dt.created_at
    from public.drone_telemetry dt
    join public.active_missions am on am.drone_id=dt.drone_id
      and am.mission_id=dt.mission_id and am.status in ('flying','in_progress')
    where dt.created_at between now()-interval '2 minutes' and now()+interval '5 seconds'
    order by dt.drone_id,dt.created_at desc
  loop
    if t.battery_percent is not null and t.battery_percent<25
      and not exists (select 1 from public.drone_commands c
                      where c.drone_id=t.drone_id and c.command_type='rth'
                        and c.status in ('pending','delayed','sent','executing')) then
      perform public.insert_drone_command_v2(t.drone_id,'rth',
        jsonb_build_object('reason','low_battery','mission_id',t.mission_id,
          'telemetry_time',t.created_at));
    end if;
  end loop;
end $$;
