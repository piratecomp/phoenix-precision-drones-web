-- Keep the dormant cycle from being picked up by a future worker until gateway and action gates are ready.
UPDATE public.ppd_ai_autopilot_schedules
SET schedule_status='paused', metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('paused_reason','Gateway and downstream action gates require validation before unattended execution'), updated_at=now()
WHERE schedule_key='main_controlled_ai_cycle' AND run_count=0 AND last_run_at IS NULL;

-- Preserve a failed status when any swallowed step error occurs.
CREATE OR REPLACE FUNCTION public.ppd_ai_run_controlled_cycle(p_run_business_brain boolean DEFAULT true, p_run_department_orchestrator boolean DEFAULT true, p_execute_low_risk boolean DEFAULT true, p_post_internal_update boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cycle_id uuid;
  v_cycle_key text := 'ppd-ai-cycle:' || to_char(now(),'YYYYMMDDHH24MISSMS') || ':' || substr(gen_random_uuid()::text,1,8);
  v_summary jsonb := '{}'::jsonb;
  v_step_result jsonb;
  v_status jsonb;
  v_health integer := 0;
  v_owner_attention integer := 0;
  v_actions_created integer := 0;
  v_actions_completed integer := 0;
  v_learning_start integer := 0;
  v_learning_end integer := 0;
  v_next_action text := 'Continue build phase; no urgent owner exception is blocking the controlled AI cycle.';
  v_message jsonb;
  v_failed boolean := false;
begin
  select count(*) into v_learning_start from public.ppd_ai_learning_events;
  insert into public.ppd_ai_operating_cycles (cycle_key, cycle_status, main_brain_version, summary)
  values (v_cycle_key, 'started', 'phase_40_controlled_ai_cycle', jsonb_build_object('started_at',now()))
  returning id into v_cycle_id;

  begin
    insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_order) values (v_cycle_id,'status_before',10);
    v_step_result := public.ppd_ai_cycle_status();
    v_failed := v_failed OR NOT coalesce((v_step_result->>'ok')::boolean,true);
    update public.ppd_ai_cycle_step_log set step_status='completed', result_payload=v_step_result, completed_at=now() where cycle_id=v_cycle_id and step_key='status_before';
    v_summary := v_summary || jsonb_build_object('status_before',v_step_result);
  exception when others then
      v_failed := true;
    update public.ppd_ai_cycle_step_log set step_status='failed', error_text=sqlerrm, completed_at=now() where cycle_id=v_cycle_id and step_key='status_before';
  end;

  if p_run_business_brain then
    begin
      insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_order) values (v_cycle_id,'business_brain_cycle',20);
      v_step_result := public.ppd_ai_business_brain_cycle();
      v_failed := v_failed OR NOT coalesce((v_step_result->>'ok')::boolean,true);
      update public.ppd_ai_cycle_step_log set step_status='completed', result_payload=v_step_result, completed_at=now() where cycle_id=v_cycle_id and step_key='business_brain_cycle';
      v_summary := v_summary || jsonb_build_object('business_brain_cycle',v_step_result);
      v_actions_created := v_actions_created + coalesce((v_step_result->>'created_count')::integer,0);
    exception when others then
      v_failed := true;
      update public.ppd_ai_cycle_step_log set step_status='failed', error_text=sqlerrm, completed_at=now() where cycle_id=v_cycle_id and step_key='business_brain_cycle';
      v_summary := v_summary || jsonb_build_object('business_brain_error',sqlerrm);
    end;
  else
    insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_status, step_order, result_payload, completed_at) values (v_cycle_id,'business_brain_cycle','skipped',20,jsonb_build_object('reason','disabled by caller'),now());
  end if;

  if p_run_department_orchestrator then
    begin
      insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_order) values (v_cycle_id,'department_orchestrator',30);
      v_step_result := public.ppd_ai_run_department_orchestration_cycle(p_execute_low_risk);
      v_failed := v_failed OR NOT coalesce((v_step_result->>'ok')::boolean,true);
      update public.ppd_ai_cycle_step_log set step_status='completed', result_payload=v_step_result, completed_at=now() where cycle_id=v_cycle_id and step_key='department_orchestrator';
      v_summary := v_summary || jsonb_build_object('department_orchestrator',v_step_result);
      v_actions_created := v_actions_created + coalesce((v_step_result->>'generated_actions')::integer,0);
      v_actions_completed := v_actions_completed + coalesce((v_step_result->>'executed_actions')::integer,0);
      v_owner_attention := v_owner_attention + coalesce((v_step_result->>'owner_exceptions')::integer,0);
    exception when others then
      v_failed := true;
      update public.ppd_ai_cycle_step_log set step_status='failed', error_text=sqlerrm, completed_at=now() where cycle_id=v_cycle_id and step_key='department_orchestrator';
      v_summary := v_summary || jsonb_build_object('department_orchestrator_error',sqlerrm);
    end;
  else
    insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_status, step_order, result_payload, completed_at) values (v_cycle_id,'department_orchestrator','skipped',30,jsonb_build_object('reason','disabled by caller'),now());
  end if;

  begin
    insert into public.ppd_ai_cycle_step_log (cycle_id, step_key, step_order) values (v_cycle_id,'status_after',90);
    v_status := public.ppd_ai_cycle_status();
    v_failed := v_failed OR NOT coalesce((v_status->>'ok')::boolean,true);
    v_health := public.ppd_ai_cycle_health_score(v_status);
    v_owner_attention := v_owner_attention + coalesce((v_status #>> '{counts,pending_approvals}')::integer,0) + coalesce((v_status #>> '{counts,owner_exceptions}')::integer,0);
    if coalesce((v_status #>> '{counts,failed_gateway_requests}')::integer,0) > 0 then
      v_next_action := 'Resolve AI Gateway provider or billing readiness before running live model requests.';
    elsif coalesce((v_status #>> '{counts,pending_approvals}')::integer,0) > 0 then
      v_next_action := 'Review pending owner approvals before enabling provider sends or dispatch decisions.';
    elsif coalesce((v_status #>> '{counts,department_actions_queued}')::integer,0) > 0 then
      v_next_action := 'Run Department AI Orchestrator to process queued low-risk actions.';
    else
      v_next_action := 'Continue build phase; no urgent owner exception is blocking the controlled AI cycle.';
    end if;
    update public.ppd_ai_cycle_step_log set step_status='completed', result_payload=v_status || jsonb_build_object('health_score',v_health,'next_action',v_next_action), completed_at=now() where cycle_id=v_cycle_id and step_key='status_after';
    v_summary := v_summary || jsonb_build_object('status_after',v_status,'health_score',v_health,'next_action',v_next_action);
  exception when others then
      v_failed := true;
    update public.ppd_ai_cycle_step_log set step_status='failed', error_text=sqlerrm, completed_at=now() where cycle_id=v_cycle_id and step_key='status_after';
    v_health := 0;
    v_next_action := 'Cycle status step failed; inspect step log.';
  end;

  if p_post_internal_update then
    begin
      v_message := public.ppd_ai_post_internal_update('ai_command','PPD AI controlled cycle completed','Health score: ' || coalesce(v_health,0)::text || '. Next action: ' || v_next_action,'normal','ppd_ai_operating_cycles',v_cycle_id,'Open AI Command','/portal/ai-command');
      v_summary := v_summary || jsonb_build_object('internal_update',v_message);
    exception when others then
      v_failed := true;
      v_summary := v_summary || jsonb_build_object('internal_update_error',sqlerrm);
    end;
  end if;

  if v_failed then
    v_next_action := 'Inspect failed AI cycle steps before resuming autopilot.';
    v_summary := v_summary || jsonb_build_object('cycle_failure', true, 'next_action', v_next_action);
  end if;

  select count(*) into v_learning_end from public.ppd_ai_learning_events;
  update public.ppd_ai_operating_cycles
  set cycle_status=case when v_failed then 'failed' else 'completed' end, actions_created=v_actions_created, actions_completed=v_actions_completed, owner_exceptions=v_owner_attention, learning_events=greatest(0,v_learning_end-v_learning_start), summary=v_summary, completed_at=now()
  where id=v_cycle_id;

  update public.ppd_ai_cycle_state
  set last_cycle_id=v_cycle_id, last_cycle_at=now(), last_cycle_status=case when v_failed then 'failed' else 'completed' end, last_summary=v_summary, health_score=coalesce(v_health,0), owner_attention_count=v_owner_attention, next_recommended_action=v_next_action, updated_at=now()
  where state_key='main';

  perform public.ppd_ai_log_learning_event('ppd_ai_cycle',case when v_failed then 'cycle_failed' else 'cycle_completed' end,'owner','controlled_operating_cycle','ppd_ai_operating_cycles',v_cycle_id,jsonb_build_object('cycle_key',v_cycle_key),jsonb_build_object('health_score',v_health,'actions_created',v_actions_created,'actions_completed',v_actions_completed,'owner_attention',v_owner_attention),0.25,0.85,case when v_failed then 'PPD AI controlled cycle had failed steps; inspect step log.' else 'PPD AI controlled operating cycle completed and updated system state.' end);

  return jsonb_build_object('ok',not v_failed,'cycle_id',v_cycle_id,'cycle_key',v_cycle_key,'health_score',v_health,'actions_created',v_actions_created,'actions_completed',v_actions_completed,'owner_attention_count',v_owner_attention,'next_recommended_action',v_next_action,'summary',v_summary);
exception when others then
  if v_cycle_id is not null then
    update public.ppd_ai_operating_cycles set cycle_status='failed', summary=coalesce(summary,'{}'::jsonb) || jsonb_build_object('error',sqlerrm), completed_at=now() where id=v_cycle_id;
    update public.ppd_ai_cycle_state set last_cycle_id=v_cycle_id, last_cycle_at=now(), last_cycle_status='failed', next_recommended_action='Inspect PPD AI controlled cycle failure.', updated_at=now() where state_key='main';
  end if;
  raise;
end;
$function$;
