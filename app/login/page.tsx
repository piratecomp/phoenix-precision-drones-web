import Link from "next/link";
import { LockKeyhole, Radio, ShieldCheck, UserRound, UsersRound } from "lucide-react";

const accessCards = [
  {
    title: "Customer Login",
    text: "Project visibility, deliverables, reports, invoices, documents, and communication in one secure portal experience.",
    Icon: UserRound,
    href: "/customer-portal",
  },
  {
    title: "Pilot Login",
    text: "Mission opportunities, dispatch context, safety notes, route details, uploads, equipment status, and payout support.",
    Icon: Radio,
    href: "/pilot-dashboard",
  },
  {
    title: "Operations Access",
    text: "Internal operations, dispatch, finance, maintenance, communication, and AI-supported business workflows after authentication is connected.",
    Icon: UsersRound,
    href: "/contact",
  },
] as const;

export default function LoginPage() {
  return (
    <section className="page-hero section-pad login-page-v15">
      <div className="container login-layout-v15">
        <div className="panel-card login-panel login-console-card">
          <span className="section-kicker">Secure portal access</span>
          <h1>Login to the Phoenix Precision Drones platform.</h1>
          <p className="lead-copy">
            Customer, pilot, and operations access will connect to authenticated portal workflows after the public site shell is complete.
          </p>

          <form className="login-form-preview">
            <label>
              Email
              <input type="email" placeholder="you@example.com" disabled />
            </label>
            <label>
              Password
              <input type="password" placeholder="Password" disabled />
            </label>
            <button className="primary-btn full-width-btn" type="button" disabled>
              <LockKeyhole size={18} /> Login Coming Soon
            </button>
          </form>

          <p className="login-note">
            Portal access is controlled. Customers, pilots, and partners can use the contact page or PPD AI chat to request access, project intake, or pilot network information.
          </p>
          <div className="hero-actions centered-actions">
            <Link className="ghost-btn" href="/contact">Request Access</Link>
            <Link className="ghost-btn" href="/pilots">Apply as Pilot</Link>
          </div>
        </div>

        <div className="login-access-stack">
          {accessCards.map(({ title, text, Icon, href }) => (
            <Link href={href} className="panel-card login-access-card" key={title}>
              <Icon size={30} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Link>
          ))}
          <article className="panel-card login-access-card login-safety-card">
            <ShieldCheck size={30} />
            <div>
              <h3>Prelaunch safety boundary</h3>
              <p>The login page is themed and ready for future authentication, but it does not currently expose private customer, pilot, financial, or operations data.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
