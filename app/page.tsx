import Image from "next/image";
import Link from "next/link";
import PortalCard from "@/components/PortalCard";
import {
  Activity,
  Building2,
  Flame,
  Map,
  RadioTower,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";

const services = [
  ["Construction Monitoring", Building2],
  ["LiDAR Mapping & Surveying", Map],
  ["Thermal Inspections", Flame],
  ["Infrastructure & Utility", Zap],
  ["Cell Tower & Telecom", RadioTower],
  ["Solar Farm Inspections", Sun],
  ["Insurance Documentation", ShieldCheck],
  ["Emergency Response", Activity],
] as const;

const definitions = [
  {
    title: "Public website",
    body:
      "Service positioning, industry pages, quote intake, and brand presentation for contractors, telecom buyers, and property clients.",
  },
  {
    title: "Customer portal",
    body:
      "Project visibility, reports, invoices, messages, deliverables, and organized documentation in one customer-facing workspace.",
  },
  {
    title: "Pilot portal",
    body:
      "Mission workflow, live route context, uploads, equipment readiness, support resources, and field-focused execution tools.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero-section section-pad">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="section-kicker">AI-driven. Precision focused. Results delivered.</span>
            <h1>
              Commercial drone solutions powered by <span className="accent-text">AI intelligence</span>.
            </h1>
            <p className="lead-copy">
              Phoenix Precision Drones delivers advanced aerial intelligence for construction progress,
              LiDAR mapping, thermal capture, infrastructure inspections, cell tower work, and
              organized field operations backed by customer and pilot portals.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/contact">
                Request a Quote
              </Link>
              <Link className="ghost-btn" href="#portals">
                Explore Portals
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <strong>Construction</strong>
                <span>Progress capture & site intelligence</span>
              </div>
              <div className="metric-card">
                <strong>Telecom</strong>
                <span>Cell tower & infrastructure inspections</span>
              </div>
              <div className="metric-card">
                <strong>Operations</strong>
                <span>Customer and pilot mission workflows</span>
              </div>
            </div>
          </div>

          <div className="hero-visual panel-card">
            <div className="visual-topline">
              <span>Live brand preview</span>
              <span>Mission-control style interface</span>
            </div>
            <div className="browser-preview">
              <Image src="/images/website-preview.png" alt="Phoenix Precision Drones website concept" width={1448} height={1086} className="preview-image" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Service stack</span>
            <h2>Built for repeatable aerial intelligence work.</h2>
            <p>
              A unified visual system carries across the public website, customer-facing portal,
              and pilot-facing mission workflow.
            </p>
          </div>
          <div className="service-grid">
            {services.map(([title, Icon]) => (
              <article className="service-tile panel-card" key={title}>
                <Icon size={28} />
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="portals" className="section-pad section-divider">
        <div className="container">
          <div className="section-heading">
            <span className="section-kicker">Portal previews</span>
            <h2>One brand system. Two role-based portal experiences.</h2>
            <p>
              Customers see progress, deliverables, reports, and communication. Pilots see missions,
              route context, equipment, uploads, and support.
            </p>
          </div>
          <div className="portal-grid">
            <PortalCard
              eyebrow="Customer portal"
              title="Project visibility with polished deliverables"
              text="A customer-facing dashboard for active projects, reports, invoices, documents, messages, and milestone progress."
              image="/images/customer-portal-preview.png"
              href="/customer-portal"
              cta="View Customer Portal"
              highlights={[
                "Projects and deliverables",
                "Reports, invoices, and documents",
                "Messages and activity tracking",
              ]}
            />
            <PortalCard
              eyebrow="Pilot portal"
              title="Field workflow built for pilots"
              text="A mission-focused dashboard for accepting work, navigating route context, managing uploads, and staying equipment-ready."
              image="/images/pilot-portal-preview.png"
              href="/dashboard"
              cta="View Pilot Dashboard"
              highlights={[
                "Mission queue and live route map",
                "Equipment and safety readiness",
                "Deliverables, messages, and support",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container ecosystem-layout">
          <div>
            <div className="section-heading">
              <span className="section-kicker">Platform definitions</span>
              <h2>Clear roles across the website, customer portal, and pilot portal.</h2>
              <p>
                The site should communicate the business clearly while the portals support the people
                actually using the platform in the field and on the client side.
              </p>
            </div>
            <div className="definition-list">
              {definitions.map((item) => (
                <article className="definition-card panel-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="operations-stack panel-card">
            <div className="section-kicker">Operations highlights</div>
            <div className="ops-row">
              <div>
                <h3>FAA-compliant workflows</h3>
                <p>Structured missions, organized deliverables, and professional customer reporting.</p>
              </div>
            </div>
            <div className="ops-row">
              <div>
                <h3>Cell tower contract positioning</h3>
                <p>Telecom inspection services sit alongside construction, mapping, thermal, and utility work.</p>
              </div>
            </div>
            <div className="ops-row">
              <div>
                <h3>AI-assisted pilot network</h3>
                <p>Mission workflows are designed to scale with dispatch, pilot support, and repeatable field operations.</p>
              </div>
            </div>
            <Link className="primary-btn full-width-btn" href="/services">
              Review Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
