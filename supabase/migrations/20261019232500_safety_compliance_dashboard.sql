-- Official Federal Register Part 107 documents are candidates for human impact review.
create table if not exists public.ppd_faa_rule_watch (
  id uuid primary key default gen_random_uuid(), document_number text not null unique,
  title text not null, document_type text not null, publication_date date,
  effective_date date, source_url text not null, official_pdf_url text,
  abstract text, review_status text not null default 'needs_review'
    check (review_status in ('needs_review','reviewed','not_applicable')),
  review_note text, reviewed_by uuid, reviewed_at timestamptz,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now()
);
alter table public.ppd_faa_rule_watch enable row level security;
revoke all on public.ppd_faa_rule_watch from anon,authenticated;

create or replace function public.ppd_sync_faa_part107_watch()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_response public.http_response; v_payload jsonb; v_item jsonb; v_count integer:=0; v_new integer:=0; v_number text; v_url text;
begin
  v_response:=public.http_get('https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=federal-aviation-administration&conditions%5Bcfr%5D%5Btitle%5D=14&conditions%5Bcfr%5D%5Bpart%5D=107&per_page=50&order=newest');
  if v_response.status<>200 then raise exception 'Federal Register HTTP %',v_response.status; end if;
  v_payload:=v_response.content::jsonb;
  if jsonb_typeof(v_payload->'results')<>'array' then raise exception 'Federal Register result format invalid'; end if;
  for v_item in select value from jsonb_array_elements(v_payload->'results') loop
    v_number:=v_item->>'document_number'; v_url:=v_item->>'html_url';
    if v_number !~ '^[0-9]{4}-[0-9]{4,6}$' or v_url not like 'https://www.federalregister.gov/documents/%' then continue; end if;
    if not exists(select 1 from public.ppd_faa_rule_watch where document_number=v_number) then v_new:=v_new+1; end if;
    insert into public.ppd_faa_rule_watch(document_number,title,document_type,publication_date,effective_date,source_url,official_pdf_url,abstract)
    values(v_number,left(coalesce(v_item->>'title','Untitled'),500),coalesce(v_item->>'type','Unknown'),
      nullif(v_item->>'publication_date','')::date,nullif(v_item->>'effective_on','')::date,v_url,
      case when v_item->>'pdf_url' like 'https://www.govinfo.gov/%' then v_item->>'pdf_url' end,
      left(v_item->>'abstract',3000))
    on conflict(document_number) do update set last_seen_at=now(),
      title=excluded.title,document_type=excluded.document_type,publication_date=excluded.publication_date,
      effective_date=coalesce(excluded.effective_date,public.ppd_faa_rule_watch.effective_date),
      source_url=excluded.source_url,official_pdf_url=excluded.official_pdf_url;
    v_count:=v_count+1;
  end loop;
  insert into public.faa_intelligence_sync_log(sync_type,records_loaded,status,created_at)
  values ('part107_federal_register',v_count,'succeeded',now());
  return jsonb_build_object('ok',true,'checked_at',now(),'records',v_count,'new_candidates',v_new);
exception when others then
  insert into public.faa_intelligence_sync_log(sync_type,records_loaded,status,created_at)
  values ('part107_federal_register',0,'failed',now());
  return jsonb_build_object('ok',false,'error',SQLERRM,'checked_at',now());
end $$;
revoke all on function public.ppd_sync_faa_part107_watch() from public,anon,authenticated;
grant execute on function public.ppd_sync_faa_part107_watch() to service_role;
select cron.schedule('ppd_faa_part107_daily','15 13 * * *','select public.ppd_sync_faa_part107_watch();');

create or replace function public.ppd_get_safety_compliance_state()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_pilots jsonb; v_aircraft jsonb; v_incidents jsonb; v_flights jsonb; v_faa jsonb; v_airspace jsonb; v_policy jsonb; v_sync jsonb; v_counts jsonb;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Safety compliance access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.full_name),'[]'::jsonb) into v_pilots from (
    select u.id,u.full_name,u.status::text as account_status,u.pilot_type,
      c.certification_type,c.issued_date,c.expiration_date as legacy_expiration_date,
      i.expiration_date as insurance_expires_at,i.verified as insurance_verified,i.coverage_amount,
      m.part107_verified as network_part107_verified,m.insurance_verified as network_insurance_verified,
      t.verification_status,t.part107_status,t.insurance_status,
      (select coalesce(sum(greatest(coalesce(tc.total_hours,0),0)),0) from public.pilot_time_cards tc
        where tc.pilot_id=u.id and tc.clock_in>=now()-interval '7 days') as hours_last_7_days,
      (select max(tc.clock_out) from public.pilot_time_cards tc where tc.pilot_id=u.id) as last_clock_out
    from public.users u
    left join lateral (select * from public.pilot_certifications where pilot_id=u.id and lower(certification_type) like '%107%' order by created_at desc limit 1) c on true
    left join lateral (select * from public.pilot_insurance where pilot_id=u.id order by expiration_date desc nulls last limit 1) i on true
    left join lateral (select * from public.marketplace_pilots where pilot_id=u.id order by created_at desc limit 1) m on true
    left join lateral (select * from public.ppd_pilot_verification_tasks where pilot_id=u.id order by created_at desc limit 1) t on true
    where u.role::text='pilot' order by u.full_name limit 50
  ) p;
  select coalesce(jsonb_agg(to_jsonb(d) order by d.model),'[]'::jsonb) into v_aircraft from (
    select d.id,d.model,d.status::text as status,d.operational_status,d.total_flight_hours,
      (select max(l.service_date) from public.maintenance_logs l where l.equipment_id=d.id) as last_service_date,
      (select count(*) from public.drone_maintenance m where m.drone_id=d.id and coalesce(m.status,'') not in ('completed','closed')) as open_maintenance,
      (select max(t.created_at) from public.drone_telemetry t where t.drone_id=d.id) as last_telemetry_at,
      (select max(f.flight_end) from public.flight_logs f where f.drone_id=d.id) as last_flight_at,
      (select max(b.updated_at) from public.drone_battery_state b where b.drone_id=d.id) as battery_updated_at,
      (select b.battery_percent from public.drone_battery_state b where b.drone_id=d.id order by b.updated_at desc limit 1) as battery_percent
    from public.drones d order by d.model limit 50
  ) d;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.occurred_at desc),'[]'::jsonb) into v_incidents from (
    select id,job_id,pilot_id,drone_id,incident_type,severity,description,status,regulatory_report_required,insurance_claim_required,occurred_at,reported_at
    from public.incidents order by occurred_at desc nulls last limit 30
  ) i;
  select coalesce(jsonb_agg(to_jsonb(f) order by f.flight_start desc),'[]'::jsonb) into v_flights from (
    select id,job_id,pilot_id,drone_id,flight_start,flight_end,flight_duration_hours,max_altitude,airspace_type
    from public.flight_logs order by flight_start desc limit 30
  ) f;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.publication_date desc),'[]'::jsonb) into v_faa from (
    select id,document_number,title,document_type,publication_date,effective_date,source_url,official_pdf_url,abstract,review_status,review_note,reviewed_at
    from public.ppd_faa_rule_watch order by publication_date desc nulls last limit 30
  ) r;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_airspace from (
    select id,job_id,status,provider,zone_class,requires_laanc,created_at from public.faa_authorization_requests
    where status not in ('closed','cancelled') order by created_at desc limit 30
  ) a;
  select to_jsonb(p) into v_policy from (select max_daily_hours,max_weekly_hours,required_rest_hours from public.fatigue_policy limit 1) p;
  select jsonb_build_object('status',status,'checked_at',created_at,'records',records_loaded) into v_sync from public.faa_intelligence_sync_log
    where sync_type='part107_federal_register' order by created_at desc limit 1;
  select jsonb_build_object('pilots',(select count(*) from public.users where role::text='pilot'),
    'aircraft',(select count(*) from public.drones),
    'open_maintenance',(select count(*) from public.drone_maintenance where coalesce(status,'') not in ('completed','closed')),
    'open_incidents',(select count(*) from public.incidents where coalesce(status,'') not in ('closed','resolved')),
    'flight_logs',(select count(*) from public.flight_logs),
    'faa_needs_review',(select count(*) from public.ppd_faa_rule_watch where review_status='needs_review'),
    'airspace_requests',(select count(*) from public.faa_authorization_requests where status not in ('closed','cancelled'))) into v_counts;
  return jsonb_build_object('generated_at',now(),'pilots',v_pilots,'aircraft',v_aircraft,'incidents',v_incidents,
    'flights',v_flights,'faa_documents',v_faa,'faa_sync',v_sync,'airspace',v_airspace,'fatigue_policy',v_policy,'counts',v_counts);
end $$;

create or replace function public.ppd_safety_review_faa_document(p_id uuid,p_status text,p_note text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'FAA review access denied' using errcode='42501';
  end if;
  if p_status not in ('reviewed','not_applicable') or length(btrim(coalesce(p_note,'')))<10 or length(p_note)>2000 then
    raise exception 'Review decision and explanation required';
  end if;
  update public.ppd_faa_rule_watch set review_status=p_status,review_note=btrim(p_note),reviewed_by=public.portal_current_public_user_id(),reviewed_at=now()
    where id=p_id;
  if not found then raise exception 'Document not found'; end if;
  return jsonb_build_object('ok',true,'status',p_status);
end $$;

create or replace function public.ppd_safety_ground_aircraft(p_drone_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_count integer;
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'Aircraft grounding access denied' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_reason,'')))<10 or length(p_reason)>2000 then raise exception 'Grounding reason required'; end if;
  update public.drones set operational_status='grounded' where id=p_drone_id;
  if not found then raise exception 'Aircraft not found'; end if;
  insert into public.drone_maintenance(drone_id,maintenance_type,description,status,created_by)
    values(p_drone_id,'safety_grounding',btrim(p_reason),'scheduled',public.portal_current_public_user_id());
  update public.jobs set safety_status='blocked',requires_manual_approval=true,updated_at=now()
    where drone_id=p_drone_id and status::text not in ('completed','cancelled');
  get diagnostics v_count=row_count;
  insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,source_table,source_record_id,actor_user_id,title,summary,requires_human_review)
    values('safety:aircraft_ground:'||gen_random_uuid(),'aircraft_grounded','open','high','safety','drones',p_drone_id,
      public.portal_current_public_user_id(),'Aircraft grounded',btrim(p_reason),true);
  return jsonb_build_object('ok',true,'affected_jobs',v_count);
end $$;

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
  if p_drone_id is not null then update public.drones set operational_status='grounded' where id=p_drone_id; end if;
  insert into public.ppd_operational_events(event_key,event_type,event_status,severity,module_key,source_table,source_record_id,actor_user_id,title,summary,requires_human_review)
  values('safety:incident:'||v_id,'incident_reported','open',case when p_severity in ('high','critical') then p_severity else 'medium' end,
    'safety','incidents',v_id,public.portal_current_public_user_id(),'Incident needs review',left(p_description,1000),true);
  return jsonb_build_object('ok',true,'incident_id',v_id,'reportability','requires_human_assessment');
end $$;

create or replace function public.ppd_safety_manual_faa_sync()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  if auth.uid() is null or not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety')) then
    raise exception 'FAA watch access denied' using errcode='42501';
  end if;
  if not pg_try_advisory_xact_lock(1971,107) then raise exception 'FAA sync already running'; end if;
  if exists(select 1 from public.faa_intelligence_sync_log where sync_type='part107_federal_register' and created_at>now()-interval '5 minutes') then
    raise exception 'Wait five minutes between FAA checks';
  end if;
  return public.ppd_sync_faa_part107_watch();
end $$;
revoke all on function public.ppd_get_safety_compliance_state(),public.ppd_safety_review_faa_document(uuid,text,text),
  public.ppd_safety_ground_aircraft(uuid,text),public.ppd_safety_report_incident(uuid,uuid,text,text,text,timestamptz),
  public.ppd_safety_manual_faa_sync() from public,anon;
grant execute on function public.ppd_get_safety_compliance_state(),public.ppd_safety_review_faa_document(uuid,text,text),
  public.ppd_safety_ground_aircraft(uuid,text),public.ppd_safety_report_incident(uuid,uuid,text,text,text,timestamptz),
  public.ppd_safety_manual_faa_sync() to authenticated,service_role;
