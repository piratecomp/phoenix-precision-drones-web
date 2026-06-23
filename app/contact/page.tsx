import Link from "next/link";

export default function ContactPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Contact</span>
          <h1>Request project review, pilot network info, or AI-supported drone services.</h1>
          <p className="lead-copy">
            Reach out for construction progress capture, mapping support, LiDAR-ready workflows, thermal work, telecom inspections, insurance documentation, real estate media, customer portal questions, or pilot network opportunities.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container contact-layout">
          <div className="panel-card contact-panel">
            <h3>Direct contact</h3>
            <p><strong>Email:</strong> sales@phoenixprecisiondrones.com</p>
            <p><strong>Location:</strong> Phoenix, Arizona</p>
            <p><strong>Primary focus:</strong> Commercial drone services, AI-assisted operations, customer deliverables, and pilot mission workflows.</p>
            <p><strong>Prelaunch note:</strong> Website requests collect details for review. They do not automatically confirm scheduling, pilot dispatch, flight approval, insurance documents, or active service availability.</p>
            <div className="hero-actions">
              <Link className="primary-btn" href="mailto:sales@phoenixprecisiondrones.com">Send Email</Link>
            </div>
          </div>
          <form className="panel-card contact-form">
            <div className="form-grid">
              <div>
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" placeholder="you@example.com" />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label>Company</label>
                <input type="text" placeholder="Company name" />
              </div>
              <div>
                <label>Request type</label>
                <select defaultValue="">
                  <option value="" disabled>Select a request type</option>
                  <option>Construction Monitoring</option>
                  <option>Cell Tower & Telecom Inspections</option>
                  <option>LiDAR Mapping & Surveying</option>
                  <option>Thermal Inspections</option>
                  <option>Insurance / Property Documentation</option>
                  <option>Customer Portal / Deliverables</option>
                  <option>Pilot Network Application</option>
                  <option>Partnership / Enterprise Work</option>
                </select>
              </div>
            </div>
            <div>
              <label>Project or pilot details</label>
              <textarea placeholder="Tell us about the project location, service need, timing, deliverables, pilot qualifications, drone capability, or portal workflow request." />
            </div>
            <button className="primary-btn" type="submit">Request Review</button>
          </form>
        </div>
      </section>
    </>
  );
}
