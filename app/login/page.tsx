import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Login</span>
          <h1><span className="gradient">Portal access</span> for customers and pilots.</h1>
          <p className="lead">Authentication is not connected yet in this version. Use the preview links below to review the intended customer and pilot portal designs.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/customer-portal">Customer portal preview</Link>
            <Link className="btn" href="/dashboard">Pilot dashboard preview</Link>
          </div>
        </div>
      </section>
    </>
  );
}
