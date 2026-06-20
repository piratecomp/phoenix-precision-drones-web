import {
  Activity,
  Building2,
  Camera,
  Flame,
  Map,
  RadioTower,
  ShieldCheck,
  Sun,
} from "lucide-react";

const items = [
  ["Construction Monitoring", "Recurring aerial progress capture, site documentation, stakeholder updates, and visual history for contractors and owners.", Building2],
  ["LiDAR Mapping & Surveying", "Terrain visibility, mapping support, orthomosaic capture, and site-planning intelligence for real projects.", Map],
  ["Thermal Inspections", "Thermal-ready inspection workflows for roofs, structures, solar assets, and infrastructure diagnostics.", Flame],
  ["Infrastructure & Utility Inspections", "Aerial inspection support for bridges, roads, utilities, pipelines, and hard-to-access assets.", ShieldCheck],
  ["Cell Tower & Telecom Inspections", "Visual documentation and inspection support for tower owners, telecom contractors, rooftop assets, and 5G infrastructure.", RadioTower],
  ["Solar Farm Inspections", "Aerial and thermal support for panel health, asset documentation, and ongoing solar maintenance visibility.", Sun],
  ["Insurance & Disaster Documentation", "Rapid post-event aerial imagery and organized reporting support for claims, property condition, and recovery documentation.", Activity],
  ["Real Estate & Marketing Media", "Photo and video capture for listings, developments, land, and commercial marketing packages.", Camera],
] as const;

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Services</span>
          <h1>Commercial drone services presented with a bold mission-control aesthetic.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones combines field-ready services with a polished operations layer,
            making it easier to sell, deliver, and support recurring commercial drone work.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container service-detail-grid">
          {items.map(([title, text, Icon]) => (
            <article className="detail-card panel-card" key={title}>
              <div className="detail-icon"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
