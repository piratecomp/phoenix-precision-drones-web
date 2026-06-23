import Image from "next/image";
import { FileText, MessageSquareText, UploadCloud } from "lucide-react";

const features = [
  ["Project visibility", "Customers can see active jobs, milestones, project status, service type, scheduled work, and site activity from one clean dashboard."],
  ["Deliverables & reports", "Reports, maps, downloads, invoices, documents, photos, and inspection records are organized in a polished customer-facing experience."],
  ["Communication", "Messages, status updates, project notes, quote details, and follow-up stay connected to the work being delivered."],
  ["Data history", "Recurring customers can build a usable project history instead of searching through disconnected links, files, texts, and emails."],
];

const workflow = [
  ["Request review", "Customer submits location, service needs, timing, and deliverable goals."],
  ["Operational review", "PPD reviews service fit, pricing factors, weather, safety, and pilot requirements."],
  ["Mission execution", "Pilots capture data in the field and upload mission media or mapping outputs."],
  ["Delivery", "Customer receives organized links, reports, files, invoices, and project updates."],
];

export default function CustomerPortalPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Customer portal</span>
          <h1>A customer workspace for organized aerial data.</h1>
          <p className="lead-copy">
            The customer portal is designed for project owners, contractors, property managers, telecom buyers, and commercial customers who need visibility, documentation, reporting, invoices, and deliverables without seeing internal company operations.
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
      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Customer workflow</span>
            <h2>From project request to usable deliverables.</h2>
            <p>
              PPD is designed so customers get organized aerial intelligence, not just files dropped into an inbox.
            </p>
          </div>
          <div className="info-card-grid">
            {workflow.map(([title, text]) => (
              <article className="detail-card panel-card" key={title}>
                <FileText size={30} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="panel-card detail-card">
            <UploadCloud size={32} />
            <h3>Deliverables stay tied to the job</h3>
            <p>Flight media, inspection evidence, mapping outputs, reports, and delivery links can remain connected to the customer project record.</p>
          </article>
          <article className="panel-card detail-card">
            <MessageSquareText size={32} />
            <h3>Communication stays organized</h3>
            <p>Project messages, quote context, review needs, and follow-up can stay tied to the job instead of scattered across channels.</p>
          </article>
        </div>
      </section>
    </>
  );
}
