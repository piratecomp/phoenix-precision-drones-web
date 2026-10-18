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
