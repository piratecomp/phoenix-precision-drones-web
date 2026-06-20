import Link from "next/link";

export default function ContactPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Contact</span>
          <h1>Request aerial intelligence, inspections, or portal-supported drone services.</h1>
          <p className="lead-copy">
            Reach out for construction progress capture, cell tower inspections, mapping support,
            thermal work, real estate media, or pilot network opportunities.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container contact-layout">
          <div className="panel-card contact-panel">
            <h3>Direct contact</h3>
            <p><strong>Email:</strong> sales@phoenixprecisiondrones.com</p>
            <p><strong>Location:</strong> Phoenix, Arizona</p>
            <p><strong>Primary focus:</strong> Commercial drone services, customer deliverables, and pilot mission workflows.</p>
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
                <label>Service interest</label>
                <select defaultValue="">
                  <option value="" disabled>Select a service</option>
                  <option>Construction Monitoring</option>
                  <option>Cell Tower & Telecom Inspections</option>
                  <option>LiDAR Mapping & Surveying</option>
                  <option>Thermal Inspections</option>
                  <option>Customer Portal / Deliverables</option>
                </select>
              </div>
            </div>
            <div>
              <label>Project details</label>
              <textarea placeholder="Tell us about your project, inspection need, or portal workflow request." />
            </div>
            <button className="primary-btn" type="submit">Request Contact</button>
          </form>
        </div>
      </section>
    </>
  );
}
