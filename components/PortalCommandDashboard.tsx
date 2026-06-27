"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Bell,
  Bot,
  BriefcaseBusiness,
  Gauge,
  HardHat,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPinned,
  Menu,
  MessageSquare,
  PlaneTakeoff,
  Radio,
  Rocket,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { getPortalDashboard, portalDashboards } from "@/lib/portal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap, getPpdCommandCenter, getPpdRoleOperationsPanel, type PortalBootstrap, type PpdCommandCenter, type PpdRoleOperationsPanel } from "@/lib/portalApi";
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
type TabKey = "internal" | "email" | "alerts" | "ai";
type DetailKey = "readiness" | "jobs" | "pilots" | "reviews" | "events" | null;

function DashboardIcon({ dashboardKey, size = 18 }: { dashboardKey: string; size?: number }) {
  const Icon = iconMap[dashboardKey] || LayoutDashboard;
  return <Icon size={size} />;
}
function ModuleIcon({ iconKey, size = 17 }: { iconKey?: string | null; size?: number }) {
  const Icon = (iconKey && moduleIconMap[iconKey]) || LayoutDashboard;
  return <Icon size={size} />;
}
function statusClass(status?: string | null) {
  if (["danger", "critical", "high"].includes(status || "")) return "portal-live-pill danger";
  if (["warning", "medium"].includes(status || "")) return "portal-live-pill warning";
  if (["success", "low"].includes(status || "")) return "portal-live-pill success";
  return "portal-live-pill";
}
function Loading({ title }: { title: string }) {
  return <section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner portal-loading-card"><Loader2 className="portal-spin" size={34} /><h1>{title}</h1><p className="lead-copy">Loading live portal data from Supabase.</p></div></section>;
}
function KpiCard({ title, value, suffix, status, tone, Icon, onClick }: { title: string; value: any; suffix?: string; status: string; tone: string; Icon: LucideIcon; onClick: () => void }) {
  return <button className={`ppd-kpi-card ${tone}`} type="button" onClick={onClick}><div className="ppd-kpi-top"><Icon size={19} /><span>{title}</span></div><strong>{value}{suffix && <small>{suffix}</small>}</strong><div className="ppd-kpi-footer"><em>{status}</em><i /></div></button>;
}
function CommsPanel({ tab, setTab, notifications, tasks }: { tab: TabKey; setTab: (tab: TabKey) => void; notifications: any[]; tasks: any[] }) {
  const tabs: Array<{ key: TabKey; label: string; Icon: LucideIcon }> = [
    { key: "internal", label: "Internal", Icon: MessageSquare },
    { key: "email", label: "Email", Icon: Mail },
    { key: "alerts", label: "Alerts", Icon: Bell },
    { key: "ai", label: "PPD AI", Icon: Bot },
  ];
  const rows = tab === "email" || tab === "alerts" ? notifications : tasks;
  return <article className="panel-card ppd-comms-console"><div className="ppd-panel-heading compact"><div><span className="section-kicker">Communications</span><h3>Unified inbox</h3></div><span className="ppd-live-chip">Live</span></div><div className="ppd-comms-tabs">{tabs.map(({ key, label, Icon }) => <button className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)} type="button"><Icon size={15} />{label}</button>)}</div><div className="ppd-comms-body">{tab === "ai" ? <div className="ppd-ai-mini-console"><Bot size={22} /><strong>Ask PPD AI</strong><p>Owner questions, internal review, and AI-supported instructions live here instead of floating over the dashboard.</p><button type="button">Open AI Console</button></div> : <div className="ppd-mini-list">{rows.length === 0 && <p>No {tab === "internal" ? "internal messages" : "messages"} waiting right now.</p>}{rows.slice(0, 4).map((row: any, index: number) => <div className="ppd-message-row" key={row.id || index}><strong>{row.task_title || row.notification_title || "Message"}</strong><span>{row.task_summary || row.notification_body || row.task_type || row.notification_type || "Unified communication item"}</span><small>{row.priority || row.task_status || row.notification_status || "normal"}</small></div>)}</div>}</div></article>;
}
function OperationsMap() {
  return <article className="panel-card ppd-ops-map-card"><div className="ppd-panel-heading compact"><div><span className="section-kicker">Live Operations Map</span><h3>Phoenix, AZ</h3></div><span className="ppd-live-chip">Live</span></div><div className="portal-game-map-stage ppd-map-stage"><div className="map-route route-a" /><div className="map-route route-b" /><span className="map-pin pin-green">5</span><span className="map-pin pin-orange">442</span><span className="map-pin pin-blue">381</span><span className="map-drone drone-a"><Satellite size={18} /></span><span className="map-drone drone-b"><Satellite size={18} /></span><span className="map-zone zone-a" /><span className="map-zone zone-b" /><strong>Phoenix</strong></div></article>;
}
function DetailDrawer({ active, setActive, command }: { active: DetailKey; setActive: (key: DetailKey) => void; command: PpdCommandCenter | null }) {
  if (!active) return null;
  const readiness = command?.readiness || {};
  const titles: Record<Exclude<DetailKey, null>, string> = { readiness: "Production Readiness", jobs: "Active Jobs", pilots: "Verified Pilots", reviews: "AI Reviews", events: "Critical Events" };
  return <aside className="panel-card ppd-detail-drawer"><div className="ppd-panel-heading compact"><div><span className="section-kicker">Open Review</span><h3>{titles[active]}</h3></div><button aria-label="Close" onClick={() => setActive(null)} type="button"><X size={18} /></button></div><div className="ppd-drawer-list">{active === "readiness" ? <><p>Production readiness is <strong>{Math.round(Number(readiness.readiness_score || 0))}/100</strong>.</p><span>Portal status: {readiness.portal_ok ? "Live" : "Needs review"}</span><span>Active jobs: {readiness.active_jobs ?? 0}</span><span>Verified pilots: {readiness.verified_pilots ?? 0}</span><span>AI reviews: {readiness.pending_ai_approvals ?? 0}</span><span>Critical events: {readiness.open_high_or_critical_events ?? 0}</span></> : <p>This metric is now a live click target. Department detail RPCs can populate this drawer without changing the dashboard shell.</p>}</div></aside>;
}

export default function PortalCommandDashboard({ dashboardKey }: { dashboardKey: string }) {
  const fallbackDashboard = getPortalDashboard(dashboardKey);
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [bootstrap, setBootstrap] = useState<PortalBootstrap | null>(null);
  const [command, setCommand] = useState<PpdCommandCenter | null>(null);
  const [rolePanel, setRolePanel] = useState<PpdRoleOperationsPanel | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [tab, setTab] = useState<TabKey>("internal");
  const [drawer, setDrawer] = useState<DetailKey>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const dashboardPath = fallbackDashboard?.path || "/portal";
  const dashboard = useMemo(() => fallbackDashboard || portalDashboards[0], [fallbackDashboard]);
  useEffect(() => { let alive = true; async function load() { const supabase = getSupabaseBrowserClient(); if (!supabase) { setLoading(false); return; } const { data: sessionData } = await supabase.auth.getSession(); if (!sessionData.session) { setSessionMissing(true); setLoading(false); return; } const access = await checkDashboardAccess(supabase, dashboardPath); if (!access.can_access) { setAccessError(access.reason || "DASHBOARD_ACCESS_DENIED"); setLoading(false); return; } const data = await getPortalBootstrap(supabase, dashboardPath); if (!alive) return; setBootstrap(data); try { setRolePanel(await getPpdRoleOperationsPanel(supabase, data.dashboard_key || dashboardKey)); } catch { setRolePanel(null); } if (["owner", "admin"].includes(data.dashboard_key || dashboardKey)) { try { setCommand(await getPpdCommandCenter(supabase)); } catch { setCommand(null); } } setLoading(false); } load().catch((err: any) => { if (!alive) return; setAccessError(err?.message || "Unable to load portal dashboard."); setLoading(false); }); return () => { alive = false; }; }, [dashboardPath, dashboardKey]);
  async function signOut() { const supabase = getSupabaseBrowserClient(); if (supabase) await supabase.auth.signOut(); window.location.href = "/login"; }
  const liveKey = bootstrap?.dashboard_key || dashboardKey;
  const isExecutive = ["owner", "admin"].includes(liveKey);
  const navDashboards = bootstrap?.dashboards?.length ? bootstrap.dashboards.map((d: any) => ({ key: d.dashboard_key, path: d.dashboard_path, role: d.dashboard_name })) : portalDashboards.map((d) => ({ key: d.key, path: d.path, role: d.department }));
  const dashboardName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.dashboard_name || dashboard.title;
  const departmentName = bootstrap?.dashboards?.find((d: any) => d.dashboard_path === dashboardPath)?.department_name || dashboard.department;
  const readiness = command?.readiness || {};
  const modules = (bootstrap?.modules || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const actions = (bootstrap?.quick_actions || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const tasks = bootstrap?.tasks || [];
  const notifications = bootstrap?.notifications || [];
  if (!fallbackDashboard) return <section className="page-hero section-pad"><div className="container page-hero-inner"><h1>Portal dashboard not found.</h1><Link className="primary-btn" href="/portal">Return to Portal</Link></div></section>;
  if (loading) return <Loading title={`Loading ${fallbackDashboard.title}`} />;
  if (sessionMissing || accessError || bootstrap?.can_access === false) return <section className="page-hero section-pad portal-foundation-hero"><div className="container page-hero-inner"><span className="section-kicker">Protected portal route</span><h1>Access check complete.</h1><p className="lead-copy">{sessionMissing ? "Login is required before this dashboard can load live data." : `Supabase denied this route: ${accessError || bootstrap?.reason}.`}</p><div className="hero-actions centered-actions"><Link className="primary-btn" href={sessionMissing ? "/login" : bootstrap?.primary_dashboard_path || "/portal"}>{sessionMissing ? "Login" : "Go to My Dashboard"}</Link><Link className="ghost-btn" href="/portal">Portal Home</Link></div></div></section>;
  return <section className="portal-app-shell portal-live-shell ppd-command-shell"><aside className={`portal-sidebar ppd-command-rail ${mobileNav ? "mobile-open" : ""}`}><Link className="portal-sidebar-brand ppd-rail-brand" href="/portal"><LayoutDashboard size={22} /><span>PPD Portal</span></Link><nav className="portal-sidebar-nav ppd-rail-nav">{navDashboards.map((item: any) => <Link className={item.path === dashboardPath ? "active" : ""} href={item.path} key={item.key} onClick={() => setMobileNav(false)}><DashboardIcon dashboardKey={item.key} size={18} /><span>{item.role}</span></Link>)}</nav><div className="panel-card portal-session-card ppd-rail-status"><span className="section-kicker">System</span><p><span className="green-dot" /> Live command shell</p><small>Supabase {configured ? "Live" : "Preview"}</small></div><button className="portal-signout" onClick={signOut} type="button"><LogOut size={16} /> Sign out</button></aside><div className="portal-main-area ppd-dashboard-main"><header className="portal-topbar panel-card ppd-command-topbar"><button className="ppd-mobile-menu" onClick={() => setMobileNav((open) => !open)} type="button" aria-label="Open dashboard navigation"><Menu size={20} /></button><div><span className="section-kicker">{departmentName}</span><h1>{isExecutive ? "Owner Command Center" : dashboardName}</h1><p className="portal-live-subtitle">{bootstrap?.current_user?.full_name ? `Signed in as ${bootstrap.current_user.full_name}` : "Connected to Supabase portal backend."}</p></div><div className="portal-live-status-stack"><div className="portal-status-pill">Live RPC</div><div className="portal-small-counts"><span>{bootstrap?.counts?.open_tasks || 0} tasks</span><span>{bootstrap?.counts?.unread_notifications || 0} alerts</span><span>{bootstrap?.counts?.entity_links || 0} links</span></div></div></header><div className="ppd-dashboard-grid-shell"><section className="ppd-left-stack"><CommsPanel tab={tab} setTab={setTab} notifications={notifications} tasks={tasks} /><article className="panel-card ppd-quick-actions-panel"><div className="ppd-panel-heading compact"><span className="section-kicker">Quick Access</span><span>{actions.length}</span></div><div className="ppd-quick-action-grid">{actions.slice(0, 6).map((action) => <Link href={action.action_path || dashboardPath} className="ppd-action-tile" key={action.action_key}><ModuleIcon iconKey={action.icon_key} size={17} /><strong>{action.action_label}</strong></Link>)}</div></article></section><section className="ppd-center-stack">{isExecutive && command && <div className="ppd-kpi-grid"><KpiCard title="Production Readiness" value={Math.round(Number(readiness.readiness_score || 0))} suffix="/100" status={readiness.portal_ok ? "Live operations" : "Needs review"} Icon={Gauge} onClick={() => setDrawer("readiness")} tone="orange" /><KpiCard title="Active Jobs" value={readiness.active_jobs ?? 0} status="Field workflow" Icon={PlaneTakeoff} onClick={() => setDrawer("jobs")} tone="blue" /><KpiCard title="Verified Pilots" value={readiness.verified_pilots ?? 0} status="Ready pilots" Icon={UsersRound} onClick={() => setDrawer("pilots")} tone="green" /><KpiCard title="AI Reviews" value={readiness.pending_ai_approvals ?? 0} status="Review queue" Icon={Rocket} onClick={() => setDrawer("reviews")} tone="amber" /><KpiCard title="Critical Events" value={readiness.open_high_or_critical_events ?? 0} status="Attention" Icon={ShieldAlert} onClick={() => setDrawer("events")} tone="red" /></div>}<div className="ppd-center-row"><OperationsMap /><article className="panel-card ppd-ai-approval-panel"><div className="ppd-panel-heading compact"><div><span className="section-kicker">AI Dispatch</span><h3>Review queue</h3></div><span>{command?.pending_ai_approvals?.length || 0}</span></div><div className="portal-game-approval-list ppd-approval-list">{(command?.pending_ai_approvals || []).length === 0 && <p>No pending AI reviews.</p>}{(command?.pending_ai_approvals || []).slice(0, 4).map((item: any) => <div className="portal-game-approval-row" key={item.id}><div><strong>{item.action_title}</strong><span>{item.action_summary || item.action_type}</span><small>{item.risk_level} · {item.approval_status}</small></div></div>)}</div></article></div>{rolePanel && <section className="portal-role-ops-board panel-card ppd-role-ops-compact"><div className="ppd-panel-heading compact"><div><span className="section-kicker">Role Ops</span><h3>{rolePanel.dashboard_key || liveKey} workflow</h3></div><span className="ppd-live-chip">Synced</span></div><div className="portal-role-ops-card-grid ppd-role-card-grid">{(rolePanel.cards || []).slice(0, 4).map((card, index) => <article className="portal-role-ops-stat" key={`${card.title || "card"}-${index}`}><span>{card.title}</span><strong>{card.value ?? 0}</strong><em>{card.label}</em></article>)}</div></section>}</section><aside className="ppd-right-stack"><article className="panel-card ppd-module-panel"><div className="ppd-panel-heading compact"><span className="section-kicker">Modules</span><span>{modules.length}</span></div><div className="ppd-module-list">{modules.slice(0, 7).map((module) => <article className="ppd-module-row" key={module.module_key}><ModuleIcon iconKey={module.icon_key} size={17} /><div><strong>{module.title}</strong>{module.subtitle && <span>{module.subtitle}</span>}</div><em className={statusClass(module.status_level)}>{module.status_label || module.module_type || "Open"}</em></article>)}</div></article><article className="panel-card ppd-work-queue-panel"><div className="ppd-panel-heading compact"><span className="section-kicker">Tasks</span><span>{tasks.length}</span></div><div className="ppd-mini-list compact-list">{tasks.length === 0 && <p>No open tasks for this dashboard.</p>}{tasks.slice(0, 5).map((task) => <div className="ppd-message-row" key={task.id}><strong>{task.task_title}</strong><span>{task.task_summary || task.task_type || "Task"}</span></div>)}</div></article></aside></div><div className="ppd-secondary-deck"><QuotePipelinePanel dashboardKey={liveKey} /><div className="panel-card portal-next-card ppd-entity-card"><span className="section-kicker">Entity Bridge</span><h3>Profile links</h3><p>Supabase returned {bootstrap?.entity_links?.length || 0} verified bridge links for this user.</p><div className="portal-tag-row">{(bootstrap?.entity_links || []).slice(0, 8).map((link: any) => <span key={link.id || `${link.link_type}-${link.entity_id}`}>{link.link_type}: {link.entity_table}</span>)}</div></div></div><DetailDrawer active={drawer} setActive={setDrawer} command={command} /><nav className="ppd-mobile-bottom-nav"><button onClick={() => setDrawer("readiness")} type="button"><Gauge size={18} />Dashboard</button><button onClick={() => setTab("internal")} type="button"><Inbox size={18} />Messages</button><button onClick={() => setDrawer("reviews")} type="button"><Bot size={18} />AI</button><button onClick={() => setMobileNav(true)} type="button"><MapPinned size={18} />More</button></nav></div></section>;
}
