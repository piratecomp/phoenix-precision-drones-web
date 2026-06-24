"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Gauge,
  HardHat,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  PlaneTakeoff,
  Radio,
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
  getPortalBootstrap,
  markNotificationRead,
  type PortalBootstrap,
  type PortalModule,
  type PortalNotification,
  type PortalQuickAction,
  type PortalTask,
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
  review: ClipboardCheck,
  command: Gauge,
  admin: UsersRound,
  users: UsersRound,
  time: Clock3,
  upload: ClipboardCheck,
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
  if (["danger", "critical"].includes(status)) return "portal-live-pill danger";
  if (["warning"].includes(status)) return "portal-live-pill warning";
  if (["success"].includes(status)) return "portal-live-pill success";
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
      subtitle: "Phase 1 shell",
      body: dashboard.workflow.join(" • "),
      status_label: "Static preview",
      status_level: "warning",
      icon_key: "review",
      sort_order: 20,
    },
    {
      module_key: `${dashboard.key}_ai_scope`,
      title: "AI boundary",
      subtitle: "Department scope",
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

  if (loading) {
    return <PortalLoading title="Checking portal access" />;
  }

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
          <span className="section-kicker">V17.1 portal data wiring</span>
          <h1>One operating portal. Now wired for Supabase routing.</h1>
          <p className="lead-copy">
            The portal shell is ready to call your Phase 1.10 backend: route guard, bootstrap, dashboard modules, quick actions, tasks, notifications, entity links, and operating summaries.
          </p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/login">Login</Link>
            <Link className="ghost-btn" href="/portal/customer">Preview Customer Portal</Link>
          </div>
          {!configured && (
            <p className="portal-error-note">
              Supabase browser variables are not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to enable live login.
            </p>
          )}
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
          setBootstrap({
            authenticated: true,
            can_access: false,
            reason: access.reason,
            primary_dashboard_path: access.primary_dashboard_path,
            requested_dashboard_path: access.requested_dashboard_path,
            dashboard_key: access.dashboard_key,
          });
          return;
        }
        const data = await getPortalBootstrap(supabase, dashboardPath);
        if (!alive) return;
        setBootstrap(data);
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
  }, [dashboardPath]);

  const liveModules = bootstrap?.modules || [];
  const liveActions = bootstrap?.quick_actions || [];
  const modules = liveModules.length ? liveModules : fallbackDashboard ? getFallbackModules(fallbackDashboard) : [];
  const actions = liveActions.length ? liveActions : fallbackDashboard ? getFallbackActions(fallbackDashboard) : [];
  const activeDashboardName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.dashboard_name || fallbackDashboard?.title || "Portal Dashboard";
  const activeDepartment = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.department_name || fallbackDashboard?.department || "Portal";
  const navDashboards = bootstrap?.dashboards?.length
    ? bootstrap.dashboards.map((d: any) => ({
        key: d.dashboard_key,
        title: d.dashboard_name,
        path: d.dashboard_path,
        role: d.dashboard_name,
      }))
    : portalDashboards.map((d) => ({ key: d.key, title: d.title, path: d.path, role: d.role }));

  async function refresh() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const data = await getPortalBootstrap(supabase, dashboardPath);
    setBootstrap(data);
  }

  async function handleCompleteTask(task: PortalTask) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setActionMessage("Completing task...");
    try {
      await completeTask(supabase, task.id, "Completed from V17.1 portal dashboard.");
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

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

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

  if (accessError || bootstrap?.can_access === false) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Protected portal route</span>
          <h1>Access check complete.</h1>
          <p className="lead-copy">
            {sessionMissing
              ? "Login is required before the protected dashboard can load live Supabase data."
              : `Supabase denied this route: ${accessError || bootstrap?.reason}.`}
          </p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href={sessionMissing ? "/login" : bootstrap?.primary_dashboard_path || "/portal"}>
              {sessionMissing ? "Login" : "Go to My Dashboard"}
            </Link>
            <Link className="ghost-btn" href="/portal">Portal Home</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-app-shell portal-live-shell">
      <aside className="portal-sidebar">
        <Link className="portal-sidebar-brand" href="/portal">
          <LayoutDashboard size={22} />
          <span>PPD Portal</span>
        </Link>
        <nav className="portal-sidebar-nav">
          {navDashboards.map((item) => (
            <Link className={item.path === dashboardPath ? "active" : ""} href={item.path} key={item.key}>
              <DashboardIcon dashboardKey={item.key} size={18} />
              <span>{item.role}</span>
            </Link>
          ))}
        </nav>
        <button className="portal-signout" onClick={handleSignOut} type="button">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="portal-main-area">
        <div className="portal-topbar panel-card">
          <div>
            <span className="section-kicker">{activeDepartment}</span>
            <h1>{activeDashboardName}</h1>
            <p className="portal-live-subtitle">
              {bootstrap?.current_user?.full_name
                ? `Signed in as ${bootstrap.current_user.full_name}`
                : configured
                  ? "Connected to Supabase portal backend."
                  : "Static preview mode. Configure Supabase public variables for live data."}
            </p>
          </div>
          <div className="portal-live-status-stack">
            <div className="portal-status-pill">{bootstrap ? "Live RPC" : "Preview"}</div>
            <div className="portal-small-counts">
              <span>{bootstrap?.counts?.open_tasks || 0} tasks</span>
              <span>{bootstrap?.counts?.unread_notifications || 0} alerts</span>
              <span>{bootstrap?.counts?.entity_links || 0} links</span>
            </div>
          </div>
        </div>

        {!configured && (
          <div className="panel-card portal-warning-card">
            <ShieldAlert size={22} />
            <p>Add <strong>NEXT_PUBLIC_SUPABASE_URL</strong> and <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> in Vercel to activate live login and RPC data.</p>
          </div>
        )}

        {actionMessage && <div className="panel-card portal-action-message">{actionMessage}</div>}

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
              {module.action_label && module.action_path && (
                <Link className="ghost-btn compact-portal-btn" href={module.action_path}>{module.action_label}</Link>
              )}
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
              {(bootstrap?.permissions || []).slice(0, 8).map((permission: any) => (
                <span key={`${permission.permission_key}-${permission.role_key}`}>{permission.permission_key}</span>
              ))}
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
                  <button type="button" onClick={() => handleCompleteTask(task)}>
                    <CheckCircle2 size={16} /> Complete
                  </button>
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
                  <button type="button" onClick={() => handleMarkRead(notification)}>
                    <Bell size={16} /> Read
                  </button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="panel-card portal-next-card">
          <span className="section-kicker">Entity bridge</span>
          <h3>Profile links</h3>
          <p>
            Supabase returned {bootstrap?.entity_links?.length || 0} verified bridge links for this user. These connect portal users to customers, pilots, employees, and internal staff records.
          </p>
          <div className="portal-tag-row">
            {(bootstrap?.entity_links || []).map((link: any) => (
              <span key={link.id || `${link.link_type}-${link.entity_id}`}>{link.link_type}: {link.entity_table}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
