"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Gauge,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  PlaneTakeoff,
  Radio,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import DashboardCommunicationsPanel from "@/components/DashboardCommunicationsPanel";
import { getPortalDashboard, portalDashboards } from "@/lib/portal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap, type PortalBootstrap } from "@/lib/portalApi";

const dashboardIcons: Record<string, LucideIcon> = {
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

function DashboardIcon({ dashboardKey, size = 18 }: { dashboardKey: string; size?: number }) {
  const Icon = dashboardIcons[dashboardKey] || LayoutDashboard;
  return <Icon size={size} />;
}

function PortalLoading({ title }: { title: string }) {
  return (
    <section className="page-hero section-pad portal-foundation-hero">
      <div className="container page-hero-inner portal-loading-card">
        <Loader2 className="portal-spin" size={34} />
        <h1>{title}</h1>
        <p className="lead-copy">Loading protected dashboard workspace from Supabase.</p>
      </div>
    </section>
  );
}

export default function PortalDashboardChrome({ dashboardKey, children }: { dashboardKey: string; children: ReactNode }) {
  const fallbackDashboard = getPortalDashboard(dashboardKey);
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [bootstrap, setBootstrap] = useState<PortalBootstrap | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
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
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    loadLiveData().catch((err: any) => {
      if (!alive) return;
      setAccessError(err?.message || "Unable to load portal dashboard.");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [dashboardPath]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const dashboard = useMemo(() => fallbackDashboard || portalDashboards[0], [fallbackDashboard]);

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

  const dashboardName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.dashboard_name || dashboard.title;
  const departmentName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.department_name || dashboard.department;
  const liveDashboardKey = bootstrap?.dashboard_key || dashboardKey;
  const notifications = bootstrap?.notifications || [];
  const navDashboards = bootstrap?.dashboards?.length
    ? bootstrap.dashboards.map((d: any) => ({ key: d.dashboard_key, path: d.dashboard_path, role: d.dashboard_name }))
    : portalDashboards.map((d) => ({ key: d.key, path: d.path, role: d.department }));

  return (
    <section className="portal-app-shell portal-live-shell portal-dashboard-redesign portal-command-only-shell">
      <aside className="portal-sidebar portal-sidebar-with-comms">
        <div className="portal-sidebar-comms">
          <DashboardCommunicationsPanel dashboardKey={liveDashboardKey} notifications={notifications} onRefresh={loadLiveData} compact />
        </div>
        <Link className="portal-sidebar-brand" href="/portal"><LayoutDashboard size={22} /><span>PPD Portal</span></Link>
        <nav className="portal-sidebar-nav">
          {navDashboards.map((item: any) => (
            <Link className={item.path === dashboardPath ? "active" : ""} href={item.path} key={item.key}>
              <DashboardIcon dashboardKey={item.key} size={18} /><span>{item.role}</span>
            </Link>
          ))}
        </nav>
        <div className="panel-card portal-session-card">
          <span className="section-kicker">System Status</span>
          <p><span className="green-dot" /> Dashboard workspace live</p>
          <small>Supabase {configured ? "Live" : "Preview"}</small>
        </div>
        <button className="portal-signout" onClick={handleSignOut} type="button"><LogOut size={16} /> Sign out</button>
      </aside>

      <div className="portal-main-area portal-command-main-area">
        <div className="portal-topbar panel-card">
          <div>
            <span className="section-kicker">{departmentName}</span>
            <h1>{dashboardName}</h1>
            <p className="portal-live-subtitle">{bootstrap?.current_user?.full_name ? `Signed in as ${bootstrap.current_user.full_name}` : "Connected to Supabase portal backend."}</p>
          </div>
          <div className="portal-live-status-stack">
            <div className="portal-status-pill">Command Workspace</div>
            <div className="portal-small-counts">
              <span>{bootstrap?.counts?.open_tasks || 0} tasks</span>
              <span>{notifications.length} alerts</span>
              <span>{bootstrap?.counts?.entity_links || 0} links</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
