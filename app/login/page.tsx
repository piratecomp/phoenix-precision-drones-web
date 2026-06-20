import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="login-wrap">
      <div className="login-card">
        <Image src="/images/logo-emblem.jpeg" alt="Phoenix Precision Drones" width={300} height={200} />
        <span className="eyebrow">Secure Portal Preview</span>
        <h2>Customer, employee, and pilot dashboard access.</h2>
        <p className="lead" style={{fontSize: "17px"}}>
          Login will connect to Supabase Auth in the next phase. This page is currently a visual placeholder for the grant-ready public launch.
        </p>
        <form className="form" style={{padding: 0, border: 0, background: "transparent"}}>
          <label>Email</label>
          <input placeholder="email@company.com" />
          <label>Password</label>
          <input placeholder="••••••••" type="password" />
          <Link className="btn btn-primary" href="/dashboard">Preview Dashboard</Link>
        </form>
        <p className="legal">Do not enter real credentials yet. Authentication is not active in Version 1.</p>
      </div>
    </section>
  );
}
