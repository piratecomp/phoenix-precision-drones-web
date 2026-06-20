import Image from "next/image";

export default function CustomerPortalPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Customer portal preview</span>
          <h1><span className="gradient">Project status, deliverables, site media, and approvals</span> in a customer-facing interface.</h1>
          <p className="lead">
            A customer-focused portal concept for construction companies, telecom customers, property owners, and commercial clients
            who need project visibility, reports, files, quotes, invoices, and communication in one place.
          </p>
          <div className="full-preview">
            <div className="dashboard-scroll">
              <Image src="/images/customer-dashboard-v2.png" alt="Phoenix Precision Drones customer dashboard preview" width={1448} height={1086} priority />
            </div>
            <p className="scroll-hint">Swipe sideways to view the full dashboard preview.</p>
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
