import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="page-hero section-pad">
      <div className="container narrow-center">
        <div className="panel-card login-panel">
          <span className="section-kicker">Portal access</span>
          <h1>Choose the experience you want to preview.</h1>
          <p className="lead-copy">
            Customer and pilot pages each have their own dedicated interface and workflow focus.
          </p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/customer-portal">Customer Portal</Link>
            <Link className="ghost-btn" href="/dashboard">Pilot Dashboard</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
