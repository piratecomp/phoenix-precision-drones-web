CREATE OR REPLACE FUNCTION public.ppd_can_access_internal_thread(p_thread_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := public.portal_current_public_user_id();
BEGIN
  IF v_user IS NULL THEN RETURN false; END IF;
  IF public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.ppd_internal_message_threads WHERE id=p_thread_id);
  END IF;
  IF public.portal_current_user_has_role('customer') THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.ppd_internal_message_threads t
    WHERE t.id=p_thread_id
      AND (
        t.department_key = public.ppd_role_to_department(public.ppd_current_primary_role())
        OR EXISTS (
          SELECT 1 FROM public.ppd_internal_thread_participants p
          WHERE p.thread_id=t.id
            AND (p.user_id=v_user OR p.role_key=ANY(public.ppd_current_user_role_keys()))
        )
      )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_role_operations_panel(p_dashboard_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text := coalesce(p_dashboard_key, 'owner');
  v_stats jsonb := '{}'::jsonb;
  v_cards jsonb := '[]'::jsonb;
  v_items jsonb := '[]'::jsonb;
  v_user uuid := public.portal_current_public_user_id();
  v_staff boolean := public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin');
  v_customer uuid;
begin
  if not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role('safety') or public.portal_current_user_has_role('maintenance') or public.portal_current_user_has_role('finance_payroll') or public.portal_current_user_has_role('pilot_w2') or public.portal_current_user_has_role('pilot_1099') or public.portal_current_user_has_role('customer')) then
    raise exception 'PPD access denied: portal role required';
  end if;

  if not v_staff and not public.portal_current_user_has_role(v_key) then
    raise exception 'PPD access denied: dashboard role mismatch' using errcode='42501';
  end if;
  if v_key = 'customer' then
    v_customer := public.ppd_resolve_customer_for_portal(NULL);
  end if;
  perform public.ppd_sync_role_operations_panels();

  if v_key in ('customer') then
    select jsonb_build_object('packages', count(*), 'in_review', count(*) filter (where delivery_status in ('draft','review','approved')), 'released', count(*) filter (where delivery_status in ('released','delivered')), 'blocked', count(*) filter (where delivery_status='blocked')) into v_stats from public.ppd_customer_delivery_packages where customer_id = v_customer and delivery_status in ('released','delivered','ready');
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) into v_items from (select id, package_title as title, delivery_status as status, package_type as type, release_notes as summary, job_id, created_at from public.ppd_customer_delivery_packages where customer_id = v_customer and delivery_status in ('released','delivered','ready') order by created_at desc limit 10) x;
    v_cards := jsonb_build_array(jsonb_build_object('title','Delivery Packages','value',v_stats->>'packages','label','Total'), jsonb_build_object('title','Under Review','value',v_stats->>'in_review','label','Needs approval'), jsonb_build_object('title','Released','value',v_stats->>'released','label','Customer ready'));
  elsif v_key in ('pilot_w2','pilot_1099','pilot_observer','pilot-network') then
    select jsonb_build_object('pilots', count(*), 'verified', count(*) filter (where verification_status='verified'), 'needs_review', count(*) filter (where verification_status='needs_review'), 'avg_score', coalesce(round(avg(readiness_score),0),0)) into v_stats from public.ppd_pilot_verification_tasks where v_staff or pilot_id = v_user;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.readiness_score desc, x.created_at desc), '[]'::jsonb) into v_items from (select id, 'Pilot verification' as title, verification_status as status, readiness_score, next_step as summary, part107_status, insurance_status, drone_status, created_at from public.ppd_pilot_verification_tasks where v_staff or pilot_id = v_user order by readiness_score desc, created_at desc limit 10) x;
    v_cards := jsonb_build_array(jsonb_build_object('title','Verified Pilots','value',v_stats->>'verified','label','Ready'), jsonb_build_object('title','Needs Review','value',v_stats->>'needs_review','label','Verification'), jsonb_build_object('title','Avg Score','value',v_stats->>'avg_score','label','Readiness'));
  elsif v_key in ('safety') then
    select jsonb_build_object('open', count(*) filter (where review_status in ('open','in_review')), 'blocked', count(*) filter (where review_status='blocked'), 'critical', count(*) filter (where risk_level='critical'), 'cleared', count(*) filter (where review_status='cleared')) into v_stats from public.ppd_safety_review_items;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) into v_items from (select id, title, review_status as status, risk_level, risk_score, summary, required_action, job_id, created_at from public.ppd_safety_review_items order by created_at desc limit 10) x;
    v_cards := jsonb_build_array(jsonb_build_object('title','Open Reviews','value',v_stats->>'open','label','Safety'), jsonb_build_object('title','Blocked','value',v_stats->>'blocked','label','No dispatch'), jsonb_build_object('title','Critical','value',v_stats->>'critical','label','Immediate'));
  elsif v_key in ('finance_payroll','finance') then
    select jsonb_build_object('open', count(*) filter (where finance_status in ('open','in_review')), 'sent', count(*) filter (where finance_status='sent'), 'paid', count(*) filter (where finance_status='paid'), 'amount_open', coalesce(sum(amount) filter (where finance_status not in ('paid','closed')),0)) into v_stats from public.ppd_finance_control_items;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) into v_items from (select id, title, finance_status as status, finance_type as type, amount, summary, next_step, invoice_id, created_at from public.ppd_finance_control_items order by created_at desc limit 10) x;
    v_cards := jsonb_build_array(jsonb_build_object('title','Open Finance','value',v_stats->>'open','label','Review'), jsonb_build_object('title','Sent','value',v_stats->>'sent','label','Invoices'), jsonb_build_object('title','Paid','value',v_stats->>'paid','label','Closed'));
  else
    select jsonb_build_object('delivery_review', (select count(*) from public.ppd_customer_delivery_packages where delivery_status in ('draft','review','approved')), 'pilot_review', (select count(*) from public.ppd_pilot_verification_tasks where verification_status='needs_review'), 'safety_open', (select count(*) from public.ppd_safety_review_items where review_status in ('open','in_review','blocked')), 'finance_open', (select count(*) from public.ppd_finance_control_items where finance_status in ('open','in_review'))) into v_stats;
    v_cards := jsonb_build_array(jsonb_build_object('title','Deliverables','value',v_stats->>'delivery_review','label','Review'), jsonb_build_object('title','Pilot Verification','value',v_stats->>'pilot_review','label','Needs review'), jsonb_build_object('title','Safety Items','value',v_stats->>'safety_open','label','Open'), jsonb_build_object('title','Finance Items','value',v_stats->>'finance_open','label','Open'));
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) into v_items from (select id, title, status, source, summary, created_at from (select id, package_title as title, delivery_status as status, 'deliverables' as source, release_notes as summary, created_at from public.ppd_customer_delivery_packages union all select id, 'Pilot verification' as title, verification_status as status, 'pilot_network' as source, next_step as summary, created_at from public.ppd_pilot_verification_tasks union all select id, title, review_status as status, 'safety' as source, required_action as summary, created_at from public.ppd_safety_review_items union all select id, title, finance_status as status, 'finance' as source, next_step as summary, created_at from public.ppd_finance_control_items) u order by created_at desc limit 12) x;
  end if;

  return jsonb_build_object('ok', true, 'dashboard_key', v_key, 'stats', v_stats, 'cards', v_cards, 'items', v_items, 'generated_at', now());
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_internal_inbox(p_dashboard_key text DEFAULT NULL::text, p_limit integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := public.portal_current_public_user_id();
  v_role text := public.ppd_current_primary_role();
  v_dept text := public.ppd_role_to_department(v_role);
  v_dashboard text := coalesce(p_dashboard_key, v_dept);
  v_threads jsonb;
  v_unread integer := 0;
begin
  if v_user is null then
    raise exception 'PPD internal inbox requires authenticated portal user';
  end if;

  if public.portal_current_user_has_role('customer') and not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin')) then
    raise exception 'PPD access denied: internal inbox is staff only' using errcode='42501';
  end if;
  perform public.ppd_seed_internal_threads();

  with visible_threads as (
    select t.*
    from public.ppd_internal_message_threads t
    where public.ppd_can_access_internal_thread(t.id)
  ), last_messages as (
    select distinct on (m.thread_id)
      m.thread_id, m.id as last_message_id, m.message_body as last_message_body, m.sender_display_name as last_sender, m.sender_type, m.created_at as last_message_created_at
    from public.ppd_internal_messages m
    join visible_threads vt on vt.id=m.thread_id
    order by m.thread_id, m.created_at desc
  ), unread as (
    select m.thread_id, count(*)::int as unread_count
    from public.ppd_internal_messages m
    join visible_threads vt on vt.id=m.thread_id
    left join public.ppd_internal_message_reads r on r.message_id=m.id and r.user_id=v_user
    where r.id is null and coalesce(m.sender_user_id,'00000000-0000-0000-0000-000000000000'::uuid) <> v_user
    group by m.thread_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', vt.id,
    'thread_key', vt.thread_key,
    'thread_title', vt.thread_title,
    'thread_type', vt.thread_type,
    'department_key', vt.department_key,
    'priority', vt.priority,
    'thread_status', vt.thread_status,
    'last_message_id', lm.last_message_id,
    'last_message_body', lm.last_message_body,
    'last_sender', lm.last_sender,
    'last_sender_type', lm.sender_type,
    'last_message_created_at', lm.last_message_created_at,
    'unread_count', coalesce(u.unread_count,0)
  ) order by coalesce(lm.last_message_created_at, vt.updated_at) desc), '[]'::jsonb)
  into v_threads
  from visible_threads vt
  left join last_messages lm on lm.thread_id=vt.id
  left join unread u on u.thread_id=vt.id
  limit greatest(1, least(coalesce(p_limit,30), 100));

  select coalesce(sum((x->>'unread_count')::int),0) into v_unread from jsonb_array_elements(v_threads) x;

  return jsonb_build_object('ok',true,'dashboard_key',v_dashboard,'user_id',v_user,'primary_role',v_role,'department_key',v_dept,'unread_count',v_unread,'threads',v_threads,'generated_at',now());
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_internal_thread(p_thread_id uuid, p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := public.portal_current_public_user_id();
  v_thread jsonb;
  v_messages jsonb;
begin
  if v_user is null then raise exception 'PPD thread requires authenticated portal user'; end if;

  if not public.ppd_can_access_internal_thread(p_thread_id) then
    raise exception 'PPD access denied: internal thread membership required' using errcode='42501';
  end if;
  select to_jsonb(t) into v_thread from public.ppd_internal_message_threads t where t.id=p_thread_id;
  if v_thread is null then raise exception 'Internal thread not found'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at asc), '[]'::jsonb) into v_messages
  from (
    select id, thread_id, sender_user_id, sender_type, sender_role_key, sender_display_name, message_type, message_body, action_label, action_path, priority, requires_ack, related_table, related_id, created_at
    from public.ppd_internal_messages
    where thread_id=p_thread_id
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit,50), 100))
  ) x;

  insert into public.ppd_internal_message_reads (message_id, user_id)
  select (m->>'id')::uuid, v_user from jsonb_array_elements(v_messages) m
  on conflict do nothing;

  update public.ppd_internal_thread_participants set last_read_at=now() where thread_id=p_thread_id and user_id=v_user;

  return jsonb_build_object('ok',true,'thread',v_thread,'messages',v_messages,'generated_at',now());
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_send_internal_message(p_thread_id uuid, p_message_body text, p_message_type text DEFAULT 'message'::text, p_action_label text DEFAULT NULL::text, p_action_path text DEFAULT NULL::text, p_priority text DEFAULT 'normal'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := public.portal_current_public_user_id();
  v_role text := public.ppd_current_primary_role();
  v_name text;
  v_message_id uuid;
  v_ai_message_id uuid;
  v_thread record;
  v_body text := trim(coalesce(p_message_body, ''));
  v_ai_reply text;
begin
  if v_user is null then
    raise exception 'PPD send message requires authenticated portal user';
  end if;

  if not public.ppd_can_access_internal_thread(p_thread_id) then
    raise exception 'PPD access denied: internal thread membership required' using errcode='42501';
  end if;
  if length(v_body) = 0 then
    raise exception 'Message body is required';
  end if;

  select *
  into v_thread
  from public.ppd_internal_message_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Internal thread not found';
  end if;

  select coalesce(full_name, email, 'PPD User')
  into v_name
  from public.users
  where id = v_user;

  v_name := coalesce(v_name, 'PPD User');

  insert into public.ppd_internal_messages (
    thread_id,
    sender_user_id,
    sender_role_key,
    sender_type,
    sender_display_name,
    message_type,
    message_body,
    action_label,
    action_path,
    priority,
    metadata
  ) values (
    p_thread_id,
    v_user,
    v_role,
    'user',
    v_name,
    coalesce(p_message_type, 'message'),
    v_body,
    p_action_label,
    p_action_path,
    coalesce(p_priority, 'normal'),
    jsonb_build_object(
      'source', 'portal_dashboard',
      'ai_reply_requested', true
    )
  )
  returning id into v_message_id;

  insert into public.ppd_internal_message_reads (message_id, user_id)
  values (v_message_id, v_user)
  on conflict do nothing;

  if coalesce(v_thread.ai_enabled, true) then
    v_ai_reply := public.ppd_internal_ai_response(
      p_thread_id,
      v_body,
      v_name
    );

    if length(trim(coalesce(v_ai_reply, ''))) > 0 then
      insert into public.ppd_internal_messages (
        thread_id,
        sender_user_id,
        sender_role_key,
        sender_type,
        sender_display_name,
        message_type,
        message_body,
        action_label,
        action_path,
        priority,
        metadata
      ) values (
        p_thread_id,
        null,
        'ai',
        'ai',
        'PPD AI',
        'message',
        v_ai_reply,
        null,
        null,
        coalesce(p_priority, 'normal'),
        jsonb_build_object(
          'source', 'communication_ai_internal',
          'reply_to_message_id', v_message_id,
          'thread_department', v_thread.department_key,
          'thread_title', v_thread.thread_title
        )
      )
      returning id into v_ai_message_id;
    end if;
  end if;

  update public.ppd_internal_message_threads
  set
    last_message_at = now(),
    updated_at = now(),
    thread_status = 'open'
  where id = p_thread_id;

  return jsonb_build_object(
    'ok', true,
    'message_id', v_message_id,
    'ai_message_id', v_ai_message_id,
    'thread_id', p_thread_id,
    'ai_reply', v_ai_reply
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_dashboard_app_snapshot(p_dashboard_key text DEFAULT 'owner'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_key text := coalesce(nullif(trim(p_dashboard_key), ''), 'owner');
  v_is_exec boolean := false;
  v_counts jsonb;
  v_cards jsonb;
  v_threads jsonb;
  v_messages jsonb;
  v_voice jsonb;
  v_comm_queue jsonb;
  v_email_queue jsonb;
  v_email_outbox jsonb;
  v_unified jsonb;
  v_launch jsonb;
  v_funding_apps jsonb;
  v_funding_opps jsonb;
  v_drones jsonb;
  v_notifications jsonb;
begin
  if not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or public.portal_current_user_has_role(v_key)) then
    raise exception 'PPD dashboard snapshot access denied';
  end if;

  v_is_exec := public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin');
  if not v_is_exec then
    raise exception 'PPD access denied: executive snapshot requires owner/admin' using errcode='42501';
  end if;

  select jsonb_build_object(
    'users',(select count(*) from public.users),
    'jobs',(select count(*) from public.jobs),
    'active_jobs',(select count(*) from public.jobs where coalesce(status::text,'') in ('active','scheduled','in_progress','assigned')),
    'drones',(select count(*) from public.drones),
    'active_drones',(select count(*) from public.drones where coalesce(operational_status,status::text,'') in ('active','in_service','ready','available')),
    'marketplace_pilots',(select count(*) from public.marketplace_pilots),
    'verified_marketplace_pilots',(select count(*) from public.marketplace_pilots where part107_verified is true and insurance_verified is true and drone_verified is true),
    'maintenance_logs',(select count(*) from public.maintenance_logs),
    'internal_threads',(select count(*) from public.ppd_internal_message_threads),
    'internal_messages',(select count(*) from public.ppd_internal_messages),
    'voice_call_sessions',(select count(*) from public.ppd_voice_call_sessions),
    'open_voice_followups',(select count(*) from public.ppd_voice_call_sessions where coalesce(call_status,'') in ('new','queued_for_callback','captured')),
    'launch_items',(select count(*) from public.ppd_launch_checklist),
    'launch_passed',(select count(*) from public.ppd_launch_checklist where checklist_status='passed'),
    'launch_blocked',(select count(*) from public.ppd_launch_checklist where checklist_status='blocked'),
    'funding_applications',(select count(*) from public.funding_applications),
    'funding_package_ready',(select count(*) from public.funding_applications where application_status='package_ready'),
    'funding_opportunities',(select count(*) from public.funding_opportunities),
    'portal_notifications',(select count(*) from public.portal_notifications),
    'unread_notifications',(select count(*) from public.portal_notifications where read_at is null and dismissed_at is null),
    'communication_queue_pending',(select count(*) from public.communication_queue where coalesce(status,'') in ('pending','in_progress')),
    'email_queue_pending',(select count(*) from public.email_queue where coalesce(status,'') in ('pending','in_progress')),
    'email_outbox_pending',(select count(*) from public.email_outbox where coalesce(status,'') in ('pending','paused')),
    'unified_communication_events',(select count(*) from public.ppd_unified_communication_events)
  ) into v_counts;

  v_cards := jsonb_build_array(
    jsonb_build_object('title','Active Jobs','value',v_counts->>'active_jobs','label','Live from jobs table'),
    jsonb_build_object('title','Drones Active','value',v_counts->>'active_drones','label',(v_counts->>'drones')||' total fleet records'),
    jsonb_build_object('title','Pilots Ready','value',v_counts->>'verified_marketplace_pilots','label',(v_counts->>'marketplace_pilots')||' network pilots'),
    jsonb_build_object('title','Open Voice','value',v_counts->>'open_voice_followups','label',(v_counts->>'voice_call_sessions')||' voice sessions'),
    jsonb_build_object('title','Funding Packages','value',v_counts->>'funding_package_ready','label',(v_counts->>'funding_applications')||' applications'),
    jsonb_build_object('title','Launch Passed','value',(v_counts->>'launch_passed')||'/'||(v_counts->>'launch_items'),'label',(v_counts->>'launch_blocked')||' blocked')
  );

  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_at desc nulls last),'[]'::jsonb) into v_threads from (select id,thread_title,department_key,priority,thread_status,last_message_at as sort_at from public.ppd_internal_message_threads where v_is_exec or department_key=v_key order by last_message_at desc nulls last limit 12) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_messages from (select m.id,m.thread_id,t.thread_title,t.department_key,m.sender_type,m.sender_display_name,m.message_type,left(m.message_body,260) as message_body,m.created_at from public.ppd_internal_messages m left join public.ppd_internal_message_threads t on t.id=m.thread_id where v_is_exec or t.department_key=v_key order by m.created_at desc limit 14) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_at desc nulls last),'[]'::jsonb) into v_voice from (select id,caller_number,called_number,call_status,caller_intent,coalesce(summary,left(transcript,220),'Voice session captured.') as summary,quote_intake_id,coalesce(updated_at,started_at) as sort_at from public.ppd_voice_call_sessions order by coalesce(updated_at,started_at) desc nulls last limit 12) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_comm_queue from (select id,channel,recipient,subject,intent,status,priority,created_at,processed_at,last_error from public.communication_queue order by created_at desc limit 10) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_email_queue from (select id,recipient,subject,status,created_at,processed_at,last_error from public.email_queue order by created_at desc limit 10) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_email_outbox from (select id,sender,recipient,subject,status,attempts,created_at,sent_at,last_error from public.email_outbox order by created_at desc limit 10) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_unified from (select id,channel,direction,source,sender_contact,recipient_contact,subject,left(coalesce(ai_summary,body),220) as summary,department_key,priority,processing_status,created_at from public.ppd_unified_communication_events order by created_at desc limit 12) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.phase_number,x.updated_at desc),'[]'::jsonb) into v_launch from (select id,checklist_key,phase_number,checklist_area,checklist_item,checklist_status,required_for_launch,risk_level,route_path,rpc_name,updated_at from public.ppd_launch_checklist order by phase_number,checklist_area limit 20) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into v_funding_apps from (select id,opportunity_id,application_status,assigned_owner,notes,owner_approved,submitted_at,created_at,updated_at from public.funding_applications order by updated_at desc limit 14) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc nulls last,x.updated_at desc),'[]'::jsonb) into v_funding_opps from (select id,coalesce(title,opportunity_name) as title,source_name,source_type,opportunity_status,status,score,confidence_score,deadline_date,package_status,go_status,application_url,updated_at from public.funding_opportunities order by score desc nulls last,updated_at desc limit 12) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_drones from (select id,model,serial_number,status::text as status,operational_status,total_flight_hours,created_at from public.drones order by created_at desc limit 12) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_notifications from (select id,notification_title,notification_body,notification_type,notification_status,priority,dashboard_key,action_label,action_path,created_at from public.portal_notifications where (v_is_exec or dashboard_key=v_key or recipient_role_key=v_key) and read_at is null and dismissed_at is null order by created_at desc limit 12) x;

  return jsonb_build_object('ok',true,'dashboard_key',v_key,'executive_scope',v_is_exec,'generated_at',now(),'counts',v_counts,'cards',v_cards,'fleet',jsonb_build_object('drones',v_drones),'communications',jsonb_build_object('threads',v_threads,'messages',v_messages,'voice_calls',v_voice,'communication_queue',v_comm_queue,'email_queue',v_email_queue,'email_outbox',v_email_outbox,'unified_events',v_unified),'launch',jsonb_build_object('items',v_launch),'funding',jsonb_build_object('applications',v_funding_apps,'opportunities',v_funding_opps),'notifications',v_notifications);
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_dashboard_workspace_queue(p_dashboard_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_dashboard text := coalesce(nullif(trim(p_dashboard_key),''),'owner');
  v_role record;
  v_tasks jsonb;
  v_finance jsonb := '[]'::jsonb;
  v_events jsonb;
begin
  if not (public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or (v_dashboard <> 'customer' and public.portal_current_user_has_role(v_dashboard))) then
    raise exception 'PPD access denied: workspace role mismatch' using errcode='42501';
  end if;
  select * into v_role
  from public.portal_roles
  where role_key = v_dashboard
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'type', 'department_task',
    'source', 'portal_department_tasks',
    'title', t.task_title,
    'summary', t.task_summary,
    'status', t.task_status,
    'task_status', t.task_status,
    'task_type', t.task_type,
    'priority', t.priority,
    'severity', t.severity,
    'dashboard_key', t.dashboard_key,
    'department_key', t.department_key,
    'assigned_role_key', t.assigned_role_key,
    'next_step', coalesce(t.resolution, t.task_body, 'Review task and choose a safe dashboard action.'),
    'created_at', t.created_at,
    'updated_at', t.updated_at
  ) order by case t.priority when 'critical' then 0 when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end, t.updated_at desc), '[]'::jsonb)
  into v_tasks
  from public.portal_department_tasks t
  where t.task_status in ('open','assigned','in_progress','waiting','blocked')
    and (
      t.dashboard_key = v_dashboard
      or t.assigned_role_key = v_dashboard
      or t.department_key = coalesce(v_role.department_key, v_dashboard)
    )
    and (v_dashboard not in ('pilot_w2','pilot_1099','pilot_observer') or public.portal_current_user_has_role('owner') or public.portal_current_user_has_role('admin') or (
      (t.related_pilot_id is null or t.related_pilot_id = public.portal_current_public_user_id())
      and t.related_customer_id is null
      and (t.related_job_id is null or exists (select 1 from public.jobs j where j.id=t.related_job_id and (j.accepted_pilot_id=public.portal_current_public_user_id() or exists (select 1 from public.job_crew jc where jc.job_id=j.id and jc.pilot_id=public.portal_current_public_user_id()))))
    ));

  if v_dashboard = 'finance_payroll' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', f.id,
      'type', 'finance_control_item',
      'source', 'ppd_finance_control_items',
      'title', f.title,
      'summary', f.summary,
      'status', f.finance_status,
      'finance_status', f.finance_status,
      'finance_type', f.finance_type,
      'amount', f.amount,
      'next_step', f.next_step,
      'created_at', f.created_at,
      'updated_at', f.updated_at
    ) order by f.updated_at desc), '[]'::jsonb)
    into v_finance
    from public.ppd_finance_control_items f
    where f.finance_status not in ('closed','completed','dismissed')
    limit 25;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'type', 'operational_event',
    'source', 'ppd_operational_events',
    'title', e.title,
    'summary', e.summary,
    'status', e.event_status,
    'severity', e.severity,
    'module_key', e.module_key,
    'next_step', case when e.requires_human_review then 'Review and resolve event.' else 'Monitor event.' end,
    'created_at', e.created_at
  ) order by case e.severity when 'critical' then 0 when 'danger' then 1 when 'warning' then 2 else 3 end, e.created_at desc), '[]'::jsonb)
  into v_events
  from public.ppd_operational_events e
  where e.event_status = 'open'
    and (e.module_key = v_dashboard or v_dashboard in ('owner','admin'))
  limit 25;

  return jsonb_build_object(
    'ok', true,
    'dashboard_key', v_dashboard,
    'generated_at', now(),
    'counts', jsonb_build_object(
      'department_tasks', jsonb_array_length(v_tasks),
      'finance_items', jsonb_array_length(v_finance),
      'operational_events', jsonb_array_length(v_events),
      'total_items', jsonb_array_length(v_tasks) + jsonb_array_length(v_finance) + jsonb_array_length(v_events)
    ),
    'items', v_tasks || v_finance || v_events
  );
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.ppd_can_access_internal_thread(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ppd_can_access_internal_thread(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.ppd_get_dashboard_app_snapshot(text), public.ppd_get_dashboard_workspace_queue(text), public.ppd_get_role_operations_panel(text), public.ppd_get_internal_thread(uuid,integer), public.ppd_get_internal_inbox(text,integer), public.ppd_send_internal_message(uuid,text,text,text,text,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ppd_get_dashboard_app_snapshot(text), public.ppd_get_dashboard_workspace_queue(text), public.ppd_get_role_operations_panel(text), public.ppd_get_internal_thread(uuid,integer), public.ppd_get_internal_inbox(text,integer), public.ppd_send_internal_message(uuid,text,text,text,text,text) TO authenticated, service_role;
