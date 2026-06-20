import Image from "next/image";
import Link from "next/link";
import { Map, ShieldCheck, RadioTower, Building2, Camera, Flame, Plane, Users, Cpu } from "lucide-react";

const services = [
  ["Construction Progress", "Jobsite photo, video, progress documentation, and recurring aerial intelligence.", Building2],
  ["Mapping & Survey Support", "Orthomosaic-style data collection, site mapping, route documentation, and construction planning support.", Map],
  ["Inspections", "Roof, structure, solar, utility, and asset inspections using efficient aerial capture workflows.", ShieldCheck],
  ["Thermal Services", "Thermal-ready workflows for solar, roof, infrastructure, and operational inspection needs.", Flame],
  ["Real Estate Media", "Aerial photography and video packages for residential, commercial, and land marketing.", Camera],
  ["AI Dispatch Network", "A growing platform for pilot routing, job assignment, mission tracking, and operational intelligence.", Cpu],
];

export default function HomePage() {
  return (
    <>
      <section className="section hero">
        <div>
          <span className="eyebrow"><span className="pulse" /> AI-driven commercial drone operations</span>
          <h1><span className="gradient-text">Aerial data, inspections, and mission intelligence</span> for modern operations.</h1>
          <p className="lead">
            Phoenix Precision Drones is building a commercial drone services platform for construction progress, mapping support,
            inspections, thermal services, real estate media, emergency response support, and AI-assisted pilot dispatch.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/contact">Request a Quote</Link>
            <Link className="btn" href="/pilots">Join Pilot Network</Link>
            <Link className="btn" href="/dashboard">View Dashboard Preview</Link>
          </div>
        </div>

        <aside className="hero-card">
          <Image src="/images/phoenix-banner.png" alt="Phoenix Precision Drones brand banner" width={1200} height={675} priority />
          <div className="hero-panel">
            <div className="status-row">
              <div className="status"><strong>24/7</strong><span>Mission Intake</span></div>
              <div className="status"><strong>AI</strong><span>Operations Layer</span></div>
              <div className="status"><strong>AZ</strong><span>Phoenix Launch</span></div>
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Services</span>
          <h2>Built for customers who need usable aerial intelligence, not just drone photos.</h2>
          <p>
            The first public launch focuses on clear service offerings while the protected dashboard expands into jobs, pilots,
            quotes, dispatch, reports, payments, messages, and AI workflow support.
          </p>
        </div>

        <div className="cards">
          {services.map(([title, body, Icon]: any) => (
            <article className="card" key={title}>
              <div className="icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <div className="visual">
          <Image src="/images/mobile-app-mockup.jpeg" alt="Phoenix Precision Drones mobile app mockup" width={1024} height={1536} />
        </div>
        <div>
          <span className="eyebrow">Platform Direction</span>
          <div className="section-header">
            <h2>One public website. One app-style dashboard. One operating system for drone work.</h2>
            <p>
              Customers will be able to request jobs, review mission status, access uploaded deliverables, and communicate with the
              operations team. Employees and pilots will see mission assignments, equipment, uploads, safety items, and dispatch workflows.
            </p>
          </div>
          <div className="list">
            <div className="list-item"><span className="check">✓</span><div><strong>Customer portal</strong><br />Quotes, job status, deliverables, invoices, and messages.</div></div>
            <div className="list-item"><span className="check">✓</span><div><strong>Employee operations view</strong><br />Missions, dispatch, reporting, safety, finance, and support workflows.</div></div>
            <div className="list-item"><span className="check">✓</span><div><strong>Pilot network</strong><br />Future 1099 pilot onboarding, mission availability, equipment tracking, and file uploads.</div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Launch Priorities</span>
          <h2>Professional online presence now. Deeper automation as operations scale.</h2>
          <p>
            Version 1 establishes credibility for customers, partners, pilots, and grant reviewers. Version 2 connects the dashboard to
            Supabase authentication, database records, communication queues, job flow, and AI-assisted operations.
          </p>
        </div>
        <div className="cards">
          <article className="card"><div className="icon"><Plane /></div><h3>Public presence</h3><p>Clear company positioning, services, industries, pilot recruiting, and contact flow.</p></article>
          <article className="card"><div className="icon"><Users /></div><h3>Dashboard preview</h3><p>App-style visual foundation for customers, employees, pilots, and administrators.</p></article>
          <article className="card"><div className="icon"><RadioTower /></div><h3>AI operations</h3><p>Ready to connect with Supabase, communication AI, dispatch, pricing, and mission workflows.</p></article>
        </div>
      </section>
    </>
  );
}
