"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, BriefcaseBusiness, Gauge, HardHat, LayoutDashboard, Loader2, LogOut, PlaneTakeoff, Radio, Rocket, Satellite, ShieldAlert, ShieldCheck, UserRound, UsersRound, Wrench, type LucideIcon } from "lucide-react";
import DashboardCommunicationsPanel from "@/components/DashboardCommunicationsPanel";
import QuotePipelinePanel from "@/components/QuotePipelinePanel";
import { getPortalDashboard, portalDashboards, type PortalDashboard } from "@/lib/portal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap, getPpdCommandCenter, getPpdRoleOperationsPanel, type PortalBootstrap, type PortalModule, type PortalQuickAction, type PpdCommandCenter, type PpdRoleOperationsPanel } from "@/lib/portalApi";

const dashboardIcons: Record<string, LucideIcon> = { owner: Gauge, admin: UsersRound, finance_payroll: BadgeDollarSign, maintenance: Wrench, safety: ShieldCheck, sales_marketing: BriefcaseBusiness, pilot_w2: PlaneTakeoff, pilot_1099: Radio, pilot_observer: HardHat, customer: UserRound };
const moduleIcons: Record<string, LucideIcon> = { finance: BadgeDollarSign, payroll: BadgeDollarSign, maintenance: Wrench, safety: ShieldCheck, shield: ShieldCheck, sales: BriefcaseBusiness, marketing: BriefcaseBusiness, pilot: PlaneTakeoff, network: Radio, observer: HardHat, customer: UserRound, command: Gauge, admin: UsersRound, users: UsersRound, upload: Rocket, verify: ShieldCheck };
type ReviewPanel = "readiness" | "jobs" | "pilots" | "approvals" | "events" | null;

function DashboardIcon({ dashboardKey, size = 20 }: { dashboardKey: string; size?: number }) { const Icon = dashboardIcons[dashboardKey] || LayoutDashboard; return <Icon size={size} />; }
function ModuleIcon({ iconKey, size = 18 }: { iconKey?: string | null; size?: number }) { const Icon = (iconKey && moduleIcons[iconKey]) || LayoutDashboard; return <Icon size={size} />; }
function statusClass(status?: string | null) { if (["danger", "critical", "high"].includes(status || "")) return "portal-live-pill danger"; if (["warning", "medium"].includes(status || "")) return "portal-live-pill warning"; if (["success", "low"].includes(status || "")) return "portal-live-pill success"; return "portal-live-pill"; }
function PortalLoading({ title }: { title: string }) { return <section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner portal-loading-card"><Loader2 className="portal-spin" size={34} /><h1>{title}</h1><p className="lead-copy">Loading live portal data from Supabase.</p></div></section>; }
function MetricButton({ title, value, status, Icon, tone, onOpen }: { title: string; value: string | number; status: string; Icon: LucideIcon; tone?: string; onOpen: () => void }) { return <button className={`portal-game-stat-card ${tone || ""}`} onClick={onOpen} type="button"><Icon size={24} /><span>{title}</span><strong>{value}</strong><em>{status}</em></button>; }

function fallbackModules(dashboard: PortalDashboard): PortalModule[] { return [{ module_key: `${dashboard.key}_summary`, title: dashboard.title, subtitle: dashboard.department, body: dashboard.description, status_label: dashboard.status, status_level: "info", icon_key: dashboard.key, sort_order: 10 }]; }
function fallbackActions(dashboard: PortalDashboard): PortalQuickAction[] { return [{ action_key: "portal_home", action_label: "Portal Home", action_path: "/portal", action_type: "link", description: "Return to portal home.", icon_key: dashboard.key, sort_order: 20 }]; }

export function PortalIndexClient() {
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { let alive = true; async function load() { const supabase = getSupabaseBrowserClient(); if (!supabase) { setLoading(false); return; } const { data } = await supabase.auth.getSession(); if (!alive) return; if (!data.session) { setLoading(false); return; } try { const access = await checkDashboardAccess(supabase, "/portal"); if (!alive) return; setPrimaryPath(access.redirect_to || access.requested_dashboard_path || access.primary_dashboard_path || null); } catch (err: any) { if (!alive) return; setError(err?.message || "Unable to check portal access."); } finally { if (alive) setLoading(false); } } load(); return () => { alive = false; }; }, []);
  if (loading) return <PortalLoading title="Checking portal access" />;
  if (primaryPath) return <section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner"><span className="section-kicker">Portal access ready</span><h1>Your Supabase session is active.</h1><p className="lead-copy">Continue to your role-based dashboard. The route guard resolved your primary dashboard from Supabase.</p><div className="hero-actions centered-actions"><Link className="primary-btn" href={primaryPath}>Continue to Dashboard</Link><Link className="ghost-btn" href="/login">Switch account</Link></div>{error && <p className="portal-error-note">{error}</p>}</div></section>;
  return <PortalPublicLanding configured={configured} error={error} />;
}

function PortalPublicLanding({ configured, error }: { configured: boolean; error: string | null }) {
  return <><section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner"><span className="section-kicker">PPD portal system</span><h1>One operating portal. Role-based command views.</h1><p className="lead-copy">Customer, pilot, maintenance, safety, finance, operations, and owner command-center dashboards are connected to the Supabase portal registry.</p><div className="hero-actions centered-actions"><Link className="primary-btn" href="/login">Login</Link><Link className="ghost-btn" href="/portal/customer">Preview Customer Portal</Link></div>{!configured && <p className="portal-error-note">Supabase browser variables are not configured yet.</p>}{error && <p className="portal-error-note">{error}</p>}</div></section><section className="section-pad section-divider"><div className="container"><div className="section-heading centered-heading"><span className="section-kicker">Role dashboards</span><h2>Frontend routes match the Supabase portal registry.</h2></div><div className="portal-role-grid">{portalDashboards.map((dashboard) => <Link className="portal-role-card panel-card" href={dashboard.path} key={dashboard.key}><div className="portal-role-icon"><DashboardIcon dashboardKey={dashboard.key} /></div><div><span>{dashboard.department}</span><h3>{dashboard.title}</h3><p>{dashboard.description}</p><small>{dashboard.path}</small></div></Link>)}</div></div></section></>;
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
  const [reviewPanel, setReviewPanel] = useState<ReviewPanel>(null);
  const dashboardPath = fallbackDashboard?.path || "/portal";

  async function loadLiveData() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { setSessionMissing(true); setLoading(false); return; }
    const access = await checkDashboardAccess(supabase, dashboardPath);
    if (!access.can_access) { setAccessError(access.reason || "DASHBOARD_ACCESS_DENIED"); setLoading(false); return; }
    const data = await getPortalBootstrap(supabase, dashboardPath);
    setBootstrap(data);
    try { setRolePanel(await getPpdRoleOperationsPanel(supabase, data.dashboard_key || dashboardKey)); } catch { setRolePanel(null); }
    if (["owner", "admin"].includes(data.dashboard_key || dashboardKey)) { try { setCommandCenter(await getPpdCommandCenter(supabase)); } catch { setCommandCenter(null); } }
    setLoading(false);
  }

  useEffect(() => { let alive = true; loadLiveData().catch((err: any) => { if (!alive) return; setAccessError(err?.message || "Unable to load portal dashboard."); setLoading(false); }); return () => { alive = false; }; }, [dashboardPath]);

  async function handleSignOut() { const supabase = getSupabaseBrowserClient(); if (supabase) await supabase.auth.signOut(); window.location.href = "/login"; }

  const dashboard = useMemo(() => fallbackDashboard || portalDashboards[0], [fallbackDashboard]);
  if (!fallbackDashboard) return <section className="page-hero section-pad"><div className="container page-hero-inner"><h1>Portal dashboard not found.</h1><Link className="primary-btn" href="/portal">Return to Portal</Link></div></section>;
  if (loading) return <PortalLoading title={`Loading ${fallbackDashboard.title}`} />;
  if (sessionMissing || accessError || bootstrap?.can_access === false) return <section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner"><span className="section-kicker">Protected portal route</span><h1>Access check complete.</h1><p className="lead-copy">{sessionMissing ? "Login is required before this dashboard can load live data." : `Supabase denied this route: ${accessError || bootstrap?.reason}.`}</p><div className="hero-actions centered-actions"><Link className="primary-btn" href={sessionMissing ? "/login" : bootstrap?.primary_dashboard_path || "/portal"}>{sessionMissing ? "Login" : "Go to My Dashboard"}</Link><Link className="ghost-btn" href="/portal">Portal Home</Link></div></div></section>;

  const dashboardName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.dashboard_name || dashboard.title;
  const departmentName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.department_name || dashboard.department;
  const liveDashboardKey = bootstrap?.dashboard_key || dashboardKey;
  const isExecutive = ["owner", "admin"].includes(liveDashboardKey);
  const readiness = commandCenter?.readiness || {};
  const modules = (bootstrap?.modules?.length ? bootstrap.modules : fallbackModules(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const actions = (bootstrap?.quick_actions?.length ? bootstrap.quick_actions : fallbackActions(dashboard)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const notifications = bootstrap?.notifications || [];
  const navDashboards = bootstrap?.dashboards?.length ? bootstrap.dashboards.map((d: any) => ({ key: d.dashboard_key, path: d.dashboard_path, role: d.dashboard_name })) : portalDashboards.map((d) => ({ key: d.key, path: d.path, role: d.department }));

  return <section className="portal-app-shell portal-live-shell portal-dashboard-redesign"><aside className="portal-sidebar"><Link className="portal-sidebar-brand" href="/portal"><LayoutDashboard size={22} /><span>PPD Portal</span></Link><nav className="portal-sidebar-nav">{navDashboards.map((item: any) => <Link className={item.path === dashboardPath ? "active" : ""} href={item.path} key={item.key}><DashboardIcon dashboardKey={item.key} size={18} /><span>{item.role}</span></Link>)}</nav><div className="panel-card portal-session-card"><span className="section-kicker">System Status</span><p><span className="green-dot" /> All systems operational</p><small>Supabase {configured ? "Live" : "Preview"}</small></div><button className="portal-signout" onClick={handleSignOut} type="button"><LogOut size={16} /> Sign out</button></aside><div className="portal-main-area"><div className="portal-topbar panel-card"><div><span className="section-kicker">{departmentName}</span><h1>{isExecutive ? "Owner Command Center" : dashboardName}</h1><p className="portal-live-subtitle">{bootstrap?.current_user?.full_name ? `Signed in as ${bootstrap.current_user.full_name}` : "Connected to Supabase portal backend."}</p></div><div className="portal-live-status-stack"><div className="portal-status-pill">Live RPC</div><div className="portal-small-counts"><span>{bootstrap?.counts?.open_tasks || 0} tasks</span><span>{notifications.length} alerts</span><span>{bootstrap?.counts?.entity_links || 0} links</span></div></div></div>
    <section className="portal-game-command-center"><div className="portal-game-stat-grid">{isExecutive && commandCenter ? <><MetricButton title="Production Readiness" value={`${Math.round(Number(readiness.readiness_score || 0))}/100`} status={readiness.portal_ok ? "Live Operations" : "Needs Review"} Icon={Gauge} onOpen={() => setReviewPanel("readiness")} /><MetricButton title="Active Jobs" value={readiness.active_jobs ?? 0} status="Field workflow" Icon={PlaneTakeoff} onOpen={() => setReviewPanel("jobs")} /><MetricButton title="Verified Pilots" value={readiness.verified_pilots ?? 0} status="Ready pilots" tone="green" Icon={UsersRound} onOpen={() => setReviewPanel("pilots")} /><MetricButton title="AI Approvals" value={readiness.pending_ai_approvals ?? 0} status="Review queue" tone="amber" Icon={Rocket} onOpen={() => setReviewPanel("approvals")} /><MetricButton title="Critical Events" value={readiness.open_high_or_critical_events ?? 0} status="Attention" tone="red" Icon={ShieldAlert} onOpen={() => setReviewPanel("events")} /></> : <MetricButton title={dashboardName} value={notifications.length} status="Live items" Icon={Gauge} onOpen={() => setReviewPanel("readiness")} />}</div><div className="portal-dashboard-grid two-col portal-operating-grid"><DashboardCommunicationsPanel dashboardKey={liveDashboardKey} notifications={notifications} onRefresh={loadLiveData} /><article className="panel-card portal-game-map-card"><div className="portal-game-panel-head"><div><span className="section-kicker">Live Operations Map</span><h3>Phoenix, AZ</h3></div><span className="portal-game-live-dot">Live</span></div><div className="portal-game-map-stage" aria-label="Stylized live operations map"><div className="map-route route-a" /><div className="map-route route-b" /><span className="map-pin pin-green">5</span><span className="map-pin pin-orange">442</span><span className="map-pin pin-blue">381</span><span className="map-drone drone-a"><Satellite size={18} /></span><span className="map-drone drone-b"><Satellite size={18} /></span><span className="map-zone zone-a" /><span className="map-zone zone-b" /><strong>Phoenix</strong></div></article></div></section>
    {isExecutive && commandCenter && <section className="portal-role-ops-board panel-card"><div className="portal-game-panel-head"><div><span className="section-kicker">AI Dispatch Queue</span><h3>Human approval required</h3></div><span>{commandCenter.pending_ai_approvals?.length || 0}</span></div><div className="portal-game-approval-list">{(commandCenter.pending_ai_approvals || []).length === 0 && <p>No pending AI approvals.</p>}{(commandCenter.pending_ai_approvals || []).slice(0, 4).map((approval: any) => <div className="portal-game-approval-row" key={approval.id}><div><strong>{approval.action_title}</strong><span>{approval.action_summary || approval.action_type}</span><small>{approval.risk_level} · {approval.approval_status}</small></div></div>)}</div></section>}
    {rolePanel && <section className="portal-role-ops-board panel-card"><div className="portal-game-panel-head"><div><span className="section-kicker">Role Operations Board</span><h3>{rolePanel.dashboard_key || liveDashboardKey} command workflow</h3></div><span className="portal-game-live-dot">Synced</span></div><div className="portal-role-ops-card-grid">{(rolePanel.cards || []).map((card, index) => <article className="portal-role-ops-stat" key={`${card.title || "card"}-${index}`}><span>{card.title}</span><strong>{card.value ?? 0}</strong><em>{card.label}</em></article>)}</div></section>}
    <QuotePipelinePanel dashboardKey={liveDashboardKey} />
    <section className="portal-role-ops-board panel-card"><div className="portal-game-panel-head"><div><span className="section-kicker">Quick Access</span><h3>Company functions</h3></div><span>{actions.length}</span></div><div className="portal-action-list">{actions.slice(0, 8).map((action) => <Link href={action.action_path || dashboardPath} className="portal-action-row" key={action.action_key}><ModuleIcon iconKey={action.icon_key} size={18} /><div><strong>{action.action_label}</strong>{action.description && <span>{action.description}</span>}</div></Link>)}</div></section>
    <div className="portal-dashboard-grid live-module-grid">{modules.map((module) => <article className="panel-card portal-live-module-card" key={module.module_key}><div className="portal-module-head"><div className="portal-role-icon"><ModuleIcon iconKey={module.icon_key} /></div><span className={statusClass(module.status_level)}>{module.status_label || module.module_type || "Module"}</span></div><h3>{module.title}</h3>{module.subtitle && <small>{module.subtitle}</small>}{module.body && <p>{module.body}</p>}{module.action_label && module.action_path && <Link className="ghost-btn compact-portal-btn" href={module.action_path}>{module.action_label}</Link>}</article>)}</div>
    {reviewPanel && <aside className="panel-card portal-review-drawer"><div className="portal-game-panel-head"><div><span className="section-kicker">Open Review</span><h3>{reviewPanel}</h3></div><button className="ghost-btn compact-portal-btn" type="button" onClick={() => setReviewPanel(null)}>Close</button></div><p>Production readiness: {Math.round(Number(readiness.readiness_score || 0))}/100</p><p>Active jobs: {readiness.active_jobs ?? 0}</p><p>Verified pilots: {readiness.verified_pilots ?? 0}</p><p>AI approvals: {readiness.pending_ai_approvals ?? 0}</p><p>Critical events: {readiness.open_high_or_critical_events ?? 0}</p></aside>}
  </div></section>;
}
