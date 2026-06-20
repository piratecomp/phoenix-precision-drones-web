import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">About</span>
          <h1><span className="gradient">Phoenix Precision Drones</span> is being built around precision service and an operations-first platform.</h1>
          <p className="lead">The public website introduces the company. The portal previews show where the product is going: a mission-control experience for customers and pilots.</p>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div>
            <div className="section-head">
              <h2>Mission</h2>
              <p>Combine commercial drone services with a strong digital experience so customers can request work and review deliverables, while pilots can execute missions through a more modern operations layer.</p>
            </div>
            <div className="text-list">
              <div className="list-item"><span className="check">✓</span><div><strong>Precision capture</strong><br />Useful aerial data, not just generic drone content.</div></div>
              <div className="list-item"><span className="check">✓</span><div><strong>Organized delivery</strong><br />Portal-style visibility for project status, reports, and supporting files.</div></div>
              <div className="list-item"><span className="check">✓</span><div><strong>Scalable operations</strong><br />A platform direction that supports customer, pilot, and internal workflows over time.</div></div>
            </div>
          </div>
          <div className="panel showcase">
            <Image src="/images/brand-card.jpg" alt="Phoenix Precision Drones brand graphic" width={1050} height={700} />
          </div>
        </div>
      </section>
    </>
  );
}
