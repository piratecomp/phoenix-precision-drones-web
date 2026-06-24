import Image from "next/image";
import Link from "next/link";
import { serviceDefinitions } from "@/lib/services";
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
  Camera,
  ArrowRight,
  Sprout,
} from "lucide-react";

const iconBySlug = {
  "construction-monitoring": Building2,
  "lidar-mapping-surveying": Map,
  "thermal-inspections": Flame,
  "infrastructure-utility-inspections": Zap,
  "cell-tower-telecom-inspections": RadioTower,
  "solar-farm-inspections": Sun,
  "insurance-disaster-documentation": ShieldCheck,
  "emergency-response-support": Activity,
  "real-estate-marketing-media": Camera,
  "agriculture-drone-services": Sprout,
  "agriculture-drone-spraying": Sprout,
  "farm-mapping": Map,
};

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
      <section className="hero-section v16-hero section-pad">
        <div className="v16-hero-bg" />
        <div className="container hero-layout v16-hero-layout">
          <div className="hero-copy v16-hero-copy">
            <span className="section-kicker">AI-driven. Precision focused. Results delivered.</span>
            <h1>
              Commercial drone intelligence <span className="accent-text">powered by AI</span>.
            </h1>
            <p className="lead-copy">
              Phoenix Precision Drones supports construction, inspections, LiDAR mapping, thermal imaging, utilities, agriculture, real estate, and authorized emergency documentation with AI-assisted aerial workflows.
            </p>
            <div className="hero-actions v16-hero-actions">
              <Link className="primary-btn" href="/contact">
                Request a Quote
              </Link>
              <Link className="ghost-btn" href="/services">
                Explore Services
              </Link>
            </div>
            <div className="hero-service-pills" aria-label="Popular service categories">
              <Link href="/services/thermal-inspections">Thermal</Link>
              <Link href="/services/lidar-mapping-surveying">LiDAR</Link>
              <Link href="/services/infrastructure-utility-inspections">Utilities</Link>
              <Link href="/services/agriculture-drone-services">Agriculture</Link>
            </div>
          </div>

          <div className="v16-hero-image-wrap" aria-label="Drone scanning desert power-line infrastructure">
            <Image src="/images/hero-drone-powerline-scan.png" alt="Two drones scanning desert power-line infrastructure with LiDAR and thermal inspection beams at sunset" width={1792} height={1024} className="v16-hero-image" priority />
          </div>
        </div>
      </section>

      <section className="section-pad section-divider v15-services-band">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Our Services</span>
            <h2>Choose the aerial service that fits your project.</h2>
            <p>
              Open any service page for common uses, deliverables, AI-supported workflow, and safety-aware project intake.
            </p>
          </div>
          <div className="service-grid v15-service-grid">
            {serviceDefinitions.map((service) => {
              const Icon = iconBySlug[service.slug];
              return (
                <Link className="service-tile panel-card service-card-link" href={`/services/${service.slug}`} key={service.slug}>
                  <Icon size={30} />
                  <h3>{service.title}</h3>
                  <span>Open service page <ArrowRight size={16} /></span>
                </Link>
              );
            })}
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
              <article className="detail-card panel-card step-card" key={title}>
                <span className="step-number">{title}</span>
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
              <span className="section-kicker">Company model</span>
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
            <div className="ops-row"><BrainCircuit size={26} /><div><h3>Dispatch intelligence</h3><p>Pilot ranking can consider distance, availability, response speed, acceptance history, safety, fatigue, airspace, and job fit.</p></div></div>
            <div className="ops-row"><ShieldCheck size={26} /><div><h3>Safety-aware workflows</h3><p>Weather, wind, heat, visibility, certification status, insurance, and manual-review gates are designed into the workflow.</p></div></div>
            <div className="ops-row"><UploadCloud size={26} /><div><h3>Mission-to-deliverable flow</h3><p>Flight logs, media, mapping outputs, inspection evidence, and customer deliverables can stay connected to the job record.</p></div></div>
            <div className="ops-row"><DollarSign size={26} /><div><h3>Business automation</h3><p>Pricing intelligence, pilot payouts, payroll, maintenance, marketing, funding research, and competitor tracking support the business side.</p></div></div>
            <Link className="primary-btn full-width-btn" href="/services">
              Review Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="panel-card detail-card"><Users size={32} /><h3>W2 + 1099 model</h3><p>Phoenix-area work can be handled by local in-house operations first, while qualified network pilots support expansion as demand grows.</p></article>
          <article className="panel-card detail-card"><Clock3 size={32} /><h3>Workload protection</h3><p>The platform is designed to watch pilot workload, daily flight time, weekly flight time, and rest windows so pilots are not overloaded.</p></article>
          <article className="panel-card detail-card"><BadgeCheck size={32} /><h3>Qualification checks</h3><p>Pilot and drone workflows include Part 107, insurance, drone verification, skills, safety scoring, and capability matching.</p></article>
          <article className="panel-card detail-card"><Network size={32} /><h3>Nationwide roadmap</h3><p>The long-term goal is a scalable AI-assisted drone network where customers request work and qualified pilots receive matched opportunities.</p></article>
        </div>
      </section>

    </>
  );
}
