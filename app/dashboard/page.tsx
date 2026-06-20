import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <section className="dashboard-shell">
      <div className="section-header">
        <span className="eyebrow">Dashboard Preview</span>
        <h2>App-style mission operations view.</h2>
        <p>This preview shows the design direction for customers, employees, pilots, and administrators. Live data connection comes next.</p>
      </div>

      <div className="dash-grid">
        <aside className="sidebar">
          <Image className="side-logo" src="/images/logo-emblem.jpeg" alt="Phoenix Precision Drones" width={400} height={260} />
          <Link className="side-link active" href="/dashboard">Dashboard</Link>
          <span className="side-link">Missions</span>
          <span className="side-link">Payments</span>
          <span className="side-link">Equipment</span>
          <span className="side-link">Resources</span>
          <span className="side-link">Messages</span>
        </aside>

        <main className="dash-main">
          <div className="metrics">
            <div className="metric"><span>Available Missions</span><strong>5</strong></div>
            <div className="metric"><span>Upcoming</span><strong>2</strong></div>
            <div className="metric"><span>Completed</span><strong>124</strong></div>
            <div className="metric"><span>Revenue Today</span><strong>$19.8K</strong></div>
          </div>

          <div className="mission-card">
            <div className="mission-head">
              <strong>New Mission Alert</strong>
              <span style={{color: "var(--gold)"}}>$200</span>
            </div>
            <div className="mission-body">
              <Image src="/images/dashboard-mockup.jpeg" alt="Mission preview" width={500} height={320} style={{width: "100%", height: "160px", objectFit: "cover", borderRadius: "14px"}} />
              <div>
                <h3>Roof Inspection</h3>
                <p style={{color: "var(--muted)"}}>Location: Mesa, AZ<br />Due: April 26<br />Status: Pending pilot acceptance</p>
                <div className="hero-actions">
                  <button className="btn btn-primary">Accept Mission</button>
                  <button className="btn">View Details</button>
                </div>
              </div>
            </div>
          </div>

          <div className="map-fake" />
        </main>

        <aside className="rightbar">
          <Image src="/images/phoenix-banner.png" alt="Phoenix Precision Drones banner" width={700} height={420} style={{width: "100%", borderRadius: "16px"}} />
          <div className="upload-box">
            <strong>Mission Upload</strong>
            <p style={{color: "var(--muted)"}}>Photos, video, mapping data, inspection reports</p>
            <button className="btn btn-primary">Upload Files</button>
          </div>
          <h3>Upcoming Missions</h3>
          <div className="table-list">
            <div className="table-row"><strong>Construction Progress</strong><span>$400</span></div>
            <div className="table-row"><strong>Cell Tower Inspection</strong><span>$300</span></div>
            <div className="table-row"><strong>Solar Panel Inspection</strong><span>$600</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
