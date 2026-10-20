-- Part 107 certificate and recurrent knowledge currency are separate facts.
create table public.ppd_pilot_currency_reviews (
  pilot_id uuid primary key references public.users(id),
  training_completed_on date not null,
  training_valid_through date generated always as ((date_trunc('month',training_completed_on::timestamp)+interval '25 months'-interval '1 day')::date) stored,
  certificate_evidence text not null,
  reviewed_by uuid not null references public.users(id),
  reviewed_at timestamptz not null default now()
);
alter table public.ppd_pilot_currency_reviews enable row level security;
revoke all on public.ppd_pilot_currency_reviews from anon,authenticated;

create or replace function public.ppd_safety_record_pilot_currency(p_pilot_id uuid,p_training_completed_on date,p_evidence text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_actor uuid;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Pilot credential review access denied' using errcode='42501';
  end if;
  v_actor:=public.portal_current_public_user_id();
  if not exists(select 1 from public.users where id=p_pilot_id and role::text='pilot')
    or not exists(select 1 from public.pilot_certifications where pilot_id=p_pilot_id and lower(certification_type) like '%107%') then
    raise exception 'Pilot and Part 107 certificate record required';
  end if;
  if p_training_completed_on is null or p_training_completed_on>current_date
    or p_training_completed_on<current_date-interval '10 years' or length(btrim(coalesce(p_evidence,'')))<15
    or length(p_evidence)>2000 then raise exception 'Recent training date and certificate/training evidence required'; end if;
  insert into public.ppd_pilot_currency_reviews(pilot_id,training_completed_on,certificate_evidence,reviewed_by)
  values(p_pilot_id,p_training_completed_on,btrim(p_evidence),v_actor)
  on conflict(pilot_id) do update set training_completed_on=excluded.training_completed_on,
    certificate_evidence=excluded.certificate_evidence,reviewed_by=v_actor,reviewed_at=now();
  return jsonb_build_object('ok',true,'pilot_id',p_pilot_id);
end $$;
revoke all on function public.ppd_safety_record_pilot_currency(uuid,date,text) from public,anon;
grant execute on function public.ppd_safety_record_pilot_currency(uuid,date,text) to authenticated,service_role;

-- Prevent a newly assigned job from using an aircraft grounded by Safety.
create or replace function public.ppd_reject_grounded_aircraft_assignment()
returns trigger language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_changed boolean;
begin
  if tg_op='INSERT' then v_changed:=true; else v_changed:=new.drone_id is distinct from old.drone_id; end if;
  if new.drone_id is not null and v_changed and exists (
    select 1 from public.drones where id=new.drone_id and operational_status='grounded'
  ) then raise exception 'Grounded aircraft cannot be assigned to a job'; end if;
  return new;
end $$;
create trigger trg_ppd_reject_grounded_aircraft_assignment
before insert or update of drone_id on public.jobs
for each row execute function public.ppd_reject_grounded_aircraft_assignment();
revoke all on function public.ppd_reject_grounded_aircraft_assignment() from public,anon,authenticated;

-- Incident with an identified aircraft holds every active job assigned to it.
create or replace function public.ppd_safety_report_incident(p_job_id uuid,p_drone_id uuid,p_type text,p_severity text,p_description text,p_occurred_at timestamptz)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Incident report access denied' using errcode='42501';
  end if;
  if p_severity not in ('low','medium','high','critical') or length(btrim(coalesce(p_type,'')))<3
    or length(btrim(coalesce(p_description,'')))<20 or length(p_description)>4000
    or p_occurred_at is null or p_occurred_at>now()+interval '5 minutes' then raise exception 'Incident type, time, severity and description required'; end if;
  insert into public.incidents(job_id,drone_id,incident_type,severity,description,reported_by,status,
    regulatory_report_required,insurance_claim_required,occurred_at,reported_at)
  values(p_job_id,p_drone_id,btrim(p_type),p_severity,btrim(p_description),public.portal_current_public_user_id(),
    'reported',null,null,p_occurred_at,now()) returning id into v_id;
  if p_job_id is not null then update public.jobs set safety_status='blocked',requires_manual_approval=true,updated_at=now() where id=p_job_id; end if;
  if p_drone_id is not null then
    update public.drones set operational_status='grounded' where id=p_drone_id;
    update public.jobs set safety_status='blocked',requires_manual_approval=true,updated_at=now()
      where drone_id=p_drone_id and status::text not in ('completed','cancelled');
  end if;
  insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,source_table,source_record_id,actor_user_id,title,summary,requires_human_review)
  values('safety:incident:'||v_id,'incident_reported','open',case when p_severity in ('high','critical') then p_severity else 'medium' end,
    'safety','incidents',v_id,public.portal_current_public_user_id(),'Incident needs review',left(p_description,1000),true);
  return jsonb_build_object('ok',true,'incident_id',v_id,'reportability','requires_human_assessment');
end $$;
revoke all on function public.ppd_safety_report_incident(uuid,uuid,text,text,text,timestamptz) from public,anon;
grant execute on function public.ppd_safety_report_incident(uuid,uuid,text,text,text,timestamptz) to authenticated,service_role;

-- Add reviewed recurrent-training data without altering the legacy certificate expiry field.
create or replace function public.ppd_get_pilot_currency_state()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Pilot currency access denied' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('pilot_id',pilot_id,'training_completed_on',training_completed_on,
    'training_valid_through',training_valid_through,'certificate_evidence',certificate_evidence,'reviewed_at',reviewed_at))
    from public.ppd_pilot_currency_reviews),'[]'::jsonb);
end $$;
revoke all on function public.ppd_get_pilot_currency_state() from public,anon;
grant execute on function public.ppd_get_pilot_currency_state() to authenticated,service_role;
