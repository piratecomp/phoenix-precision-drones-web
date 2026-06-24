"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard, Loader2, LockKeyhole, Radio, Shield, UserRound, UsersRound } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap } from "@/lib/portalApi";

const accessCards = [
  {
    title: "Customer",
    text: "Projects, files, reports, invoices",
    Icon: UserRound,
    href: "/portal/customer",
  },
  {
    title: "Pilot",
    text: "Missions, safety, uploads, payouts",
    Icon: Radio,
    href: "/portal/pilot-network",
  },
  {
    title: "Operations",
    text: "Owner, admin, finance, safety",
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
      setMessage("Supabase public environment variables are required before live login testing.");
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
    <section className="page-hero section-pad login-page-v15 login-gui-page">
      <div className="container login-gui-layout">
        <div className="panel-card login-panel login-console-card login-gui-card">
          <div className="login-gui-topline">
            <span className="login-gui-dot" />
            <span>Secure Portal</span>
            <span className="login-gui-live">V17.1</span>
          </div>

          <div className="login-brand-stage">
            <Image
              src="/images/header-brand-mobile-combined-clean.png"
              alt="Phoenix Precision Drones"
              width={1128}
              height={296}
              className="login-brand-image"
              priority
            />
          </div>

          <div className="login-title-row">
            <div>
              <span className="section-kicker">Owner / Team Access</span>
              <h1>Portal Login</h1>
            </div>
            <div className="login-security-chip"><Shield size={16} /> Live RPC</div>
          </div>

          {checkingSession ? (
            <div className="portal-login-loading"><Loader2 className="portal-spin" size={22} /> Checking session...</div>
          ) : primaryPath ? (
            <div className="portal-session-ready login-session-gui">
              <div>
                <strong>Active session</strong>
                <p>Continue to your dashboard or sign out.</p>
              </div>
              <div className="hero-actions centered-actions">
                <Link className="primary-btn" href={primaryPath}><LayoutDashboard size={18} /> Continue</Link>
                <button className="ghost-btn" type="button" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <form className="login-form-preview login-gui-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="piratecomp@icloud.com"
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
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!configured || loading}
                  required
                />
              </label>
              <button className="primary-btn full-width-btn login-submit-gui" type="submit" disabled={!configured || loading}>
                {loading ? <Loader2 className="portal-spin" size={18} /> : <LockKeyhole size={18} />}
                {configured ? "Login" : "Supabase not configured"}
                {configured && !loading ? <ArrowRight size={18} /> : null}
              </button>
            </form>
          )}

          {message && <p className="portal-error-note">{message}</p>}
          {!configured && (
            <p className="login-note">
              Supabase public environment variables are required before live login testing.
            </p>
          )}

          <div className="login-gui-actions">
            <Link className="ghost-btn" href="/portal"><LayoutDashboard size={18} /> View Portal</Link>
            <Link className="ghost-btn" href="/contact">Request Access</Link>
          </div>
        </div>

        <div className="login-gui-side panel-card">
          <div className="login-side-header">
            <span className="section-kicker">Portal Areas</span>
            <h2>One secure gateway.</h2>
          </div>
          <div className="login-access-stack login-gui-access-stack">
            {accessCards.map(({ title, text, Icon, href }) => (
              <Link href={href} className="login-gui-access-card" key={title}>
                <Icon size={24} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
          <div className="login-gui-status-grid">
            <span><strong>Auth</strong> Supabase</span>
            <span><strong>Route</strong> Guarded</span>
            <span><strong>Data</strong> Live RPC</span>
          </div>
        </div>
      </div>
    </section>
  );
}
