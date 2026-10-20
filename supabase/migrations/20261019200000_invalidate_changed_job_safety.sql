create or replace function public.ppd_invalidate_changed_job_safety()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if old.latitude is distinct from new.latitude
     or old.longitude is distinct from new.longitude
     or old.zone_id is distinct from new.zone_id
     or old.accepted_pilot_id is distinct from new.accepted_pilot_id
     or old.drone_id is distinct from new.drone_id
     or old.scheduled_start is distinct from new.scheduled_start
     or (old.weather_status is distinct from new.weather_status and new.weather_status is distinct from 'safe')
  then
    update public.ppd_safety_checklists set checklist_status='blocked',approved_by=null,
      approved_at=null,required_action='Job or weather changed; repeat current safety review.',updated_at=now()
      where job_id=new.id and checklist_status='cleared';
    update public.ppd_safety_review_items set review_status='open',
      required_action='Job or weather changed; repeat current safety review.',updated_at=now()
      where job_id=new.id and review_type='preflight_safety_checklist' and review_status='cleared';
  end if;
  return new;
end $$;

create trigger trg_ppd_invalidate_changed_job_safety
after update of latitude,longitude,zone_id,accepted_pilot_id,drone_id,scheduled_start,weather_status
on public.jobs for each row execute function public.ppd_invalidate_changed_job_safety();

revoke all on function public.ppd_invalidate_changed_job_safety() from public,anon,authenticated;
