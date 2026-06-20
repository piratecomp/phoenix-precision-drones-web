import Image from "next/image";

export default function CustomerPortalPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Customer portal preview</span>
          <h1><span className="gradient">Project status, deliverables, site media, and approvals</span> in a customer-facing interface.</h1>
          <p className="lead">This customer dashboard style is designed for project owners, construction companies, telecom customers, and other clients who need visibility without exposing internal owner-only data.</p>
          <div className="full-preview">
            <Image src="/images/customer-dashboard-v2.png" alt="Phoenix Precision Drones customer dashboard preview" width={1448} height={1086} priority />
          </div>
          <div className="info-strip">
            <div className="info-tile"><h4>Project overview</h4><p>Status, location, progress, next flight, and media gathered around the project itself.</p></div>
            <div className="info-tile"><h4>Deliverables</h4><p>Inspection reports, orthomosaic maps, point clouds, media files, and download history.</p></div>
            <div className="info-tile"><h4>Client communication</h4><p>Messages, quote approval, invoice tracking, and project-specific updates from one place.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
