import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock3, Map, PlaneTakeoff, Route, ShieldCheck, UploadCloud, Zap } from "lucide-react";

const bullets = [
  "AI-ranked mission opportunities based on location, skill, safety, availability, and job fit",
  "Small-wave job offers instead of chaotic mass broadcasting",
  "Part 107, insurance, drone capability, workload, and safety-aware matching",
  "DJI-compatible mission planning and command-based workflow support",
  "Upload-focused deliverable workflow and pilot payout support",
];

const pilotFlow = [
  ["Get matched", "The system can rank eligible pilots by distance, availability, skill, drone capability, safety score, response history, acceptance history, and mission fit.", Route],
  ["Receive organized offers", "Network jobs can be offered to a small group of qualified pilots for a limited window, then move to the next group if needed.", Zap],
  ["Fly with context", "Pilots receive mission information, route context, safety requirements, customer deliverable expectations, and upload workflow support.", PlaneTakeoff],
  ["Upload and close out", "Flight media, mapping outputs, inspection evidence, and reports can stay connected to the job, deliverable, payout, and customer record.", UploadCloud],
] as const;

const safetyItems = [
  ["Certification monitoring", "Part 107 and other pilot certifications are part of the qualification workflow."],
  ["Insurance verification", "Pilot insurance status and expiration dates are tracked as part of network readiness."],
  ["Fatigue and workload limits", "Daily flight time, weekly flight time, and rest windows are designed into pilot safety logic."],
  ["Weather-aware scheduling", "Wind, gusts, heat, precipitation, and operating limits are considered before mission execution."],
  ["Drone capability matching", "LiDAR, thermal, photography, DJI support, and verified aircraft capabilities can be matched to job requirements."],
  ["Safety history", "Safety scores, incidents, and risk records can be used to support better operational decisions."],
] as const;

export default function PilotsPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container two-col-hero">
          <div>
            <span className="section-kicker">Pilot network</span>
            <h1>A smarter drone work network for qualified pilots.</h1>
            <p className="lead-copy">
              Phoenix Precision Drones is building a field-first pilot network where qualified operators can receive organized mission opportunities, clear job context, safer scheduling, upload workflows, and payout support while the AI handles much of the back-office complexity.
            </p>
            <ul className="mini-list large-list">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hero-actions">
              <Link className="primary-btn" href="/dashboard">View Pilot Dashboard</Link>
              <Link className="ghost-btn" href="/contact">Join Pilot Network</Link>
            </div>
          </div>
          <div className="screenshot-shell tall-shot">
            <div className="screenshot-track tall-shot-track">
              <Image src="/images/pilot-portal-preview.png" alt="Pilot portal preview" width={1055} height={1491} className="portal-shot" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">How pilot matching works</span>
            <h2>Opportunities matched by operational fit, not random availability.</h2>
            <p>
              The platform is designed to evaluate real job factors before routing work: location, distance, ETA, skill requirements, drone capability, pilot status, safety, workload, and response history.
            </p>
          </div>
          <div className="service-detail-grid">
            {pilotFlow.map(([title, text, Icon]) => (
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
              <span className="section-kicker">Safety and readiness</span>
              <h2>Protecting pilots, customers, and the mission.</h2>
              <p>
                PPD is designed with pilot readiness and safety controls around the dispatch process. Pilots should not be matched to work they are not qualified, equipped, available, or rested enough to perform.
              </p>
            </div>
            <div className="definition-list">
              {safetyItems.map(([title, text]) => (
                <article className="definition-card panel-card" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="operations-stack panel-card">
            <div className="section-kicker">Why pilots join</div>
            <div className="ops-row">
              <BadgeCheck size={26} />
              <div>
                <h3>Less admin work</h3>
                <p>PPD is designed to support intake, customer communication, job routing, scheduling, documentation, and follow-up.</p>
              </div>
            </div>
            <div className="ops-row">
              <Map size={26} />
              <div>
                <h3>Clear mission context</h3>
                <p>Mission location, service type, route context, deliverables, and upload needs stay organized around each job.</p>
              </div>
            </div>
            <div className="ops-row">
              <Clock3 size={26} />
              <div>
                <h3>Workload protection</h3>
                <p>Fatigue, daily workload, weekly flight time, and rest-window logic are designed into the platform model.</p>
              </div>
            </div>
            <div className="ops-row">
              <ShieldCheck size={26} />
              <div>
                <h3>Safety-aware growth</h3>
                <p>The goal is to expand nationally without losing qualification, safety, and mission-control discipline.</p>
              </div>
            </div>
            <Link className="primary-btn full-width-btn" href="/contact">Apply to Join</Link>
          </div>
        </div>
      </section>
    </>
  );
}
