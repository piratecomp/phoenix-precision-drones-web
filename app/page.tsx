import Image from "next/image";
import Link from "next/link";
import PortalCard from "@/components/PortalCard";
import { RadioTower, Building2, Camera, Flame, Map, ShieldCheck } from "lucide-react";

const services = [
  ["Construction Progress", "Recurring aerial progress capture, site documentation, and visual reporting for owners and contractors.", Building2],
  ["Cell Tower Inspections", "Telecom tower imaging, visual documentation, site intelligence, and inspection support for tower operators and contractors.", RadioTower],
  ["Mapping & Survey Support", "Orthomosaic capture support, route documentation, acreage views, and site visibility for planning and progress.", Map],
  ["Roof & Property Inspections", "Safer inspection support for roofs, structures, insurance documentation, and difficult-to-access assets.", ShieldCheck],
  ["Thermal & Solar Support", "Thermal-ready workflows for solar arrays, roofs, and infrastructure inspection support.", Flame],
  ["Real Estate Media", "Aerial photography and video for residential, commercial, land, and development marketing.", Camera],
];

export default function HomePage() {
  return (
    <>
      <section className="section hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill"><span className="dot" /> AI-driven commercial drone operations</span>
            <h1><span className="gradient">Aerial data, inspections, and mission intelligence</span> built for modern field operations.</h1>
            <p className="lead">
              Phoenix Precision Drones is building a commercial drone services platform for construction progress, cell tower inspections,
              mapping support, property inspections, thermal services, real estate media, customer portals, and pilot mission workflows.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/contact">Request a Quote</Link>
              <Link className="btn" href="/customer-portal">View Customer Portal</Link>
              <Link className="btn" href="/dashboard">View Pilot Dashboard</Link>
            </div>
            <div className="hero-statbar">
              <div className="stat"><strong>Portal</strong><span>Customer access</span></div>
              <div className="stat"><strong>Pilot</strong><span>Mission workflow</span></div>
              <div className="stat"><strong>AZ</strong><span>Phoenix launch market</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <Image className="hero-logo" src="/images/logo-emblem-transparent.png" alt="Phoenix Precision Drones emblem" width={1000} height={700} priority />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill">Portal previews</span>
            <h2>Public website outside. Mission-control experience inside.</h2>
            <p>
              Customers can review projects, reports, deliverables, quotes, and messages. Pilots can manage missions, route areas,
              equipment readiness, uploads, and support resources.
            </p>
          </div>
          <div className="preview-grid">
            <PortalCard
              title="Customer dashboard"
              text="Project status, deliverables, reports, quotes, invoices, and communication in a customer-facing portal style."
              image="/images/customer-dashboard-v2.png"
              href="/customer-portal"
              cta="Open Preview"
            />
            <PortalCard
              title="Pilot dashboard"
              text="Mission acceptance, route area, deliverables, equipment status, messages, and pilot support in a unified operations layout."
              image="/images/pilot-dashboard-v2.png"
              href="/dashboard"
              cta="Open Preview"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill">Services</span>
            <h2>Commercial drone services designed for real contracts and repeat work.</h2>
            <p>
              Phoenix Precision Drones is positioned for customers who need field visibility, organized deliverables, and a professional operations layer behind the mission.
            </p>
          </div>
          <div className="cards">
            {services.map(([title, text, Icon]: any) => (
              <article className="card" key={title}>
                <div className="iconbox"><Icon size={24} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <div className="section-head">
              <span className="pill">Platform direction</span>
              <h2>One brand experience for public pages, customers, and pilots.</h2>
              <p>
                The site is designed to grow from a public grant-ready company presence into role-based portals for customers,
                pilots, employees, and internal operations.
              </p>
            </div>
            <div className="text-list">
              <div className="list-item"><span className="check">✓</span><div><strong>Customer-facing</strong><br />Project oversight, reports, downloads, messages, and quote visibility without exposing internal owner metrics.</div></div>
              <div className="list-item"><span className="check">✓</span><div><strong>Pilot-facing</strong><br />Mission routes, deliverables, equipment, support resources, and flight workflow aligned to field work.</div></div>
              <div className="list-item"><span className="check">✓</span><div><strong>Contract-ready services</strong><br />Cell tower inspections are called out clearly alongside construction, mapping, thermal, and real estate services.</div></div>
            </div>
          </div>
          <div className="panel showcase">
            <Image src="/images/customer-dashboard-v2.png" alt="Customer dashboard preview" width={1448} height={1086} />
          </div>
        </div>
      </section>
    </>
  );
}
