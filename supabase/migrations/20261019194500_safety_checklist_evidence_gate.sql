create or replace function public.ppd_clear_safety_checklist(
  p_checklist_id uuid,p_reviewer uuid default null,p_notes text default null)
returns jsonb language plpgsql security definer
set search_path to 'public','extensions','pg_temp' as $$
declare c record; j record; v_ready boolean; v_weather text; v_site_at timestamptz;
begin
  select * into c from public.ppd_safety_checklists where id=p_checklist_id for update;
  if not found then return jsonb_build_object('ok',false,'error','checklist not found'); end if;
  select accepted_pilot_id,drone_id into j from public.jobs where id=c.job_id;
  if not found then return jsonb_build_object('ok',false,'error','job not found'); end if;
  if p_reviewer is null or not exists (
    select 1 from public.users u where u.id=p_reviewer
      and u.status::text='active' and u.role::text in ('owner','admin')
  ) then return jsonb_build_object('ok',false,'error','active owner or admin reviewer required'); end if;

  v_weather:=public.evaluate_job_weather_safety(c.job_id);
  begin
    v_site_at:=nullif(c.metadata->>'site_observation_at','')::timestamptz;
  exception when invalid_datetime_format then v_site_at:=null; end;
  v_ready:=coalesce(c.weather_checked,false) and coalesce(c.airspace_checked,false)
    and coalesce(c.pilot_verified,false) and coalesce(c.drone_verified,false)
    and coalesce(c.insurance_checked,false) and coalesce(c.customer_site_confirmed,false)
    and coalesce(c.risk_score,100)<=70 and v_weather='safe'
    and c.pilot_id is not null and j.accepted_pilot_id=c.pilot_id and j.drone_id is not null
    and nullif(c.metadata->>'airspace_evidence','') is not null
    and nullif(c.metadata->>'site_weather_evidence','') is not null
    and v_site_at between now()-interval '30 minutes' and now()+interval '5 minutes';
  if not v_ready then
    update public.ppd_safety_checklists set checklist_status='blocked',
      required_action='Current station and site weather, airspace evidence, verified pilot and drone, insurance, customer site and risk review are required.',updated_at=now()
      where id=p_checklist_id;
    if c.safety_review_item_id is not null then
      update public.ppd_safety_review_items set review_status='blocked',reviewed_by=p_reviewer,reviewed_at=now(),
        required_action='Incomplete current safety evidence; weather status: '||v_weather,updated_at=now()
      where id=c.safety_review_item_id;
    end if;
    return jsonb_build_object('ok',false,'cleared',false,'reason','incomplete current safety evidence','weather_status',v_weather);
  end if;
  update public.ppd_safety_checklists set checklist_status='cleared',approved_by=p_reviewer,approved_at=now(),
    required_action=coalesce(p_notes,'Cleared for scheduling review; pilot final authorization required.'),updated_at=now()
    where id=p_checklist_id;
  if c.safety_review_item_id is not null then
    update public.ppd_safety_review_items set review_status='cleared',reviewed_by=p_reviewer,
      reviewed_at=now(),required_action=coalesce(p_notes,'Cleared for review.'),updated_at=now()
    where id=c.safety_review_item_id;
  end if;
  update public.jobs set safety_status='approved',updated_at=now() where id=c.job_id;
  insert into public.compliance_audit_log(module,action,reference_table,reference_id,user_id,system_action,after_data,risk_level,created_at)
  values ('safety','cleared','ppd_safety_checklists',p_checklist_id,p_reviewer,false,
    jsonb_build_object('job_id',c.job_id,'weather_status',v_weather,'site_observation_at',v_site_at),'medium',now());
  return jsonb_build_object('ok',true,'cleared',true,'checklist_id',p_checklist_id,'job_id',c.job_id);
end $$;
