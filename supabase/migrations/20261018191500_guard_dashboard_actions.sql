CREATE OR REPLACE FUNCTION public.ppd_request_dashboard_action(p_dashboard_key text, p_action_key text, p_selected_item jsonb DEFAULT '{}'::jsonb, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_dashboard text := coalesce(nullif(trim(p_dashboard_key),''),'owner');
  v_action text := coalesce(nullif(trim(p_action_key),''),'review_selected_item');
  v_department text;
  v_role_key text;
  v_task_id uuid;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR (v_dashboard <> 'customer' AND public.portal_current_user_has_role(v_dashboard))) THEN
    RAISE EXCEPTION 'PPD dashboard action access denied' USING ERRCODE='42501';
  END IF;
  select role_key, department_key
  into v_role_key, v_department
  from public.portal_roles
  where role_key = v_dashboard
  limit 1;

  insert into public.portal_department_tasks (
    task_key,
    task_title,
    task_summary,
    task_body,
    department_key,
    dashboard_key,
    task_type,
    task_status,
    priority,
    severity,
    source,
    ai_generated,
    requires_human_review,
    requires_owner_review,
    requires_safety_review,
    requires_finance_review,
    assigned_role_key,
    metadata,
    created_by,
    created_at,
    updated_at
  ) values (
    'dashboard_action:' || v_dashboard || ':' || v_action || ':' || extract(epoch from now())::bigint::text,
    'Dashboard action: ' || replace(v_action,'_',' '),
    coalesce(nullif(p_note,''), p_selected_item->>'summary', p_selected_item->>'task_summary', 'Dashboard action requested.'),
    'Queued from protected dashboard command workspace. No direct execution was performed.',
    coalesce(v_department, v_dashboard),
    v_dashboard,
    'dashboard_action',
    'open',
    case when v_dashboard in ('owner','admin','finance_payroll','safety') then 'high' else 'normal' end,
    case when v_dashboard in ('owner','admin','finance_payroll','safety') then 'warning' else 'info' end,
    'dashboard_command_workspace',
    false,
    true,
    v_dashboard in ('owner','admin'),
    v_dashboard = 'safety',
    v_dashboard = 'finance_payroll',
    v_role_key,
    jsonb_build_object('action_key',v_action,'selected_item',coalesce(p_selected_item,'{}'::jsonb),'note',p_note,'safe_mode',true),
    auth.uid(),
    now(),
    now()
  ) returning id into v_task_id;

  return jsonb_build_object('ok', true, 'task_id', v_task_id, 'dashboard_key', v_dashboard, 'action_key', v_action, 'status', 'queued_for_review', 'no_direct_execution', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_sync_payroll_role_operations()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_panel jsonb;
  v_counts jsonb;
  v_items integer := 0;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_panel := public.ppd_get_payroll_control_panel(null);
  v_counts := v_panel->'counts';

  insert into public.ppd_finance_control_items (
    finance_key, finance_type, finance_status, amount, title, summary, next_step, metadata
  ) values (
    'payroll:dashboard:summary',
    'payroll_dashboard',
    case when coalesce((v_counts->>'blockers')::integer,0) > 0 then 'blocked' else 'open' end,
    0,
    'Payroll command summary',
    'W-2 ready ' || coalesce(v_counts->>'w2_ready','0') || '/' || coalesce(v_counts->>'w2_workers','0') || '. Contract pilots ready ' || coalesce(v_counts->>'contract_ready','0') || '/' || coalesce(v_counts->>'contract_workers','0') || '. Blockers: ' || coalesce(v_counts->>'blockers','0') || '.',
    case when coalesce((v_counts->>'blockers')::integer,0) > 0 then 'Resolve payroll blockers before approval/payment.' else 'Review payroll draft and approval queue.' end,
    jsonb_build_object('payroll_panel_counts', v_counts, 'generated_at', now())
  )
  on conflict (finance_key) do update set
    finance_status=excluded.finance_status,
    summary=excluded.summary,
    next_step=excluded.next_step,
    metadata=excluded.metadata,
    updated_at=now();

  v_items := v_items + 1;

  return jsonb_build_object('ok', true, 'finance_items_synced', v_items, 'counts', v_counts, 'synced_at', now());
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_update_dashboard_task_status(p_task_id uuid, p_task_status text, p_resolution text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_task record;
  v_status text := coalesce(nullif(trim(p_task_status),''),'in_progress');
  v_allowed text[] := array['open','assigned','in_progress','waiting','blocked','completed','cancelled','dismissed'];
begin
  if not (v_status = any(v_allowed)) then
    return jsonb_build_object('ok', false, 'error', 'invalid_task_status', 'status', v_status);
  end if;

  select * into v_task
  from public.portal_department_tasks
  where id = p_task_id;

  if v_task.id is null then
    return jsonb_build_object('ok', false, 'error', 'task_not_found');
  end if;

  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR (v_task.dashboard_key <> 'customer' AND public.portal_current_user_has_role(v_task.dashboard_key))) THEN
    RAISE EXCEPTION 'PPD task access denied' USING ERRCODE='42501';
  END IF;
  IF v_task.dashboard_key IN ('pilot_w2','pilot_1099','pilot_observer') AND NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin')) AND (v_task.related_customer_id IS NOT NULL OR (v_task.related_pilot_id IS NOT NULL AND v_task.related_pilot_id <> public.portal_current_public_user_id()) OR (v_task.related_job_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=v_task.related_job_id AND (j.accepted_pilot_id=public.portal_current_public_user_id() OR EXISTS (SELECT 1 FROM public.job_crew jc WHERE jc.job_id=j.id AND jc.pilot_id=public.portal_current_public_user_id()))))) THEN
    RAISE EXCEPTION 'PPD pilot task access denied' USING ERRCODE='42501';
  END IF;

  update public.portal_department_tasks
  set task_status = v_status,
      started_at = case when v_status in ('assigned','in_progress') and started_at is null then now() else started_at end,
      completed_at = case when v_status in ('completed','cancelled','dismissed') then now() else completed_at end,
      completed_by = case when v_status in ('completed','cancelled','dismissed') then auth.uid() else completed_by end,
      resolution = case when p_resolution is not null then p_resolution else resolution end,
      updated_at = now()
  where id = p_task_id;

  insert into public.ppd_operational_events (
    event_key,
    event_type,
    event_status,
    severity,
    module_key,
    source_table,
    source_record_id,
    actor_user_id,
    title,
    summary,
    payload,
    requires_human_review,
    requires_owner_review,
    created_at
  ) values (
    'dashboard_task_status:' || p_task_id::text || ':' || extract(epoch from now())::bigint::text,
    'dashboard_task_status_changed',
    'open',
    case when v_status in ('blocked','cancelled') then 'warning' else 'info' end,
    coalesce(v_task.dashboard_key, v_task.department_key),
    'portal_department_tasks',
    p_task_id,
    auth.uid(),
    'Dashboard task status changed',
    'Task moved from ' || v_task.task_status || ' to ' || v_status || '.',
    jsonb_build_object('old_status',v_task.task_status,'new_status',v_status,'resolution',p_resolution,'safe_mode',true),
    false,
    false,
    now()
  );

  return jsonb_build_object('ok', true, 'task_id', p_task_id, 'old_status', v_task.task_status, 'new_status', v_status, 'no_direct_execution', true);
end;
$function$;
