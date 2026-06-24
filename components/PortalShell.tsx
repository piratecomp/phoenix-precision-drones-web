import Link from "next/link";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ClipboardCheck,
  Cpu,
  Gauge,
  HardHat,
  LayoutDashboard,
  PlaneTakeoff,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { portalDashboards, type PortalDashboard } from "@/lib/portal";

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

function DashboardIcon({ dashboardKey, size = 24 }: { dashboardKey: string; size?: number }) {
  const Icon = iconMap[dashboardKey] || LayoutDashboard;
  return <Icon size={size} />;
}

export function PortalLanding() {
  return (
    <>
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Phase 1 portal foundation</span>
          <h1>One operating portal. Role-based dashboards for every department.</h1>
          <p className="lead-copy">
            The database foundation is installed. This portal shell mirrors the new role registry, dashboard routing, and department access model for customers, pilots, administrators, and the owner command center.
          </p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/login">Login</Link>
            <Link className="ghost-btn" href="/portal/owner">View Owner Dashboard</Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Role routing map</span>
            <h2>Ten dashboards are ready for phased buildout.</h2>
            <p>Each card maps to the Phase 1 database role key and route path.</p>
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

      <section className="section-pad section-divider">
        <div className="container portal-phase-grid">
          <article className="panel-card portal-foundation-card">
            <Cpu size={32} />
            <h3>Database foundation installed</h3>
            <p>The portal now has role registry, dashboard registry, explicit role assignments, sessions, audit logging, and route lookup functions.</p>
            <ul className="mini-list">
              <li>portal_roles</li>
              <li>portal_dashboards</li>
              <li>portal_user_roles</li>
              <li>portal_sessions</li>
              <li>portal_audit_log</li>
            </ul>
          </article>
          <article className="panel-card portal-foundation-card">
            <ClipboardCheck size={32} />
            <h3>Access model</h3>
            <p>The shell is designed around one login system and role-based routing. Owner can see everything; each department gets only the dashboard it needs.</p>
            <ul className="mini-list">
              <li>Legacy users.role preserved</li>
              <li>New portal role keys added</li>
              <li>Future Supabase Auth routing ready</li>
            </ul>
          </article>
          <article className="panel-card portal-foundation-card">
            <Sparkles size={32} />
            <h3>AI department model</h3>
            <p>Each dashboard has a clear AI boundary so automation can run most workflows now and human help can step into the same department later.</p>
            <ul className="mini-list">
              <li>Owner AI</li>
              <li>Finance AI</li>
              <li>Safety AI</li>
              <li>Pilot and customer AI boundaries</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}

export function DepartmentDashboard({ dashboard }: { dashboard: PortalDashboard }) {
  return (
    <>
      <section className="portal-app-shell">
        <aside className="portal-sidebar">
          <Link className="portal-sidebar-brand" href="/portal">
            <LayoutDashboard size={22} />
            <span>PPD Portal</span>
          </Link>
          <nav className="portal-sidebar-nav">
            {portalDashboards.map((item) => (
              <Link className={item.key === dashboard.key ? "active" : ""} href={item.path} key={item.key}>
                <DashboardIcon dashboardKey={item.key} size={18} />
                <span>{item.role}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="portal-main-area">
          <div className="portal-topbar panel-card">
            <div>
              <span className="section-kicker">{dashboard.department}</span>
              <h1>{dashboard.title}</h1>
            </div>
            <div className="portal-status-pill">{dashboard.status}</div>
          </div>

          <div className="portal-dashboard-grid">
            <article className="panel-card portal-summary-card portal-wide-card">
              <div className="portal-role-icon large"><DashboardIcon dashboardKey={dashboard.key} size={30} /></div>
              <h2>{dashboard.role}</h2>
              <p>{dashboard.description}</p>
              <div className="portal-tag-row">
                <span>{dashboard.group}</span>
                <span>{dashboard.department}</span>
                <span>{dashboard.key}</span>
              </div>
            </article>

            {dashboard.metrics.map((metric) => (
              <article className="panel-card portal-metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="portal-dashboard-grid two-col">
            <article className="panel-card portal-workflow-card">
              <span className="section-kicker">Workflow modules</span>
              <h3>Phase 1 shell modules</h3>
              <ul className="portal-check-list">
                {dashboard.workflow.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article className="panel-card portal-workflow-card">
              <span className="section-kicker">AI boundary</span>
              <h3>Department AI scope</h3>
              <p>{dashboard.aiScope}</p>
              <div className="portal-db-note">
                Connected database role: <strong>{dashboard.key}</strong>
              </div>
            </article>
          </div>

          <div className="panel-card portal-next-card">
            <span className="section-kicker">Next build phase</span>
            <h3>Connect live data modules one dashboard at a time.</h3>
            <p>
              This Phase 1 shell gives every department a route, layout, navigation pattern, and permission target. Phase 2 can start by connecting customer projects and pilot workflows to existing Supabase tables.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
