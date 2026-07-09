import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalModule = {
  dashboard_key?: string;
  module_key: string;
  module_type?: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  status_label?: string | null;
  status_level?: string | null;
  metric_value?: string | null;
  metric_label?: string | null;
  action_label?: string | null;
  action_path?: string | null;
  icon_key?: string | null;
  sort_order?: number;
};

export type PortalQuickAction = {
  dashboard_key?: string;
  action_key: string;
  action_label: string;
  action_path?: string | null;
  action_type?: string | null;
  description?: string | null;
  icon_key?: string | null;
  sort_order?: number;
};

export type PortalTask = {
  id: string;
  task_title: string;
  task_summary?: string | null;
  department_key?: string | null;
  department_name?: string | null;
  dashboard_key?: string | null;
  role_key?: string | null;
  task_type?: string | null;
  task_status?: string | null;
  priority?: string | null;
  severity?: string | null;
  ai_generated?: boolean;
  requires_human_review?: boolean;
  created_at?: string;
};

export type PortalNotification = {
  id: string;
  notification_title: string;
  notification_body?: string | null;
  notification_type?: string | null;
  notification_status?: string | null;
  priority?: string | null;
  dashboard_key?: string | null;
  action_label?: string | null;
  action_path?: string | null;
  related_task_id?: string | null;
  created_at?: string;
};

export type PortalDashboardAccess = {
  authenticated: boolean;
  can_access: boolean;
  reason: string;
  requested_dashboard_path?: string;
  primary_dashboard_path?: string;
  dashboard_key?: string | null;
  redirect_to?: string | null;
  event_id?: string;
};

export type PortalBootstrap = {
  authenticated: boolean;
  can_access: boolean;
  reason: string;
  current_user?: {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    legacy_role?: string;
    pilot_type?: string;
    status?: string;
  } | null;
  primary_dashboard_path?: string;
  requested_dashboard_path?: string;
  dashboard_key?: string | null;
  feature_flags?: any[];
  dashboards?: any[];
  permissions?: any[];
  modules?: PortalModule[];
  quick_actions?: PortalQuickAction[];
  tasks?: PortalTask[];
  notifications?: PortalNotification[];
  entity_links?: any[];
  counts?: {
    open_tasks?: number;
    unread_notifications?: number;
    entity_links?: number;
  };
};

export type PpdCommandCenter = {
  ok?: boolean;
  readiness?: any;
  modules?: any[];
  open_events?: any[];
  pending_ai_approvals?: any[];
  active_workflows?: any[];
  portal_tasks?: any[];
  notifications?: any[];
  generated_at?: string;
};

export type PpdRoleOperationsPanel = {
  ok?: boolean;
  dashboard_key?: string;
  stats?: Record<string, any>;
  cards?: Array<{ title?: string; value?: any; label?: string }>;
  items?: Array<Record<string, any>>;
  generated_at?: string;
};

export type PpdDashboardAppSnapshot = {
  ok?: boolean;
  dashboard_key?: string;
  executive_scope?: boolean;
  generated_at?: string;
  counts?: Record<string, any>;
  cards?: Array<{ title?: string; value?: any; label?: string }>;
  fleet?: { drones?: Array<Record<string, any>> };
  communications?: {
    threads?: Array<Record<string, any>>;
    messages?: Array<Record<string, any>>;
    voice_calls?: Array<Record<string, any>>;
    communication_queue?: Array<Record<string, any>>;
    email_queue?: Array<Record<string, any>>;
    email_outbox?: Array<Record<string, any>>;
    unified_events?: Array<Record<string, any>>;
  };
  launch?: { items?: Array<Record<string, any>> };
  funding?: { applications?: Array<Record<string, any>>; opportunities?: Array<Record<string, any>> };
  notifications?: Array<Record<string, any>>;
};

export type CustomerDashboardSnapshot = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  viewer?: Record<string, any>;
  selected_customer_id?: string | null;
  customer?: { id?: string; name?: string | null; email?: string | null; created_at?: string } | null;
  customers?: Array<Record<string, any>>;
  counts?: Record<string, any>;
  intakes?: Array<Record<string, any>>;
  quotes?: Array<Record<string, any>>;
  jobs?: Array<Record<string, any>>;
  deliveries?: Array<Record<string, any>>;
  invoices?: Array<Record<string, any>>;
  timeline?: Array<Record<string, any>>;
};

export type PpdQuotePipelinePanel = {
  ok?: boolean;
  dashboard_key?: string;
  viewer_mode?: "staff" | "customer" | string;
  stats?: Record<string, any>;
  quotes?: Array<Record<string, any>>;
  intakes_without_quotes?: Array<Record<string, any>>;
  generated_at?: string;
};

export type PpdVoiceFollowupCall = {
  id: string;
  provider_call_sid?: string | null;
  caller_number?: string | null;
  called_number?: string | null;
  call_status?: string | null;
  caller_intent?: string | null;
  summary?: string | null;
  transcript?: string | null;
  quote_intake_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  updated_at?: string | null;
  needs_follow_up?: boolean;
  follow_up_note?: string | null;
  next_action?: string | null;
  latest_service_key?: string | null;
  latest_voice_response?: string | null;
  latest_turn_number?: string | number | null;
};

export type PpdVoiceFollowupPanel = {
  ok?: boolean;
  dashboard_key?: string;
  total_recent_calls?: number;
  open_voice_followups?: number;
  calls?: PpdVoiceFollowupCall[];
  generated_at?: string;
};

export async function rpc<T>(supabase: SupabaseClient, name: string, args?: Record<string, any>) {
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw error;
  return data as T;
}

export async function checkDashboardAccess(supabase: SupabaseClient, dashboardPath: string): Promise<PortalDashboardAccess> {
  return rpc<PortalDashboardAccess>(supabase, "portal_check_dashboard_access", {
    p_dashboard_path: dashboardPath,
    p_metadata: { source: "v20_portal_game_ui" },
  });
}

export async function getPortalBootstrap(supabase: SupabaseClient, dashboardPath: string): Promise<PortalBootstrap> {
  return rpc<PortalBootstrap>(supabase, "portal_get_bootstrap", { p_dashboard_path: dashboardPath });
}

export async function markNotificationRead(supabase: SupabaseClient, notificationId: string) {
  return rpc<boolean>(supabase, "portal_mark_notification_read", { p_notification_id: notificationId });
}

export async function completeTask(supabase: SupabaseClient, taskId: string, resolution?: string) {
  return rpc<boolean>(supabase, "portal_complete_task", {
    p_task_id: taskId,
    p_resolution: resolution || "Completed from portal dashboard.",
  });
}

export async function addTaskComment(supabase: SupabaseClient, taskId: string, comment: string) {
  return rpc<string>(supabase, "portal_add_task_comment", {
    p_task_id: taskId,
    p_comment_body: comment,
    p_comment_type: "note",
    p_internal_only: true,
    p_metadata: { source: "v20_portal_game_ui" },
  });
}

export async function getPpdCommandCenter(supabase: SupabaseClient): Promise<PpdCommandCenter> {
  return rpc<PpdCommandCenter>(supabase, "ppd_get_command_center");
}

export async function getPpdRoleOperationsPanel(
  supabase: SupabaseClient,
  dashboardKey: string
): Promise<PpdRoleOperationsPanel> {
  return rpc<PpdRoleOperationsPanel>(supabase, "ppd_get_role_operations_panel", {
    p_dashboard_key: dashboardKey,
  });
}

export async function getPpdDashboardAppSnapshot(
  supabase: SupabaseClient,
  dashboardKey: string
): Promise<PpdDashboardAppSnapshot> {
  return rpc<PpdDashboardAppSnapshot>(supabase, "ppd_get_dashboard_app_snapshot", {
    p_dashboard_key: dashboardKey,
  });
}

export async function getCustomerDashboardSnapshot(
  supabase: SupabaseClient,
  customerId?: string | null
): Promise<CustomerDashboardSnapshot> {
  return rpc<CustomerDashboardSnapshot>(supabase, "ppd_get_customer_dashboard_snapshot", {
    p_customer_id: customerId || null,
  });
}

export async function submitCustomerQuoteIntake(
  supabase: SupabaseClient,
  payload: Record<string, any>
) {
  return rpc<any>(supabase, "ppd_customer_submit_quote_intake", {
    p_payload: payload || {},
  });
}

export async function getPpdQuotePipelinePanel(
  supabase: SupabaseClient,
  dashboardKey: string
): Promise<PpdQuotePipelinePanel> {
  return rpc<PpdQuotePipelinePanel>(supabase, "ppd_get_sales_pipeline_panel", {
    p_dashboard_key: dashboardKey,
    p_limit: 20,
  });
}

export async function getPpdVoiceFollowupPanel(
  supabase: SupabaseClient,
  dashboardKey: string,
  limit = 12
): Promise<PpdVoiceFollowupPanel> {
  return rpc<PpdVoiceFollowupPanel>(supabase, "ppd_get_voice_followup_panel", {
    p_dashboard_key: dashboardKey,
    p_limit: limit,
  });
}

export async function acceptPpdQuote(
  supabase: SupabaseClient,
  quoteId: string,
  viewerMode?: string,
  jobAddress?: string | null
) {
  const fn = viewerMode === "staff" ? "ppd_accept_quote_and_create_job" : "ppd_customer_accept_quote";
  return rpc<any>(supabase, fn, {
    p_quote_id: quoteId,
    p_acceptance_payload: {
      source: viewerMode === "staff" ? "staff_quote_dashboard" : "customer_quote_dashboard",
      job_address: jobAddress || null,
    },
  });
}

export async function decidePpdAiApproval(
  supabase: SupabaseClient,
  approvalId: string,
  decision: "approved" | "rejected" | "cancelled",
  notes?: string
) {
  return rpc<any>(supabase, "ppd_decide_ai_approval", {
    p_approval_id: approvalId,
    p_decision: decision,
    p_notes: notes || null,
  });
}
