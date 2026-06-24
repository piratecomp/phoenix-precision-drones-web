import Link from "next/link";
import { serviceDefinitions } from "@/lib/services";
import {
  Activity,
  ArrowRight,
  Building2,
  Camera,
  ClipboardCheck,
  Sprout,
  Flame,
  Map,
  RadioTower,
  ShieldCheck,
  Sun,
  UploadCloud,
  Zap,
} from "lucide-react";

const iconBySlug: Record<string, React.ComponentType<{ size?: number }>> = {
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

const ops = [
  ["AI-assisted intake", "Requests can be classified by service type, location, urgency, deliverables, and safety-sensitive requirements."],
  ["Safety-aware review", "Weather, wind, heat, site risk, airspace-sensitive topics, and manual-review gates are part of the workflow."],
  ["Pilot and drone matching", "Pilot skill, drone capability, certification, insurance, location, availability, workload, and safety score can support dispatch decisions."],
  ["Mission planning", "Jobs can connect to waypoints, DJI-compatible mission planning, grid points, overlap settings, gimbal actions, and flight logs."],
  ["Deliverable tracking", "Flight media, customer deliverables, reports, invoices, payouts, and project history stay connected to the job."],
  ["Business intelligence", "Pricing, competitor data, funding opportunities, marketing queues, maintenance, finance, and payroll support the business behind each mission."],
] as const;

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero section-pad v15-page-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Services</span>
          <h1>Commercial drone services backed by an AI operations platform.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones is positioned for customers who need organized aerial data, not just a one-time flight, including construction, utilities, agriculture, emergency support, mapping, inspections, and commercial media. Select a service below to open a dedicated page with use cases, deliverables, workflow, and safety notes.
          </p>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container service-detail-grid v15-service-directory">
          {serviceDefinitions.map((service) => {
            const Icon = iconBySlug[service.slug] ?? ClipboardCheck;
            return (
              <Link className="detail-card panel-card service-directory-card" key={service.slug} href={`/services/${service.slug}`}>
                <div className="detail-icon"><Icon size={28} /></div>
                <span className="service-eyebrow">{service.eyebrow}</span>
                <h3>{service.title}</h3>
                <p>{service.hero}</p>
                <span className="card-link-text">Open service page <ArrowRight size={16} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Service workflow</span>
            <h2>The platform supports the work around the flight.</h2>
            <p>
              PPD is being built to handle the operational complexity that makes drone services reliable, repeatable, and scalable.
            </p>
          </div>
          <div className="info-card-grid">
            {ops.map(([title, text]) => (
              <article className="detail-card panel-card" key={title}>
                <ClipboardCheck size={30} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="panel-card detail-card">
            <UploadCloud size={32} />
            <h3>Upload-ready workflow</h3>
            <p>Pilot uploads, flight media, reports, maps, and customer deliverables are designed to stay connected to the job record.</p>
          </article>
          <article className="panel-card detail-card">
            <ShieldCheck size={32} />
            <h3>Human review where needed</h3>
            <p>Regulated, legal, insurance, airport, active dispatch, and safety-sensitive items are routed carefully instead of being auto-approved by the website.</p>
          </article>
        </div>
      </section>
    </>
  );
}
