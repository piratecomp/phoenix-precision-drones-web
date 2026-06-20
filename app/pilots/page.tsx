import Link from "next/link";

const requirements = [
  "FAA Part 107 certification or willingness to obtain it before commercial missions.",
  "Professional drone equipment suited for photo/video, thermal, mapping, inspection, or specialty work.",
  "Reliable communication, safe flight habits, insurance readiness, and ability to upload deliverables.",
  "Interest in joining a growing AI-assisted drone operations network."
];

export default function PilotsPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Pilot Network</span>
        <h1><span className="gradient-text">Join the Phoenix Precision Drones pilot network.</span></h1>
        <p className="lead">Phoenix Precision Drones is building a network of qualified commercial drone pilots for local and future nationwide mission coverage.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/contact">Apply / Contact Us</Link>
          <Link className="btn" href="/dashboard">View Pilot Dashboard Preview</Link>
        </div>
      </section>
      <section className="section split">
        <div>
          <div className="section-header">
            <h2>What we are building</h2>
            <p>A platform where qualified pilots can receive mission opportunities, manage equipment, accept jobs, upload photos/video/mapping data, and track earnings.</p>
          </div>
        </div>
        <div className="list">
          {requirements.map((item) => (
            <div className="list-item" key={item}><span className="check">✓</span><div>{item}</div></div>
          ))}
        </div>
      </section>
    </>
  );
}
