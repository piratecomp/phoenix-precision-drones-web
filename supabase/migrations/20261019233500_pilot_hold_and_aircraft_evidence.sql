create table public.ppd_safety_pilot_holds (
  pilot_id uuid primary key references public.users(id),
  active boolean not null default true, reason text not null,
  held_by uuid not null references public.users(id), held_at timestamptz not null default now(),
  released_by uuid references public.users(id), released_at timestamptz, release_note text
);
alter table public.ppd_safety_pilot_holds enable row level security;
revoke all on public.ppd_safety_pilot_holds from anon,authenticated;

create table public.ppd_aircraft_compliance_reviews (
  drone_id uuid primary key references public.drones(id),
  registration_expires_on date not null,
  registration_evidence text not null,
  remote_id_evidence text not null,
  reviewed_by uuid not null references public.users(id),
  reviewed_at timestamptz not null default now()
);
alter table public.ppd_aircraft_compliance_reviews enable row level security;
revoke all on public.ppd_aircraft_compliance_reviews from anon,authenticated;

create or replace function public.ppd_safety_hold_pilot(p_pilot_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_count integer;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Pilot hold access denied' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_reason,'')))<10 or length(p_reason)>2000 then raise exception 'Hold reason required'; end if;
  if not exists(select 1 from public.users where id=p_pilot_id and role::text='pilot') then raise exception 'Pilot not found'; end if;
  insert into public.ppd_safety_pilot_holds(pilot_id,reason,held_by)
  values(p_pilot_id,btrim(p_reason),public.portal_current_public_user_id())
  on conflict(pilot_id) do update set active=true,reason=excluded.reason,held_by=excluded.held_by,held_at=now(),
    released_by=null,released_at=null,release_note=null;
  update public.jobs set safety_status='blocked',requires_manual_approval=true,updated_at=now()
    where accepted_pilot_id=p_pilot_id and status::text not in ('completed','cancelled');
  get diagnostics v_count=row_count;
  insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,source_table,source_record_id,actor_user_id,title,summary,requires_human_review)
    values('safety:pilot_hold:'||gen_random_uuid(),'pilot_duty_hold','open','high','safety','users',p_pilot_id,
      public.portal_current_public_user_id(),'Pilot held from duty',btrim(p_reason),true);
  return jsonb_build_object('ok',true,'affected_jobs',v_count);
end $$;

create or replace function public.ppd_safety_release_pilot(p_pilot_id uuid,p_note text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin')) then
    raise exception 'Owner/admin release required' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_note,'')))<15 or length(p_note)>2000 then raise exception 'Document the release review'; end if;
  update public.ppd_safety_pilot_holds set active=false,released_by=public.portal_current_public_user_id(),released_at=now(),release_note=btrim(p_note)
    where pilot_id=p_pilot_id and active=true;
  if not found then raise exception 'Active pilot hold not found'; end if;
  -- Existing job holds and checklists remain blocked until independently reviewed.
  return jsonb_build_object('ok',true,'job_holds_remain',true);
end $$;

create or replace function public.ppd_reject_held_pilot_assignment()
returns trigger language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_changed boolean;
begin
  if tg_op='INSERT' then v_changed:=true; else v_changed:=new.accepted_pilot_id is distinct from old.accepted_pilot_id; end if;
  if new.accepted_pilot_id is not null and v_changed and exists (
    select 1 from public.ppd_safety_pilot_holds where pilot_id=new.accepted_pilot_id and active=true
  ) then raise exception 'Pilot is held from duty by Safety'; end if;
  return new;
end $$;
create trigger trg_ppd_reject_held_pilot_assignment
before insert or update of accepted_pilot_id on public.jobs
for each row execute function public.ppd_reject_held_pilot_assignment();

create or replace function public.ppd_safety_record_aircraft_compliance(p_drone_id uuid,p_registration_expires_on date,p_registration_evidence text,p_remote_id_evidence text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Aircraft compliance access denied' using errcode='42501';
  end if;
  if not exists(select 1 from public.drones where id=p_drone_id) then raise exception 'Aircraft not found'; end if;
  if p_registration_expires_on is null or length(btrim(coalesce(p_registration_evidence,'')))<15
    or length(btrim(coalesce(p_remote_id_evidence,'')))<15
    or length(p_registration_evidence)>2000 or length(p_remote_id_evidence)>2000 then
    raise exception 'Registration date, registration evidence, and Remote ID evidence required';
  end if;
  insert into public.ppd_aircraft_compliance_reviews(drone_id,registration_expires_on,registration_evidence,remote_id_evidence,reviewed_by)
  values(p_drone_id,p_registration_expires_on,btrim(p_registration_evidence),btrim(p_remote_id_evidence),public.portal_current_public_user_id())
  on conflict(drone_id) do update set registration_expires_on=excluded.registration_expires_on,
    registration_evidence=excluded.registration_evidence,remote_id_evidence=excluded.remote_id_evidence,
    reviewed_by=excluded.reviewed_by,reviewed_at=now();
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.ppd_get_safety_evidence_state()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_holds jsonb; v_aircraft jsonb;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Safety evidence access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('pilot_id',pilot_id,'active',active,'reason',reason,'held_at',held_at,'released_at',released_at)),'[]'::jsonb)
    into v_holds from public.ppd_safety_pilot_holds where active=true;
  select coalesce(jsonb_agg(jsonb_build_object('drone_id',drone_id,'registration_expires_on',registration_expires_on,
    'registration_evidence',registration_evidence,'remote_id_evidence',remote_id_evidence,'reviewed_at',reviewed_at)),'[]'::jsonb)
    into v_aircraft from public.ppd_aircraft_compliance_reviews;
  return jsonb_build_object('pilot_holds',v_holds,'aircraft_evidence',v_aircraft,
    'can_release',public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin'));
end $$;
revoke all on function public.ppd_safety_hold_pilot(uuid,text),public.ppd_safety_release_pilot(uuid,text),
  public.ppd_safety_record_aircraft_compliance(uuid,date,text,text),public.ppd_get_safety_evidence_state() from public,anon;
grant execute on function public.ppd_safety_hold_pilot(uuid,text),public.ppd_safety_release_pilot(uuid,text),
  public.ppd_safety_record_aircraft_compliance(uuid,date,text,text),public.ppd_get_safety_evidence_state() to authenticated,service_role;
revoke all on function public.ppd_reject_held_pilot_assignment() from public,anon,authenticated;
