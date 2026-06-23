import {
  Activity,
  Building2,
  Camera,
  ClipboardCheck,
  Flame,
  Map,
  RadioTower,
  ShieldCheck,
  Sun,
  UploadCloud,
} from "lucide-react";

const items = [
  ["Construction Monitoring", "Recurring aerial progress capture, site documentation, earthwork visibility, stakeholder reporting, and historical jobsite records.", "Progress photos, orthomosaic-ready capture, videos, site notes, and organized milestone deliverables.", Building2],
  ["LiDAR Mapping & Surveying", "Mapping support for terrain visibility, site planning, topo awareness, earthwork review, and development workflows.", "LiDAR-ready workflow support, mapping data, flight logs, grid planning, overlap/sidelap settings, and upload organization.", Map],
  ["Thermal Inspections", "Thermal-ready inspection workflows for roofs, structures, solar assets, utilities, and infrastructure diagnostics.", "Thermal imagery, anomaly documentation, reference photos, and project records for review.", Flame],
  ["Infrastructure & Utility Inspections", "Aerial inspection support for bridges, roads, utilities, pipelines, right-of-way corridors, and hard-to-access assets.", "Inspection evidence, location-linked media, notes, and deliverable packages for maintenance or engineering review.", ShieldCheck],
  ["Cell Tower & Telecom Inspections", "Visual documentation and inspection support for tower owners, telecom contractors, rooftop assets, and 5G infrastructure.", "Asset photos, close-up inspection media, structured upload packages, and recurring inspection support.", RadioTower],
  ["Solar Farm Inspections", "Aerial and thermal support for panel health, array documentation, maintenance visibility, and site condition review.", "Visual and thermal evidence, panel-area documentation, status notes, and recurring inspection records.", Sun],
  ["Insurance & Disaster Documentation", "Post-event aerial imagery and organized documentation support for claims, property condition, and recovery workflows.", "Roof and property imagery, storm evidence, before/after records, and human-reviewed documentation packages.", Activity],
  ["Real Estate & Marketing Media", "Photo and video capture for listings, developments, land, commercial properties, and marketing packages.", "Aerial photos, videos, edited media, site perspective shots, and delivery links.", Camera],
] as const;

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
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Services</span>
          <h1>Commercial drone services backed by an AI operations platform.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones is positioned for customers who need organized aerial data, not just a one-time flight. Each service is designed to connect intake, safety review, pilot matching, mission planning, upload tracking, and customer deliverables.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container service-detail-grid">
          {items.map(([title, text, deliverable, Icon]) => (
            <article className="detail-card panel-card" key={title}>
              <div className="detail-icon"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <p><strong>Typical deliverables:</strong> {deliverable}</p>
            </article>
          ))}
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
