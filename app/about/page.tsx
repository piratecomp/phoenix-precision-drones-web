import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">About</span>
        <h1><span className="gradient-text">Phoenix Precision Drones</span> is built around aerial data, safety, and operational intelligence.</h1>
        <p className="lead">
          The company is being developed in Phoenix, Arizona to serve customers who need drone-enabled documentation, inspection support,
          mapping visibility, and a more organized way to manage commercial drone missions.
        </p>
      </section>
      <section className="section split">
        <div>
          <div className="section-header">
            <h2>Mission</h2>
            <p>
              Our mission is to combine professional drone services with an AI-driven operations platform that helps customers request work,
              receive clear deliverables, and track mission status from one connected dashboard.
            </p>
          </div>
          <div className="list">
            <div className="list-item"><span className="check">✓</span><div><strong>Precision capture</strong><br />Focused aerial work for practical business needs.</div></div>
            <div className="list-item"><span className="check">✓</span><div><strong>Operational visibility</strong><br />Dashboards designed around jobs, pilots, drones, and deliverables.</div></div>
            <div className="list-item"><span className="check">✓</span><div><strong>AI-assisted growth</strong><br />Systems designed to support quoting, dispatch, routing, communication, safety, and reporting.</div></div>
          </div>
        </div>
        <div className="visual">
          <Image src="/images/brand-card.jpeg" alt="Phoenix Precision Drones brand card" width={1050} height={700} />
        </div>
      </section>
    </>
  );
}
