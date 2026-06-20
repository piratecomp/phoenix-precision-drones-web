import Image from "next/image";

export default function DashboardPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Pilot dashboard preview</span>
          <h1><span className="gradient">Mission flow, route visibility, equipment status, and pilot support</span> in one interface.</h1>
          <p className="lead">This page now centers the pilot dashboard itself rather than placing a small screenshot beside unrelated text. It reflects the direction for pilot missions, deliverables, and field workflows.</p>
          <div className="full-preview">
            <Image src="/images/pilot-dashboard-v2.png" alt="Phoenix Precision Drones pilot dashboard preview" width={1448} height={1086} priority />
          </div>
          <div className="info-strip">
            <div className="info-tile"><h4>Mission acceptance</h4><p>Available missions, scheduled work, payout visibility, and route details in a focused pilot view.</p></div>
            <div className="info-tile"><h4>Equipment readiness</h4><p>Drone, battery, storage, and resource panels designed around field execution.</p></div>
            <div className="info-tile"><h4>Support workflow</h4><p>Messages, support resources, certificates, and safety-center functions in the same portal style.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
