import Image from "next/image";
import Link from "next/link";
import PortalCard from "@/components/PortalCard";
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  Building2,
  Clock3,
  DollarSign,
  Flame,
  Map,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
  Sun,
  UploadCloud,
  Users,
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

const platformCards = [
  {
    title: "Customer requests become structured jobs",
    body: "Project details, service type, location, timing, deliverables, and safety-sensitive requests are organized for review instead of getting lost in generic contact forms.",
    Icon: Building2,
  },
  {
    title: "AI ranks operational fit",
    body: "The platform is built to evaluate pilot location, distance, availability, skill match, drone capability, Part 107 status, insurance, response history, safety, fatigue, and mission needs.",
    Icon: BrainCircuit,
  },
  {
    title: "Dispatch can move in small waves",
    body: "Network opportunities can be offered to a small group of eligible pilots for a limited window, then move to the next qualified group if no one accepts.",
    Icon: Route,
  },
  {
    title: "Safety stays in the workflow",
    body: "Weather, wind, heat, visibility, pilot workload, certification status, insurance status, and manual-review gates are part of the operating model.",
    Icon: ShieldCheck,
  },
] as const;

const howItWorks = [
  ["Request", "Customers submit project details, service needs, site location, timing, and deliverable goals."],
  ["Evaluate", "AI-assisted workflows review job scope, pricing factors, weather, safety, pilot requirements, and mission complexity."],
  ["Match", "Phoenix-area work can route to in-house operations first; network work can expand to qualified 1099 pilots."],
  ["Prepare", "Mission workflows support waypoints, DJI-compatible planning, media tracking, upload needs, and safety-aware scheduling."],
  ["Deliver", "Pilots capture the data and upload files while the system supports deliverables, follow-up, invoicing, payouts, and records."],
] as const;

const definitions = [
  {
    title: "For customers",
    body:
      "A professional way to request drone services, track project progress, receive organized deliverables, and work with a company built around aerial data instead of one-off flights.",
  },
  {
    title: "For pilots",
    body:
      "A field-first network model where qualified pilots can receive organized mission opportunities, clear job context, safety-aware scheduling, and upload-focused workflows.",
  },
  {
    title: "For operations",
    body:
      "An AI-supported business backbone for communication, dispatch, safety, pricing, maintenance, finance, payroll, marketing, competitor research, and funding research.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero-section section-pad">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="section-kicker">AI-driven drone operations network</span>
            <h1>
              More than drone services. <span className="accent-text">Aerial operations intelligence</span>.
            </h1>
            <p className="lead-copy">
              Phoenix Precision Drones is building an AI-assisted drone operations platform for commercial customers, in-house pilots, and a scalable 1099 pilot network. The system is designed to support service intake, pilot matching, safety review, mission planning, DJI-compatible workflows, uploads, deliverables, finance, maintenance, payroll, marketing, funding research, and competitor pricing intelligence.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/contact">
                Request Project Review
              </Link>
              <Link className="ghost-btn" href="/pilots">
                Join Pilot Network
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <strong>Customers</strong>
                <span>Project intake, deliverables, communication, and organized aerial data.</span>
              </div>
              <div className="metric-card">
                <strong>Pilots</strong>
                <span>AI-ranked opportunities, mission context, safety checks, and uploads.</span>
              </div>
              <div className="metric-card">
                <strong>Operations</strong>
                <span>Dispatch, weather, pricing, finance, payroll, maintenance, and growth AI.</span>
              </div>
            </div>
          </div>

          <div className="hero-visual panel-card">
            <div className="visual-topline">
              <span>Platform preview</span>
              <span>Public site + portals + AI ops</span>
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
            <span className="section-kicker">What PPD really is</span>
            <h2>A drone company built like a technology platform.</h2>
            <p>
              The public website is the front door. Behind it is a connected operating model for customers, pilots, drones, missions, safety, pricing, deliverables, and company administration.
            </p>
          </div>
          <div className="service-detail-grid">
            {platformCards.map(({ title, body, Icon }) => (
              <article className="detail-card panel-card" key={title}>
                <div className="detail-icon"><Icon size={28} /></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">How it works</span>
            <h2>From customer request to delivered aerial data.</h2>
            <p>
              PPD is designed to turn a project request into an organized job workflow with AI-assisted review, dispatch, mission planning, upload tracking, and deliverable support.
            </p>
          </div>
          <div className="info-card-grid">
            {howItWorks.map(([title, text]) => (
              <article className="detail-card panel-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Service stack</span>
            <h2>Built for repeatable commercial drone work.</h2>
            <p>
              Services are positioned around customers who need organized documentation, inspection evidence, mapping support, and recurring aerial intelligence.
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
            <span className="section-kicker">Customer + pilot portals</span>
            <h2>Two role-based portal experiences connected to one operating system.</h2>
            <p>
              Customers see project visibility, deliverables, reports, and communication. Pilots see mission opportunities, route context, safety requirements, uploads, equipment readiness, and support.
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
              text="A mission-focused dashboard for receiving work, seeing route context, managing uploads, and staying equipment-ready."
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
              <h2>One company serving customers, pilots, and operations.</h2>
              <p>
                PPD is built as a two-in-one model: Phoenix-area in-house operations plus a scalable network marketplace for qualified pilots as service areas expand.
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
            <div className="section-kicker">AI-supported operations</div>
            <div className="ops-row">
              <BrainCircuit size={26} />
              <div>
                <h3>Dispatch intelligence</h3>
                <p>Pilot ranking can consider distance, availability, response speed, acceptance history, safety, fatigue, airspace, and job fit.</p>
              </div>
            </div>
            <div className="ops-row">
              <ShieldCheck size={26} />
              <div>
                <h3>Safety-aware workflows</h3>
                <p>Weather, wind, heat, visibility, certification status, insurance, and manual-review gates are designed into the workflow.</p>
              </div>
            </div>
            <div className="ops-row">
              <UploadCloud size={26} />
              <div>
                <h3>Mission-to-deliverable flow</h3>
                <p>Flight logs, media, mapping outputs, inspection evidence, and customer deliverables can stay connected to the job record.</p>
              </div>
            </div>
            <div className="ops-row">
              <DollarSign size={26} />
              <div>
                <h3>Business automation</h3>
                <p>Pricing intelligence, pilot payouts, payroll, maintenance, marketing, funding research, and competitor tracking support the business side.</p>
              </div>
            </div>
            <Link className="primary-btn full-width-btn" href="/services">
              Review Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="panel-card detail-card">
            <Users size={32} />
            <h3>W2 + 1099 model</h3>
            <p>Phoenix-area work can be handled by local in-house operations first, while qualified network pilots support expansion as demand grows.</p>
          </article>
          <article className="panel-card detail-card">
            <Clock3 size={32} />
            <h3>Workload protection</h3>
            <p>The platform is designed to watch pilot workload, daily flight time, weekly flight time, and rest windows so pilots are not overloaded.</p>
          </article>
          <article className="panel-card detail-card">
            <BadgeCheck size={32} />
            <h3>Qualification checks</h3>
            <p>Pilot and drone workflows include Part 107, insurance, drone verification, skills, safety scoring, and capability matching.</p>
          </article>
          <article className="panel-card detail-card">
            <Network size={32} />
            <h3>Nationwide roadmap</h3>
            <p>The long-term goal is a scalable AI-assisted drone network where customers request work and qualified pilots receive matched opportunities.</p>
          </article>
        </div>
      </section>
    </>
  );
}
