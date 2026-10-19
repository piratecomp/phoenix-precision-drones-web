-- Aircraft command integration is unverified; reject ordinary flight commands at the database boundary.
-- Emergency return/land/stop remain available to authorized server code.
create or replace function public.ppd_flight_command_safety_gate()
returns trigger language plpgsql set search_path to 'public','pg_temp' as $$
begin
  if lower(coalesce(new.command_type,'')) not in ('rth','land','emergency_stop') then
    raise exception 'Flight commands held pending aircraft-side safety integration and human authorization';
  end if;
  if new.drone_id is null then raise exception 'Emergency command requires a drone'; end if;
  return new;
end $$;

create trigger trg_ppd_flight_command_safety_gate
before insert or update of command_type,status,edge_status on public.drone_commands
for each row execute function public.ppd_flight_command_safety_gate();

revoke all on function public.ppd_flight_command_safety_gate() from public,anon,authenticated;
