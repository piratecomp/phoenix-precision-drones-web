import Link from "next/link";
import {
  BadgeCheck,
  BrainCircuit,
  ClipboardCheck,
  CloudSun,
  DollarSign,
  FileText,
  Map,
  Network,
  PlaneTakeoff,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";

const focusAreas = [
  ["AI operations backbone", "Communication, lead intake, dispatch scoring, safety routing, pricing support, follow-up drafts, and internal task queues are designed around one connected operating model.", BrainCircuit],
  ["Pilot network model", "The company is built as both Phoenix-area operations and a scalable network for qualified 1099 pilots as service coverage expands.", Users],
  ["Safety-aware dispatch", "Pilot match logic can consider Part 107 status, insurance, drone capability, safety scores, workload, fatigue windows, weather, distance, and job fit.", ShieldCheck],
  ["Mission and deliverable flow", "Jobs connect to mission planning, DJI-compatible workflows, waypoints, flight logs, media uploads, customer deliverables, invoices, payouts, and records.", PlaneTakeoff],
] as const;

const platformPieces = [
  ["Public website", "Explains services, collects project details, answers safe public questions, and routes quote requests or safety-sensitive items into review workflows."],
  ["Customer portal", "Organizes project visibility, reports, deliverables, invoices, documents, messages, and follow-up so customers receive more than loose files."],
  ["Pilot dashboard", "Gives pilots mission context, offer visibility, route information, safety reminders, upload support, equipment awareness, and field-ready workflow structure."],
  ["Dispatch engine", "Ranks eligible pilots, supports small-wave job offers, tracks responses, expires competing offers after acceptance, and keeps assignment history tied to each job."],
  ["Safety layer", "Uses weather awareness, operating limits, no-fly controls, manual-review gates, certification tracking, insurance tracking, and fatigue/workload logic."],
  ["Business AI", "Supports pricing intelligence, competitor research, marketing queues, funding research, payroll, pilot payouts, maintenance, and administrative operations."],
] as const;

const principles = [
  ["AI-assisted, human-supervised", "The system supports decisions, but the website does not claim automatic flight approval, legal advice, insurance issuance, or active dispatch confirmation."],
  ["Field-first design", "PPD is built for real commercial field work: construction, mapping, inspections, telecom, solar, utility, emergency response, and recurring jobs."],
  ["Pilot protection", "Workload, fatigue, daily flight time, weekly flight time, insurance, certification, and safety scoring are part of the platform design."],
  ["Customer-ready data", "The target output is organized aerial intelligence: photos, videos, maps, thermal evidence, inspection records, reports, and deliverables."],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="page-hero section-pad about-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">About Phoenix Precision Drones</span>
          <h1>An AI-driven drone operations platform, not just an aerial media company.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones is being built as a commercial drone service provider and scalable pilot network powered by an AI-assisted operating system. The platform is designed to connect customers, pilots, drones, missions, safety, dispatch, pricing, maintenance, payroll, funding research, competitor intelligence, marketing, and deliverables into one organized workflow.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/services">Review Services</Link>
            <Link className="ghost-btn" href="/pilots">Pilot Network</Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-story-grid">
          <article className="panel-card about-story-card">
            <span className="section-kicker">The operating model</span>
            <h2>Customers request work. AI organizes the operation. Pilots capture the data.</h2>
            <p>
              PPD is designed so a drone job does not stop at “go fly and send photos.” The platform can collect project details, evaluate service requirements, review safety context, support pricing, match pilots, prepare mission workflows, track uploads, organize deliverables, and keep finance and follow-up connected to the job.
            </p>
            <p>
              Phoenix-area work can be supported by in-house operations first. As the network grows, qualified 1099 pilots can receive matched opportunities through a marketplace-style dispatch model.
            </p>
          </article>

          <article className="panel-card about-story-card highlight-card">
            <BrainCircuit size={34} />
            <h2>Built as an AI company from the beginning.</h2>
            <p>
              The backend is designed to support dispatch, Communication AI, safety, mission planning, weather awareness, pilot verification, competitor pricing research, marketing, funding research, finance, payroll, maintenance, and administrative workflows with human review where it matters.
            </p>
          </article>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Core platform capabilities</span>
            <h2>Designed around the real workflow of commercial drone operations.</h2>
            <p>
              PPD’s value is the operating system behind the flight: how jobs are requested, reviewed, routed, flown, uploaded, delivered, billed, paid, and learned from.
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
              <span className="section-kicker">Platform layers</span>
              <h2>One brand, multiple operating systems working together.</h2>
              <p>
                The public website explains the company. The portals serve customers and pilots. The AI backend supports the business engine behind both.
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
            <Route size={32} />
            <h3>Smart dispatch model</h3>
            <p>Network jobs can be ranked and offered in small waves to eligible pilots instead of broadcasting every opportunity to everyone at once.</p>
          </article>
          <article className="panel-card detail-card">
            <CloudSun size={32} />
            <h3>Weather-aware operations</h3>
            <p>Wind, gusts, heat, precipitation, visibility, and weather status are treated as operational factors, not afterthoughts.</p>
          </article>
          <article className="panel-card detail-card">
            <BadgeCheck size={32} />
            <h3>Qualification monitoring</h3>
            <p>Part 107, insurance, drone verification, skills, safety profile, and drone capability are part of pilot-network readiness.</p>
          </article>
          <article className="panel-card detail-card">
            <Map size={32} />
            <h3>DJI-compatible planning</h3>
            <p>The system supports AI-assisted mission planning and command-based drone workflows while preserving safe human oversight.</p>
          </article>
          <article className="panel-card detail-card">
            <FileText size={32} />
            <h3>Deliverable focused</h3>
            <p>Photos, videos, maps, inspection evidence, reports, documentation, and customer history stay tied to project records.</p>
          </article>
          <article className="panel-card detail-card">
            <DollarSign size={32} />
            <h3>Business automation</h3>
            <p>Pricing intelligence, pilot payouts, payroll, maintenance costs, invoices, funding research, and competitor tracking support business growth.</p>
          </article>
          <article className="panel-card detail-card">
            <ClipboardCheck size={32} />
            <h3>Human review gates</h3>
            <p>Legal, insurance, active dispatch, airport/airspace, night operations, over-people, spraying, and sensitive-site topics are routed carefully.</p>
          </article>
          <article className="panel-card detail-card">
            <Network size={32} />
            <h3>Built to scale</h3>
            <p>The long-term goal is a nationwide AI-assisted drone network with local operations and qualified pilot marketplace coverage.</p>
          </article>
        </div>
      </section>
    </>
  );
}
