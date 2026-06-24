"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Radio, ShieldCheck, UserRound, UsersRound, LayoutDashboard, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap } from "@/lib/portalApi";

const accessCards = [
  {
    title: "Customer Login",
    text: "Project visibility, deliverables, reports, invoices, documents, and communication in one secure portal experience.",
    Icon: UserRound,
    href: "/portal/customer",
  },
  {
    title: "Pilot Login",
    text: "Mission opportunities, dispatch context, safety notes, route details, uploads, equipment status, and payout support.",
    Icon: Radio,
    href: "/portal/pilot-network",
  },
  {
    title: "Operations Portal",
    text: "Owner, admin, finance, maintenance, safety, sales, pilot, observer, and customer dashboards now route through Supabase.",
    Icon: UsersRound,
    href: "/portal",
  },
] as const;

export default function PortalLoginClient() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(configured);
  const [message, setMessage] = useState<string | null>(null);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setCheckingSession(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) {
        try {
          const access = await checkDashboardAccess(supabase, "/portal");
          if (!alive) return;
          setPrimaryPath(access.redirect_to || access.requested_dashboard_path || access.primary_dashboard_path || null);
        } catch {
          // Keep login visible if backend route check fails.
        }
      }
      setCheckingSession(false);
    }
    checkSession();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase browser variables are not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const bootstrap = await getPortalBootstrap(supabase, "/portal");
      const path = bootstrap.primary_dashboard_path || "/portal";
      setPrimaryPath(path);
      window.location.href = path;
    } catch (err: any) {
      setMessage(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setPrimaryPath(null);
    setMessage("Signed out.");
  }

  return (
    <section className="page-hero section-pad login-page-v15">
      <div className="container login-layout-v15">
        <div className="panel-card login-panel login-console-card">
          <span className="section-kicker">V17.1 secure portal access</span>
          <h1>Login to the Phoenix Precision Drones platform.</h1>
          <p className="lead-copy">
            This login is wired for Supabase Auth. After sign-in, the portal calls the backend route guard and redirects each user to their role-based dashboard.
          </p>

          {checkingSession ? (
            <div className="portal-login-loading"><Loader2 className="portal-spin" size={22} /> Checking session...</div>
          ) : primaryPath ? (
            <div className="portal-session-ready">
              <p>You already have an active Supabase session.</p>
              <div className="hero-actions centered-actions">
                <Link className="primary-btn" href={primaryPath}><LayoutDashboard size={18} /> Continue to Dashboard</Link>
                <button className="ghost-btn" type="button" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <form className="login-form-preview" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!configured || loading}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!configured || loading}
                  required
                />
              </label>
              <button className="primary-btn full-width-btn" type="submit" disabled={!configured || loading}>
                {loading ? <Loader2 className="portal-spin" size={18} /> : <LockKeyhole size={18} />}
                {configured ? "Login" : "Supabase not configured"}
              </button>
            </form>
          )}

          {message && <p className="portal-error-note">{message}</p>}
          {!configured && (
            <p className="login-note">
              Add the Supabase anon public key in Vercel before live login testing. The service role key must stay server-only and is not used by this browser login form.
            </p>
          )}
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/portal"><LayoutDashboard size={18} /> View Portal</Link>
            <Link className="ghost-btn" href="/contact">Request Access</Link>
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
              <h3>Private data boundary</h3>
              <p>Route access, dashboard modules, tasks, notifications, and profile links are controlled by Supabase Auth and RLS-backed RPCs.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
