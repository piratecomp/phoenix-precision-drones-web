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
  LockKeyhole,
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
  markNotificationRead,
  type PortalBootstrap,
  type PortalModule,
  type PortalNotification,
  type PortalQuickAction,
  type PortalTask,
  type PpdCommandCenter,
} from "@/lib/portalApi";

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
          <p className="lead-copy">
            Customer, pilot, maintenance, safety, finance, operations, and owner command-center dashboards are connected to the Supabase portal registry.
          </p>
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

export function PortalDashboardDataShell({ dashboardKey }: { dashboardKey: string }) {
  const fallbackDashboard = getPortalDashboard(dashboardKey);
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [bootstrap, setBootstrap] = useState<PortalBootstrap | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [commandCenter, setCommandCenter] = useState<PpdCommandCenter | null>(null);

  const dashboardPath = fallbackDashboard?.path || "/portal";

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
        setSessionMissing(true);
        setLoading(false);
        return;
      }
      try {
        const access = await checkDashboardAccess(supabase, dashboardPath);
        if (!alive) return;
        if (!access.can_access) {
          setAccessError(access.reason || "DASHBOARD_ACCESS_DENIED");
          setLoading(false);
          return;
        }
        const liveBootstrap = await getPortalBootstrap(supabase, dashboardPath);
        if (!alive) return;
        setBootstrap(liveBootstrap);

        const liveKey = liveBootstrap.dashboard_key || dashboardKey;
        if (["owner", "admin"].includes(liveKey)) {
          try {
            const command = await getPpdCommandCenter(supabase);
            if (alive) setCommandCenter(command);
          } catch (err) {
            console.warn("PPD command center unavailable", err);
          }
        }
      } catch (err: any) {
        if (!alive) return;
        setAccessError(err?.message || "Unable to load portal dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [dashboardKey, dashboardPath]);

  async function refreshCommandCenter() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const command = await getPpdCommandCenter(supabase);
      setCommandCenter(command);
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to refresh command center.");
    }
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleCompleteTask(task: PortalTask) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      await completeTask(supabase, task.id, "Completed from V19 portal game dashboard.");
      setActionMessage(`Completed task: ${task.task_title}`);
      setBootstrap((prev) => prev ? { ...prev, tasks: (prev.tasks || []).filter((t) => t.id !== task.id) } : prev);
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to complete task.");
    }
  }

  async function handleMarkRead(notification: PortalNotification) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      await markNotificationRead(supabase, notification.id);
      setActionMessage(`Marked notification read: ${notification.notification_title}`);
      setBootstrap((prev) => prev ? { ...prev, notifications: (prev.notifications || []).filter((n) => n.id !== notification.id) } : prev);
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to mark notification read.");
    }
  }

  async function handleApprovalDecision(approvalId: string, decision: "approved" | "rejected") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      await decidePpdAiApproval(supabase, approvalId, decision, `Decision made from V19 ${dashboardKey} dashboard.`);
      setActionMessage(`AI approval ${decision}.`);
      await refreshCommandCenter();
    } catch (err: any) {
      setActionMessage(err?.message || "Unable to update AI approval.");
    }
  }

  const dashboard = useMemo(() => fallbackDashboard || portalDashboards[0], [fallbackDashboard]);

  if (loading) return <PortalLoading title="Loading command center" />;

  if (sessionMissing) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Login required</span>
          <h1>Sign in to access this portal.</h1>
          <p className="lead-copy">This dashboard is protected by Supabase Auth and portal role checks.</p>
          <Link className="primary-btn" href="/login">Go to Login</Link>
        </div>
      </section>
    );
  }

  if (accessError) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Access blocked</span>
          <h1>Portal guard denied this dashboard.</h1>
          <p className="lead-copy">{accessError}</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/portal">Back to Portal</Link>
            <Link className="ghost-btn" href="/login">Switch account</Link>
          </div>
        </div>
      </section>
    );
  }

  const modules = (bootstrap?.modules?.length ? bootstrap.modules : getFallbackModules(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const actions = (bootstrap?.quick_actions?.length ? bootstrap.quick_actions : getFallbackActions(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const currentUser = bootstrap?.current_user;
  const isCommandDashboard = ["owner", "admin"].includes(bootstrap?.dashboard_key || dashboardKey);

  return (
    <section className="portal-live-shell">
      <aside className="portal-sidebar">
        <div className="portal-sidebar-brand">
          <DashboardIcon dashboardKey={dashboard.key} />
          <span>{dashboard.department}</span>
        </div>
        <nav className="portal-sidebar-nav">
          {portalDashboards.map((item) => (
            <Link key={item.key} href={item.path} className={item.key === dashboardKey ? "active" : ""}>
              <DashboardIcon dashboardKey={item.key} />
              {item.department}
            </Link>
          ))}
        </nav>
        <div className="panel-card portal-session-card">
          <span className="section-kicker">System Status</span>
          <p><span className="green-dot" /> All systems operational</p>
          <small>Supabase {configured ? "Live" : "Preview"}</small>
        </div>
      </aside>

      <div className="portal-main-area">
        <header className="panel-card portal-topbar">
          <div>
            <span className="section-kicker">Phoenix Precision Drones</span>
            <h1>{isCommandDashboard ? "Owner Command Center" : dashboard.title}</h1>
            <p className="portal-live-subtitle">{dashboard.description}</p>
          </div>
          <div className="portal-user-chip">
            <span>{currentUser?.full_name || currentUser?.email || "Portal User"}</span>
            <small>{currentUser?.legacy_role || dashboard.department}</small>
            <button type="button" onClick={handleLogout}><LogOut size={16} /> Logout</button>
          </div>
        </header>

        {actionMessage && <p className="portal-action-message">{actionMessage}</p>}

        {isCommandDashboard && commandCenter && (
          <section className="portal-game-command-center">
            <div className="portal-game-stat-grid">
              <article className="portal-game-stat-card readiness-card">
                <Gauge size={28} />
                <span>Production Readiness</span>
                <strong>{Math.round(Number(commandCenter.readiness?.readiness_score || 0))}<small>/100</small></strong>
                <em>{commandCenter.readiness?.portal_ok ? "Live Operations" : "Needs Review"}</em>
              </article>
              <article className="portal-game-stat-card">
                <PlaneTakeoff size={28} />
                <span>Active Jobs</span>
                <strong>{commandCenter.readiness?.active_jobs ?? 0}</strong>
                <em>Field workflow</em>
              </article>
              <article className="portal-game-stat-card green">
                <UsersRound size={28} />
                <span>Verified Pilots</span>
                <strong>{commandCenter.readiness?.verified_pilots ?? 0}</strong>
                <em>Ready pilots</em>
              </article>
              <article className="portal-game-stat-card amber">
                <Rocket size={28} />
                <span>AI Approvals</span>
                <strong>{commandCenter.readiness?.pending_ai_approvals ?? 0}</strong>
                <em>Review queue</em>
              </article>
              <article className="portal-game-stat-card red">
                <ShieldAlert size={28} />
                <span>Critical Events</span>
                <strong>{commandCenter.readiness?.open_high_or_critical_events ?? 0}</strong>
                <em>Attention</em>
              </article>
            </div>

            <div className="portal-game-map-and-queue">
              <article className="panel-card portal-game-map-card">
                <div className="portal-game-panel-head">
                  <div><span className="section-kicker">Live Operations Map</span><h3>Phoenix, AZ</h3></div>
                  <span className="portal-game-live-dot">Live</span>
                </div>
                <div className="portal-game-map-stage" aria-label="Stylized live operations map">
                  <div className="map-route route-a" />
                  <div className="map-route route-b" />
                  <span className="map-pin pin-green">5</span>
                  <span className="map-pin pin-orange">442</span>
                  <span className="map-pin pin-blue">381</span>
                  <span className="map-drone drone-a"><Satellite size={18} /></span>
                  <span className="map-drone drone-b"><Satellite size={18} /></span>
                  <span className="map-zone zone-a" />
                  <span className="map-zone zone-b" />
                  <strong>Phoenix</strong>
                </div>
                <div className="portal-game-map-legend">
                  <span><i className="green-dot" /> pilots</span>
                  <span><i className="orange-dot" /> jobs</span>
                  <span><i className="blue-dot" /> drones</span>
                </div>
              </article>

              <article className="panel-card portal-game-queue-card">
                <div className="portal-game-panel-head">
                  <div><span className="section-kicker">AI Dispatch Queue</span><h3>Human approval required</h3></div>
                  <span>{commandCenter.pending_ai_approvals?.length || 0}</span>
                </div>
                <div className="portal-game-approval-list">
                  {(commandCenter.pending_ai_approvals || []).length === 0 && <p>No pending AI approvals.</p>}
                  {(commandCenter.pending_ai_approvals || []).slice(0, 4).map((approval: any) => (
                    <div className="portal-game-approval-row" key={approval.id}>
                      <div>
                        <strong>{approval.action_title}</strong>
                        <span>{approval.action_summary || approval.action_type}</span>
                        <small>{approval.risk_level} · {approval.approval_status}</small>
                      </div>
                      <div className="approval-buttons">
                        <button type="button" onClick={() => handleApprovalDecision(approval.id, "approved")}>Approve</button>
                        <button type="button" onClick={() => handleApprovalDecision(approval.id, "rejected")}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        <div className="portal-dashboard-grid live-module-grid">
          {modules.map((module) => (
            <article className="panel-card portal-live-module-card" key={module.module_key}>
              <div className="portal-module-head">
                <div className="portal-role-icon"><ModuleIcon iconKey={module.icon_key} /></div>
                <span className={statusClass(module.status_level)}>{module.status_label || module.module_type || "Module"}</span>
              </div>
              <h3>{module.title}</h3>
              {module.subtitle && <small>{module.subtitle}</small>}
              {module.body && <p>{module.body}</p>}
              {(module.metric_value || module.metric_label) && (
                <div className="portal-module-metric">
                  <strong>{module.metric_value}</strong>
                  <span>{module.metric_label}</span>
                </div>
              )}
              {module.action_label && module.action_path && <Link className="ghost-btn compact-portal-btn" href={module.action_path}>{module.action_label}</Link>}
            </article>
          ))}
        </div>

        <div className="portal-dashboard-grid two-col portal-operating-grid">
          <article className="panel-card portal-workflow-card">
            <span className="section-kicker">Quick actions</span>
            <h3>Dashboard actions</h3>
            <div className="portal-action-list">
              {actions.map((action) => (
                <Link href={action.action_path || dashboardPath} className="portal-action-row" key={action.action_key}>
                  <ModuleIcon iconKey={action.icon_key} size={18} />
                  <div>
                    <strong>{action.action_label}</strong>
                    {action.description && <span>{action.description}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="panel-card portal-workflow-card">
            <span className="section-kicker">Permissions</span>
            <h3>Current access scope</h3>
            <p>Supabase returned {bootstrap?.permissions?.length || 0} permission records and {bootstrap?.dashboards?.length || 0} accessible dashboards for this session.</p>
            <div className="portal-tag-row">
              {(bootstrap?.permissions || []).slice(0, 8).map((permission: any) => <span key={`${permission.permission_key}-${permission.role_key}`}>{permission.permission_key}</span>)}
            </div>
          </article>
        </div>

        <div className="portal-dashboard-grid two-col portal-operating-grid">
          <article className="panel-card portal-workflow-card">
            <span className="section-kicker">Task queue</span>
            <h3>Visible tasks</h3>
            <div className="portal-task-list">
              {(bootstrap?.tasks || []).length === 0 && <p>No open tasks for this dashboard right now.</p>}
              {(bootstrap?.tasks || []).slice(0, 5).map((task) => (
                <div className="portal-task-row" key={task.id}>
                  <div>
                    <strong>{task.task_title}</strong>
                    <span>{task.task_summary || task.department_name || task.task_type}</span>
                    <small>{task.priority} · {task.task_status}</small>
                  </div>
                  <button type="button" onClick={() => handleCompleteTask(task)}><CheckCircle2 size={16} /> Complete</button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card portal-workflow-card">
            <span className="section-kicker">Notifications</span>
            <h3>Unread notifications</h3>
            <div className="portal-task-list">
              {(bootstrap?.notifications || []).length === 0 && <p>No unread notifications.</p>}
              {(bootstrap?.notifications || []).slice(0, 5).map((notification) => (
                <div className="portal-task-row" key={notification.id}>
                  <div>
                    <strong>{notification.notification_title}</strong>
                    <span>{notification.notification_body || notification.notification_type}</span>
                    <small>{notification.priority} · {notification.notification_status}</small>
                  </div>
                  <button type="button" onClick={() => handleMarkRead(notification)}><Bell size={16} /> Read</button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="panel-card portal-next-card">
          <span className="section-kicker">Entity bridge</span>
          <h3>Profile links</h3>
          <p>Supabase returned {bootstrap?.entity_links?.length || 0} verified bridge links for this user. These connect portal users to customers, pilots, employees, and internal staff records.</p>
          <div className="portal-tag-row">
            {(bootstrap?.entity_links || []).map((link: any) => <span key={link.id || `${link.link_type}-${link.entity_id}`}>{link.link_type}: {link.entity_table}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
