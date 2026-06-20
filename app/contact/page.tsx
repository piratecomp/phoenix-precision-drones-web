export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Contact</span>
          <h1><span className="gradient">Request a quote</span> or reach the operations team.</h1>
          <p className="lead">Use this public contact flow for customer inquiries, pilot interest, telecom and construction opportunities, partnerships, and general company communication.</p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid">
          <div>
            <div className="section-head">
              <h2>Contact Phoenix Precision Drones</h2>
              <p>
                Email: sales@phoenixprecisiondrones.com
                <br />
                Phone: not listed yet
              </p>
              <p>
                This form is still a front-end placeholder. The next step is wiring it to Supabase and your communication/email workflow.
              </p>
            </div>
          </div>
          <form className="form">
            <label>Name</label>
            <input placeholder="Your name" />
            <label>Email</label>
            <input placeholder="you@example.com" />
            <label>Inquiry Type</label>
            <select defaultValue="">
              <option value="" disabled>Select one</option>
              <option>Customer quote</option>
              <option>Cell tower inspection inquiry</option>
              <option>Pilot network</option>
              <option>Partnership</option>
              <option>General question</option>
            </select>
            <label>Message</label>
            <textarea placeholder="Tell us what you need..." />
            <button className="btn btn-primary" type="button">Send Message</button>
          </form>
        </div>
      </section>
    </>
  );
}
