import Image from "next/image";

const features = [
  ["Project visibility", "Customers can see active jobs, milestones, project status, and site activity from one clean dashboard."],
  ["Deliverables & reports", "Reports, maps, downloads, invoices, and documents are organized in a polished customer-facing experience."],
  ["Communication", "Messages, status updates, and project correspondence stay connected to the work being delivered."],
];

export default function CustomerPortalPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Customer portal</span>
          <h1>A customer-facing dashboard with stronger glow, clarity, and deliverable structure.</h1>
          <p className="lead-copy">
            This portal preview is designed for project owners and buyers who want visibility,
            documentation, reporting, and communication without seeing internal company metrics.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container portal-page-layout">
          <div className="screenshot-shell tall-shot large-shot">
            <div className="screenshot-track tall-shot-track">
              <Image src="/images/customer-portal-preview.png" alt="Phoenix Precision Drones customer portal" width={1055} height={1491} className="portal-shot" priority />
            </div>
          </div>
          <div className="feature-stack">
            {features.map(([title, text]) => (
              <article className="detail-card panel-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
