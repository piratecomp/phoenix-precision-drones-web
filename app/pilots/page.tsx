import Image from "next/image";
import Link from "next/link";

const requirements = [
  "FAA Part 107 certification, or ability to obtain it before commercial missions.",
  "Drone equipment suitable for photo/video, inspection, mapping, or thermal work.",
  "Professional communication and ability to follow mission requirements, upload deliverables, and work safely.",
  "Interest in a growing pilot network with app-style mission workflows and support resources."
];

export default function PilotsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Pilot network</span>
          <h1><span className="gradient">Pilots need a dashboard built for field work, not just a generic portal.</span></h1>
          <p className="lead">The pilot side of Phoenix Precision Drones is designed around missions, route visibility, equipment readiness, deliverables, safety, and support.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/dashboard">View pilot dashboard</Link>
            <Link className="btn" href="/contact">Apply / contact us</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div className="panel showcase">
            <div className="dashboard-scroll">
              <Image src="/images/pilot-dashboard-v2.png" alt="Pilot dashboard preview" width={1448} height={1086} />
            </div>
            <p className="scroll-hint">Swipe sideways to view the full dashboard preview.</p>
          </div>
          <div>
            <div className="section-head">
              <h2>What the pilot experience should include</h2>
              <p>Mission acceptance, mission route details, deliverable checklist items, equipment status, recent activity, and communication from operations.</p>
            </div>
            <div className="text-list">
              {requirements.map((item) => (
                <div className="list-item" key={item}><span className="check">✓</span><div>{item}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
