import Image from "next/image";
import Link from "next/link";

const bullets = [
  "Mission offers with route context and payout visibility",
  "Deliverable upload workflow and field support resources",
  "Equipment, safety, and certification awareness in one portal",
  "Designed for pilots doing real field work, not generic account management",
];

export default function PilotsPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container two-col-hero">
          <div>
            <span className="section-kicker">Pilot network</span>
            <h1>Pilots need a dashboard built for field work.</h1>
            <p className="lead-copy">
              Phoenix Precision Drones is building a pilot network experience around missions,
              maps, uploads, support, and organized operational flow.
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
    </>
  );
}
