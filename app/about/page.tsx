import Link from "next/link";
import {
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileText,
  Map,
  Network,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react";

const focusAreas = [
  ["Construction progress", "Repeatable site capture, progress documentation, earthwork visibility, and stakeholder reporting for contractors, developers, and owners.", Building2],
  ["LiDAR & mapping support", "High-value mapping workflows designed for terrain intelligence, site planning, orthomosaic deliverables, and survey-support documentation.", Map],
  ["Inspections & documentation", "Thermal, roof, solar, infrastructure, insurance, and asset inspection support with organized photos, reports, and project records.", ClipboardCheck],
  ["Telecom & towers", "Cell tower, rooftop communications asset, and infrastructure inspection workflows built for repeatable commercial documentation.", RadioTower],
] as const;

const platformPieces = [
  ["Public service intake", "The website explains services, captures project interest, routes safety-sensitive requests for review, and keeps customer-facing answers inside safe boundaries."],
  ["Customer portal", "Customers are meant to see project status, reports, deliverables, messages, invoices, and documentation in one organized workspace."],
  ["Pilot workflow", "Pilots are meant to work from mission context, route information, safety reminders, uploads, equipment readiness, and support tools."],
  ["AI operations layer", "The backend is being built to support communication, lead intake, dispatch planning, safety routing, pricing intelligence, and repeatable workflows."],
] as const;

const principles = [
  ["Safety before speed", "Airport, airspace, over-people, spraying, insurance, legal, and active-dispatch requests are routed for human review instead of being auto-approved."],
  ["Field-first design", "The business is built around real jobsite and inspection workflows, not only creative aerial media."],
  ["Professional deliverables", "The goal is clean project records, useful reports, organized files, and data customers can actually use."],
  ["Scalable network model", "Phoenix Precision Drones is designed to grow from Arizona service operations into a larger pilot-supported commercial drone platform."],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="page-hero section-pad about-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">About Phoenix Precision Drones</span>
          <h1>Built to turn drone flights into organized aerial intelligence.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones is being built as an AI-assisted commercial drone service platform for construction, mapping, inspections, telecom, solar, insurance documentation, and field operations. The goal is not just to capture photos from the sky. The goal is to deliver repeatable mission workflows, clean deliverables, customer visibility, and pilot-ready operations.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/services">Review Services</Link>
            <Link className="ghost-btn" href="/contact">Request Project Review</Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-story-grid">
          <article className="panel-card about-story-card">
            <span className="section-kicker">What we are building</span>
            <h2>A drone business with an operations backbone.</h2>
            <p>
              Phoenix Precision Drones is designed around the work customers actually need after the flight: progress records, inspection evidence, maps, reports, photos, thermal data, LiDAR-ready mapping support, communication, and documentation that can be reviewed later.
            </p>
            <p>
              The platform combines a public website, customer portal, pilot dashboard, Communication AI, lead routing, safety boundaries, and administrative workflows so customer requests can move from intake to review in an organized way.
            </p>
          </article>

          <article className="panel-card about-story-card highlight-card">
            <BrainCircuit size={34} />
            <h2>AI-assisted, not AI-uncontrolled.</h2>
            <p>
              The system is being built to use AI for intake, routing, communication support, weather context, service guidance, pricing support, and workflow organization. Safety-sensitive items are not treated as automatic approvals. Human review remains required for regulated, legal, insurance, and operational decisions.
            </p>
          </article>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Service direction</span>
            <h2>Focused on commercial work where repeatable data matters.</h2>
            <p>
              Phoenix Precision Drones is positioned for customers who need more than a one-time aerial image. The platform is aimed at recurring site documentation, inspections, mapping support, and structured deliverables.
            </p>
          </div>
          <div className="service-detail-grid">
            {focusAreas.map(([title, text, Icon]) => (
              <article className="detail-card panel-card" key={title}>
                <div className="detail-icon"><Icon size={28} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container ecosystem-layout">
          <div>
            <div className="section-heading">
              <span className="section-kicker">Platform model</span>
              <h2>One brand, multiple operating layers.</h2>
              <p>
                The public website is only the front door. Behind it, the system is being shaped around customer records, pilot workflows, safety routing, and administrative review.
              </p>
            </div>
            <div className="definition-list">
              {platformPieces.map(([title, text]) => (
                <article className="definition-card panel-card" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="operations-stack panel-card">
            <div className="section-kicker">Operating principles</div>
            {principles.map(([title, text]) => (
              <div className="ops-row" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
            <Link className="primary-btn full-width-btn" href="/contact">Start a Project Intake</Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="panel-card detail-card">
            <ShieldCheck size={32} />
            <h3>Safety and compliance aware</h3>
            <p>Public chat and intake workflows are designed to avoid approving flights, dispatching pilots, issuing insurance documents, or making legal/FAA decisions without review.</p>
          </article>
          <article className="panel-card detail-card">
            <FileText size={32} />
            <h3>Deliverable focused</h3>
            <p>The business is built around useful outputs: photos, videos, mapping products, inspection evidence, reports, documentation, and project history.</p>
          </article>
          <article className="panel-card detail-card">
            <Users size={32} />
            <h3>Customer and pilot workflows</h3>
            <p>The platform direction includes both sides of the operation: customers who need organized project visibility and pilots who need mission-ready field tools.</p>
          </article>
          <article className="panel-card detail-card">
            <Network size={32} />
            <h3>Built to scale</h3>
            <p>The long-term model is a structured drone service network that can support multiple services, locations, pilots, and commercial industries.</p>
          </article>
        </div>
      </section>
    </>
  );
}
