export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Contact</span>
        <h1><span className="gradient-text">Request a drone service quote</span> or contact the operations team.</h1>
        <p className="lead">Use this first public contact flow for customer inquiries, pilot interest, partnerships, and general business communication.</p>
      </section>

      <section className="section contact-panel">
        <div>
          <div className="section-header">
            <h2>Contact Phoenix Precision Drones</h2>
            <p>
              Email: sales@phoenixprecisiondrones.com
              <br />
              Phone: Not listed yet
            </p>
            <p>
              This Version 1 form is front-end only. The next build step is connecting it to Supabase and the PPD communication/email queue.
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
            <option>Pilot network</option>
            <option>Partnership</option>
            <option>General question</option>
          </select>
          <label>Message</label>
          <textarea placeholder="Tell us what you need..." />
          <button className="btn btn-primary" type="button">Send Message</button>
          <p className="legal">Form connection will be activated after Supabase/Resend email integration is added.</p>
        </form>
      </section>
    </>
  );
}
