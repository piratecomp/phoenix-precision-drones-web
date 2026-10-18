-- Authorize quote access before returning an existing job and bind position writes to a live pilot session.
CREATE OR REPLACE FUNCTION public.ppd_accept_quote_and_create_job(p_quote_id uuid, p_acceptance_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_quote public.quotes%rowtype;
  v_customer public.customers%rowtype;
  v_service_id uuid;
  v_required_skill_id uuid;
  v_job_id uuid;
  v_address text;
  v_notes text;
  v_total numeric;
  v_deposit numeric;
  v_intake_id uuid;
  v_invoice_id uuid;
  v_current_user uuid;
  v_current_email text;
  v_is_staff boolean := false;
begin
  select * into v_quote from public.quotes where id = p_quote_id;
  if not found then raise exception 'Quote not found'; end if;

  select * into v_customer from public.customers where id = v_quote.customer_id;
  begin v_current_user := public.portal_current_public_user_id(); exception when others then v_current_user := null; end;
  select email into v_current_email from public.users where id = v_current_user;

  v_is_staff := current_setting('role', true) = 'service_role' or public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('sales_marketing');
  if not (v_is_staff or (v_current_user is not null and v_quote.customer_id = v_current_user) or (v_current_email is not null and lower(coalesce(v_customer.email,'')) = lower(v_current_email))) then raise exception 'Quote acceptance requires authorized user'; end if;

  if v_quote.job_id is not null then return jsonb_build_object('ok', true, 'quote_id', p_quote_id, 'job_id', v_quote.job_id, 'already_exists', true); end if;

  select id, project_location, project_summary into v_intake_id, v_address, v_notes from public.ppd_quote_intake_requests where quote_id = p_quote_id order by created_at desc limit 1;
  select service_id into v_service_id from public.quote_line_items where quote_id=p_quote_id order by created_at asc limit 1;
  if v_service_id is null then v_service_id := public.ppd_match_service_for_quote(coalesce(p_acceptance_payload->>'service_type','Commercial Drone Services')); end if;

  select skill_id into v_required_skill_id from public.services where id=v_service_id;
  if v_required_skill_id is null then
    v_required_skill_id := (public.ppd_ensure_quote_pipeline_catalog()->>'skill_id')::uuid;
    update public.services set skill_id=v_required_skill_id where id=v_service_id and skill_id is null;
  end if;

  v_total := coalesce(v_quote.estimated_total, 0);
  v_deposit := round(v_total * 0.25, 2);
  v_address := coalesce(nullif(p_acceptance_payload->>'job_address',''), v_address, 'Address pending - verify before dispatch');

  insert into public.jobs (customer_id, service_id, status, job_address, scheduled_start, scheduled_end, quoted_price, final_price, deposit_required, customer_notes, internal_notes, required_skill, estimated_revenue, estimated_cost, dispatch_mode, requires_manual_approval, safety_status, execution_mode, customer_type, required_skill_id)
  values (v_quote.customer_id, v_service_id, 'quote_accepted', v_address, null, null, v_total, v_total, v_deposit, v_notes, 'Created from accepted quote. Dispatch blocked until review.', (select name from public.skills where id=v_required_skill_id), v_total, round(v_total * 0.55,2), 'employee', true, 'pending_review', 'manual', 'standard', v_required_skill_id)
  returning id into v_job_id;

  insert into public.job_services (job_id, service_id, quantity, unit_price, total_price, required_skill, created_at)
  select v_job_id, qli.service_id, coalesce(qli.quantity,1)::integer, coalesce(qli.unit_price,0), coalesce(qli.total_price,0), (select name from public.skills where id=v_required_skill_id), now()
  from public.quote_line_items qli where qli.quote_id = p_quote_id;

  if not exists (select 1 from public.job_services where job_id=v_job_id) then
    insert into public.job_services (job_id, service_id, quantity, unit_price, total_price, required_skill, created_at)
    values (v_job_id, v_service_id, 1, v_total, v_total, (select name from public.skills where id=v_required_skill_id), now());
  end if;

  update public.quotes set status='accepted', job_id=v_job_id where id=p_quote_id;
  insert into public.ppd_quote_acceptance_events (quote_id, customer_id, accepted_by, acceptance_channel, acceptance_payload, job_id)
  values (p_quote_id, v_quote.customer_id, v_current_user, case when v_is_staff then 'manual' else 'portal' end, coalesce(p_acceptance_payload,'{}'::jsonb), v_job_id);
  if v_intake_id is not null then update public.ppd_quote_intake_requests set intake_status='converted', job_id=v_job_id, updated_at=now() where id=v_intake_id; end if;
  update public.ppd_communication_cases set related_job_id=v_job_id, case_status='converted_to_job', updated_at=now() where related_quote_intake_id=v_intake_id or related_quote_id=p_quote_id;
  update public.ppd_workflow_runs set job_id=v_job_id, quote_id=p_quote_id, workflow_status='job_created', current_stage='safety_and_schedule_review', next_best_action='Complete safety checklist and schedule job before dispatch.', updated_at=now() where quote_id=p_quote_id or metadata->>'intake_id'=coalesce(v_intake_id::text,'');
  perform public.ppd_generate_safety_checklist(v_job_id);
  v_invoice_id := public.generate_invoice_from_job(v_job_id);
  perform public.ppd_sync_invoice_pipeline();
  perform public.ppd_ai_post_internal_update('operations','Job created from accepted quote','A job was created from an accepted quote. Safety and scheduling review are required before dispatch.', 'high', 'jobs', v_job_id, 'Open Job', '/portal/owner');
  return jsonb_build_object('ok', true, 'quote_id', p_quote_id, 'job_id', v_job_id, 'invoice_id', v_invoice_id, 'safety_checklist_created', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_update_pilot_position(p_pilot_id uuid, p_lat numeric, p_lng numeric, p_alt numeric DEFAULT NULL::numeric, p_heading numeric DEFAULT NULL::numeric, p_speed numeric DEFAULT NULL::numeric, p_battery numeric DEFAULT NULL::numeric, p_status text DEFAULT 'active'::text, p_accuracy numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_actor uuid;
begin
  begin
    v_actor := public.portal_current_public_user_id();
  exception when others then
    v_actor := auth.uid();
  end;

  if auth.role() is distinct from 'service_role' and (
    auth.uid() is null
    or v_actor is distinct from p_pilot_id
    or not exists (
      select 1 from public.users u
      where u.id=v_actor and u.status::text='active'
        and u.role::text in ('pilot','pilot_w2','pilot_1099','pilot_observer')
    )
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if p_pilot_id is null or p_lat is null or p_lng is null then
    return jsonb_build_object('ok', false, 'error', 'pilot_id, latitude, and longitude are required');
  end if;

  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    return jsonb_build_object('ok', false, 'error', 'invalid coordinates');
  end if;

  insert into public.pilot_locations (pilot_id, latitude, longitude, updated_at)
  values (p_pilot_id, p_lat, p_lng, now())
  on conflict (pilot_id) do update set latitude=excluded.latitude, longitude=excluded.longitude, updated_at=now();

  insert into public.pilot_positions (pilot_id, latitude, longitude, heading, speed, updated_at)
  values (p_pilot_id, p_lat, p_lng, p_heading, p_speed, now())
  on conflict (pilot_id) do update set latitude=excluded.latitude, longitude=excluded.longitude, heading=excluded.heading, speed=excluded.speed, updated_at=now();

  insert into public.pilot_live_state (pilot_id, latitude, longitude, altitude, heading, speed, battery_percent, status, last_seen, updated_at)
  values (p_pilot_id, p_lat, p_lng, p_alt, p_heading, p_speed, p_battery, coalesce(p_status,'active'), now(), now())
  on conflict (pilot_id) do update set latitude=excluded.latitude, longitude=excluded.longitude, altitude=excluded.altitude, heading=excluded.heading, speed=excluded.speed, battery_percent=excluded.battery_percent, status=excluded.status, last_seen=now(), updated_at=now();

  insert into public.pilot_position_history (pilot_id, latitude, longitude, heading, speed, recorded_at)
  values (p_pilot_id, p_lat, p_lng, p_heading, p_speed, now());

  perform public.ppd_enqueue_system_event('pilot_position_updated', p_pilot_id, jsonb_build_object('lat',p_lat,'lng',p_lng,'alt',p_alt,'heading',p_heading,'speed',p_speed,'battery',p_battery,'status',p_status,'accuracy',p_accuracy), 5, 'pilot_tracking');

  return jsonb_build_object('ok', true, 'pilot_id', p_pilot_id, 'lat', p_lat, 'lng', p_lng, 'updated_at', now());
end;
$function$;
