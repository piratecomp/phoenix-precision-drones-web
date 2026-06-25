"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Gauge,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  PlaneTakeoff,
  Radio,
  Rocket,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getPortalDashboard, portalDashboards, type PortalDashboard } from "@/lib/portal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  checkDashboardAccess,
  completeTask,
  decidePpdAiApproval,
  getPortalBootstrap,
  getPpdCommandCenter,
  getPpdRoleOperationsPanel,
  markNotificationRead,
  type PortalBootstrap,
  type PortalModule,
  type PortalNotification,
  type PortalQuickAction,
  type PortalTask,
  type PpdCommandCenter,
  type PpdRoleOperationsPanel,
} from "@/lib/portalApi";
import QuotePipelinePanel from "@/components/QuotePipelinePanel";

const iconMap: Record<string, LucideIcon> = {
  owner: Gauge,
  admin: UsersRound,
  finance_payroll: BadgeDollarSign,
  maintenance: Wrench,
  safety: ShieldCheck,
  sales_marketing: BriefcaseBusiness,
  pilot_w2: PlaneTakeoff,
  pilot_1099: Radio,
  pilot_observer: HardHat,
  customer: UserRound,
};

const moduleIconMap: Record<string, LucideIcon> = {
  finance: BadgeDollarSign,
  payroll: BadgeDollarSign,
  maintenance: Wrench,
  safety: ShieldCheck,
  shield: ShieldCheck,
  sales: BriefcaseBusiness,
  marketing: BriefcaseBusiness,
  pilot: PlaneTakeoff,
  network: Radio,
  observer: HardHat,
  customer: UserRound,
  command: Gauge,
  admin: UsersRound,
  users: UsersRound,
  upload: Rocket,
  verify: ShieldCheck,
};

function DashboardIcon({ dashboardKey, size = 20 }: { dashboardKey: string; size?: number }) {
  const Icon = iconMap[dashboardKey] || LayoutDashboard;
  return <Icon size={size} />;
}

function ModuleIcon({ iconKey, size = 22 }: { iconKey?: string | null; size?: number }) {
  const Icon = (iconKey && moduleIconMap[iconKey]) || LayoutDashboard;
  return <Icon size={size} />;
}

function statusClass(status?: string | null) {
  if (!status) return "portal-live-pill";
  if (["danger", "critical", "high"].includes(status)) return "portal-live-pill danger";
  if (["warning", "medium"].includes(status)) return "portal-live-pill warning";
  if (["success", "low"].includes(status)) return "portal-live-pill success";
  return "portal-live-pill";
}

function getFallbackModules(dashboard: PortalDashboard): PortalModule[] {
  return [
    {
      module_key: `${dashboard.key}_summary`,
      title: dashboard.title,
      subtitle: dashboard.department,
      body: dashboard.description,
      status_label: dashboard.status,
      status_level: "info",
      metric_value: dashboard.path,
      metric_label: "Route",
      icon_key: dashboard.key,
      sort_order: 10,
    },
    {
      module_key: `${dashboard.key}_workflow`,
      title: "Workflow modules",
      subtitle: "Live portal shell",
      body: dashboard.workflow.join(" • "),
      status_label: "Preview",
      status_level: "warning",
      icon_key: "command",
      sort_order: 20,
    },
    {
      module_key: `${dashboard.key}_ai_scope`,
      title: "AI boundary",
      subtitle: "Controlled automation",
      body: dashboard.aiScope,
      status_label: "Protected",
      status_level: "success",
      icon_key: "shield",
      sort_order: 30,
    },
  ];
}

function getFallbackActions(dashboard: PortalDashboard): PortalQuickAction[] {
  return [
    {
      action_key: "login",
      action_label: "Login",
      action_path: "/login",
      action_type: "link",
      description: "Sign in to load Supabase-powered portal data.",
      icon_key: "verify",
      sort_order: 10,
    },
    {
      action_key: "portal_home",
      action_label: "Portal Home",
      action_path: "/portal",
      action_type: "link",
      description: "Return to the portal dashboard list.",
      icon_key: dashboard.key,
      sort_order: 20,
    },
  ];
}

function PortalLoading({ title }: { title: string }) {
  return (
    <section className="page-hero section-pad portal-foundation-hero">
      <div className="container page-hero-inner portal-loading-card">
        <Loader2 className="portal-spin" size={34} />
        <h1>{title}</h1>
        <p className="lead-copy">Loading live portal data from Supabase.</p>
      </div>
    </section>
  );
}

export function PortalIndexClient() {
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;
      if (!sessionData.session) {
        setLoading(false);
        return;
      }
      try {
        const access = await checkDashboardAccess(supabase, "/portal");
        if (!alive) return;
        setPrimaryPath(access.redirect_to || access.requested_dashboard_path || access.primary_dashboard_path || null);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Unable to check portal access.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <PortalLoading title="Checking portal access" />;

  if (primaryPath) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Portal access ready</span>
          <h1>Your Supabase session is active.</h1>
          <p className="lead-copy">Continue to your role-based dashboard. The route guard resolved your primary dashboard from Supabase.</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href={primaryPath}>Continue to Dashboard</Link>
            <Link className="ghost-btn" href="/login">Switch account</Link>
          </div>
          {error && <p className="portal-error-note">{error}</p>}
        </div>
      </section>
    );
  }

  return <PortalPublicLanding configured={configured} error={error} />;
}

function PortalPublicLanding({ configured, error }: { configured: boolean; error: string | null }) {
  return (
    <>
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">PPD portal system</span>
          <h1>One operating portal. Role-based command views.</h1>
          <p className="lead-copy">Customer, pilot, maintenance, safety, finance, operations, and owner command-center dashboards are connected to the Supabase portal registry.</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/login">Login</Link>
            <Link className="ghost-btn" href="/portal/customer">Preview Customer Portal</Link>
          </div>
          {!configured && <p className="portal-error-note">Supabase browser variables are not configured yet.</p>}
          {error && <p className="portal-error-note">{error}</p>}
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-kicker">Role dashboards</span>
            <h2>Frontend routes match the Supabase portal registry.</h2>
          </div>
          <div className="portal-role-grid">
            {portalDashboards.map((dashboard) => (
              <Link className="portal-role-card panel-card" href={dashboard.path} key={dashboard.key}>
                <div className="portal-role-icon"><DashboardIcon dashboardKey={dashboard.key} /></div>
                <div>
                  <span>{dashboard.department}</span>
                  <h3>{dashboard.title}</h3>
                  <p>{dashboard.description}</p>
                  <small>{dashboard.path}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function PortalDashboardDataShell({ dashboardKey }: { dashboardKey: string }) {
  const fallbackDashboard = getPortalDashboard(dashboardKey);
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [bootstrap, setBootstrap] = useState<PortalBootstrap | null>(null);
  const [commandCenter, setCommandCenter] = useState<PpdCommandCenter | null>(null);
  const [rolePanel, setRolePanel] = useState<PpdRoleOperationsPanel | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const dashboardPath = fallbackDashboard?.path || "/portal";

  async function loadLiveData() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSessionMissing(true);
      setLoading(false);
      return;
    }

    const access = await checkDashboardAccess(supabase, dashboardPath);
    if (!access.can_access) {
      setAccessError(access.reason || "DASHBOARD_ACCESS_DENIED");
      setLoading(false);
      return;
    }

    const data = await getPortalBootstrap(supabase, dashboardPath);
    setBootstrap(data);

    try {
      const panel = await getPpdRoleOperationsPanel(supabase, data.dashboard_key || dashboardKey);
      setRolePanel(panel);
    } catch (err) {
      console.warn("Role operations panel unavailable", err);
      setRolePanel(null);
    }

    if (["owner", "admin"].includes(data.dashboard_key || dashboardKey)) {
      try {
        const command = await getPpdCommandCenter(supabase);
        setCommandCenter(command);
      } catch (err) {
        console.warn("Command center unavailable", err);
        setCommandCenter(null);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        await loadLiveData();
      } catch (err: any) {
        if (!alive) return;
        setAccessError(err?.message || "Unable to load portal dashboard.");
        setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [dashboardPath]);

  async function refresh() {
    setActionMessage("Refreshing live dashboard...");
    try {
      await loadLiveData();
      setActionMessage("Dashboard refreshed.");
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to refresh dashboard.");
    }
  }

  async function handleCompleteTask(task: PortalTask) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setActionMessage("Completing task...");
    try {
      await completeTask(supabase, task.id, "Completed from V28 portal game dashboard.");
      await refresh();
      setActionMessage("Task completed.");
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to complete task.");
    }
  }

  async function handleMarkRead(notification: PortalNotification) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setActionMessage("Updating notification...");
    try {
      await markNotificationRead(supabase, notification.id);
      await refresh();
      setActionMessage("Notification marked read.");
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to update notification.");
    }
  }

  async function handleApprovalDecision(approvalId: string, decision: "approved" | "rejected") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setActionMessage(`${decision === "approved" ? "Approving" : "Rejecting"} AI approval...`);
    try {
      await decidePpdAiApproval(supabase, approvalId, decision, `Decision made from V28 portal game UI: ${decision}.`);
      await refresh();
      setActionMessage(`AI approval ${decision}.`);
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to update AI approval.");
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const dashboard = useMemo(() => fallbackDashboard || portalDashboards[0], [fallbackDashboard]);
  const dashboardName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.dashboard_name || dashboard.title;
  const departmentName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.department_name || dashboard.department;
  const liveDashboardKey = bootstrap?.dashboard_key || dashboardKey;
  const modules = (bootstrap?.modules?.length ? bootstrap.modules : getFallbackModules(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const actions = (bootstrap?.quick_actions?.length ? bootstrap.quick_actions : getFallbackActions(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const navDashboards = bootstrap?.dashboards?.length
    ? bootstrap.dashboards.map((d: any) => ({ key: d.dashboard_key, title: d.dashboard_name, path: d.dashboard_path, role: d.dashboard_name }))
    : portalDashboards.map((d) => ({ key: d.key, title: d.title, path: d.path, role: d.department }));

  if (!fallbackDashboard) {
    return (
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <h1>Portal dashboard not found.</h1>
          <Link className="primary-btn" href="/portal">Return to Portal</Link>
        </div>
      </section>
    );
  }

  if (loading) return <PortalLoading title={`Loading ${fallbackDashboard.title}`} />;

  if (sessionMissing || accessError || bootstrap?.can_access === false) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Protected portal route</span>
          <h1>Access check complete.</h1>
          <p className="lead-copy">{sessionMissing ? "Login is required before this dashboard can load live data." : `Supabase denied this route: ${accessError || bootstrap?.reason}.`}</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href={sessionMissing ? "/login" : bootstrap?.primary_dashboard_path || "/portal"}>{sessionMissing ? "Login" : "Go to My Dashboard"}</Link>
            <Link className="ghost-btn" href="/portal">Portal Home</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-app-shell portal-live-shell">
      <aside className="portal-sidebar">
        <Link className="portal-sidebar-brand" href="/portal"><LayoutDashboard size={22} /><span>PPD Portal</span></Link>
        <nav className="portal-sidebar-nav">
          {navDashboards.map((item) => (
            <Link className={item.path === dashboardPath ? "active" : ""} href={item.path} key={item.key}><DashboardIcon dashboardKey={item.key} size={18} /><span>{item.role}</span></Link>
          ))}
        </nav>
        <div className="panel-card portal-session-card"><span className="section-kicker">System Status</span><p><span className="green-dot" /> All systems operational</p><small>Supabase {configured ? "Live" : "Preview"}</small></div>
        <button className="portal-signout" onClick={handleSignOut} type="button"><LogOut size={16} /> Sign out</button>
      </aside>

      <div className="portal-main-area">
        <div className="portal-topbar panel-card">
          <div><span className="section-kicker">{departmentName}</span><h1>{["owner", "admin"].includes(liveDashboardKey) ? "Owner Command Center" : dashboardName}</h1><p className="portal-live-subtitle">{bootstrap?.current_user?.full_name ? `Signed in as ${bootstrap.current_user.full_name}` : "Connected to Supabase portal backend."}</p></div>
          <div className="portal-live-status-stack"><div className="portal-status-pill">Live RPC</div><div className="portal-small-counts"><span>{bootstrap?.counts?.open_tasks || 0} tasks</span><span>{bootstrap?.counts?.unread_notifications || 0} alerts</span><span>{bootstrap?.counts?.entity_links || 0} links</span></div></div>
        </div>

        {actionMessage && <div className="panel-card portal-action-message">{actionMessage}</div>}

        {["owner", "admin"].includes(liveDashboardKey) && commandCenter && (
          <section className="portal-game-command-center">
            <div className="portal-game-stat-grid">
              <article className="portal-game-stat-card readiness-card"><Gauge size={28} /><span>Production Readiness</span><strong>{Math.round(Number(commandCenter.readiness?.readiness_score || 0))}<small>/100</small></strong><em>{commandCenter.readiness?.portal_ok ? "Live Operations" : "Needs Review"}</em></article>
              <article className="portal-game-stat-card"><PlaneTakeoff size={28} /><span>Active Jobs</span><strong>{commandCenter.readiness?.active_jobs ?? 0}</strong><em>Field workflow</em></article>
              <article className="portal-game-stat-card green"><UsersRound size={28} /><span>Verified Pilots</span><strong>{commandCenter.readiness?.verified_pilots ?? 0}</strong><em>Ready pilots</em></article>
              <article className="portal-game-stat-card amber"><Rocket size={28} /><span>AI Approvals</span><strong>{commandCenter.readiness?.pending_ai_approvals ?? 0}</strong><em>Review queue</em></article>
              <article className="portal-game-stat-card red"><ShieldAlert size={28} /><span>Critical Events</span><strong>{commandCenter.readiness?.open_high_or_critical_events ?? 0}</strong><em>Attention</em></article>
            </div>
            <div className="portal-game-map-and-queue">
              <article className="panel-card portal-game-map-card">
                <div className="portal-game-panel-head"><div><span className="section-kicker">Live Operations Map</span><h3>Phoenix, AZ</h3></div><span className="portal-game-live-dot">Live</span></div>
                <div className="portal-game-map-stage" aria-label="Stylized live operations map"><div className="map-route route-a" /><div className="map-route route-b" /><span className="map-pin pin-green">5</span><span className="map-pin pin-orange">442</span><span className="map-pin pin-blue">381</span><span className="map-drone drone-a"><Satellite size={18} /></span><span className="map-drone drone-b"><Satellite size={18} /></span><span className="map-zone zone-a" /><span className="map-zone zone-b" /><strong>Phoenix</strong></div>
                <div className="portal-game-map-legend"><span><i className="green-dot" /> pilots</span><span><i className="orange-dot" /> jobs</span><span><i className="blue-dot" /> drones</span></div>
              </article>
              <article className="panel-card portal-game-queue-card">
                <div className="portal-game-panel-head"><div><span className="section-kicker">AI Dispatch Queue</span><h3>Human approval required</h3></div><span>{commandCenter.pending_ai_approvals?.length || 0}</span></div>
                <div className="portal-game-approval-list">
                  {(commandCenter.pending_ai_approvals || []).length === 0 && <p>No pending AI approvals.</p>}
                  {(commandCenter.pending_ai_approvals || []).slice(0, 4).map((approval: any) => (
                    <div className="portal-game-approval-row" key={approval.id}><div><strong>{approval.action_title}</strong><span>{approval.action_summary || approval.action_type}</span><small>{approval.risk_level} · {approval.approval_status}</small></div><div className="approval-buttons"><button type="button" onClick={() => handleApprovalDecision(approval.id, "approved")}>Approve</button><button type="button" onClick={() => handleApprovalDecision(approval.id, "rejected")}>Reject</button></div></div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        <QuotePipelinePanel dashboardKey={liveDashboardKey} />

        {rolePanel && (
          <section className="portal-role-ops-board panel-card">
            <div className="portal-game-panel-head"><div><span className="section-kicker">Role Operations Board</span><h3>{rolePanel.dashboard_key || liveDashboardKey} command workflow</h3></div><span className="portal-game-live-dot">Synced</span></div>
            <div className="portal-role-ops-card-grid">{(rolePanel.cards || []).map((card, index) => <article className="portal-role-ops-stat" key={`${card.title || "card"}-${index}`}><span>{card.title}</span><strong>{card.value ?? 0}</strong><em>{card.label}</em></article>)}</div>
            <div className="portal-role-ops-list">{(rolePanel.items || []).length === 0 && <p>No controlled workflow items are waiting for this dashboard.</p>}{(rolePanel.items || []).slice(0, 8).map((item: any, index: number) => <div className="portal-role-ops-row" key={item.id || `${item.title}-${index}`}><div><strong>{item.title || item.type || item.source || "Workflow item"}</strong><span>{item.summary || item.next_step || item.required_action || item.status || "Controlled workflow item"}</span><small>{item.status || item.risk_level || item.type || "tracked"} {item.readiness_score !== undefined ? `· ${item.readiness_score}/100` : ""}</small></div><span className="service-button-status">{item.source || item.type || "Tracked"}</span></div>)}</div>
          </section>
        )}

        <div className="portal-dashboard-grid live-module-grid">{modules.map((module) => <article className="panel-card portal-live-module-card" key={module.module_key}><div className="portal-module-head"><div className="portal-role-icon"><ModuleIcon iconKey={module.icon_key} /></div><span className={statusClass(module.status_level)}>{module.status_label || module.module_type || "Module"}</span></div><h3>{module.title}</h3>{module.subtitle && <small>{module.subtitle}</small>}{module.body && <p>{module.body}</p>}{(module.metric_value || module.metric_label) && <div className="portal-module-metric"><strong>{module.metric_value}</strong><span>{module.metric_label}</span></div>}{module.action_label && module.action_path && <Link className="ghost-btn compact-portal-btn" href={module.action_path}>{module.action_label}</Link>}</article>)}</div>

        <div className="portal-dashboard-grid two-col portal-operating-grid"><article className="panel-card portal-workflow-card"><span className="section-kicker">Quick actions</span><h3>Dashboard actions</h3><div className="portal-action-list">{actions.map((action) => <Link href={action.action_path || dashboardPath} className="portal-action-row" key={action.action_key}><ModuleIcon iconKey={action.icon_key} size={18} /><div><strong>{action.action_label}</strong>{action.description && <span>{action.description}</span>}</div></Link>)}</div></article><article className="panel-card portal-workflow-card"><span className="section-kicker">Permissions</span><h3>Current access scope</h3><p>Supabase returned {bootstrap?.permissions?.length || 0} permission records and {bootstrap?.dashboards?.length || 0} accessible dashboards for this session.</p><div className="portal-tag-row">{(bootstrap?.permissions || []).slice(0, 8).map((permission: any) => <span key={`${permission.permission_key}-${permission.role_key}`}>{permission.permission_key}</span>)}</div></article></div>

        <div className="portal-dashboard-grid two-col portal-operating-grid"><article className="panel-card portal-workflow-card"><span className="section-kicker">Task queue</span><h3>Visible tasks</h3><div className="portal-task-list">{(bootstrap?.tasks || []).length === 0 && <p>No open tasks for this dashboard right now.</p>}{(bootstrap?.tasks || []).slice(0, 5).map((task) => <div className="portal-task-row" key={task.id}><div><strong>{task.task_title}</strong><span>{task.task_summary || task.department_name || task.task_type}</span><small>{task.priority} · {task.task_status}</small></div><button type="button" onClick={() => handleCompleteTask(task)}><CheckCircle2 size={16} /> Complete</button></div>)}</div></article><article className="panel-card portal-workflow-card"><span className="section-kicker">Notifications</span><h3>Unread notifications</h3><div className="portal-task-list">{(bootstrap?.notifications || []).length === 0 && <p>No unread notifications.</p>}{(bootstrap?.notifications || []).slice(0, 5).map((notification) => <div className="portal-task-row" key={notification.id}><div><strong>{notification.notification_title}</strong><span>{notification.notification_body || notification.notification_type}</span><small>{notification.priority} · {notification.notification_status}</small></div><button type="button" onClick={() => handleMarkRead(notification)}><Bell size={16} /> Read</button></div>)}</div></article></div>

        <div className="panel-card portal-next-card"><span className="section-kicker">Entity bridge</span><h3>Profile links</h3><p>Supabase returned {bootstrap?.entity_links?.length || 0} verified bridge links for this user. These connect portal users to customers, pilots, employees, and internal staff records.</p><div className="portal-tag-row">{(bootstrap?.entity_links || []).map((link: any) => <span key={link.id || `${link.link_type}-${link.entity_id}`}>{link.link_type}: {link.entity_table}</span>)}</div></div>
      </div>
    </section>
  );
}
