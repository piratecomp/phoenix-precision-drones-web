"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, Shield, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess, getPortalBootstrap } from "@/lib/portalApi";

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
      setMessage("Portal login is not configured yet.");
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
    <section className="page-hero section-pad login-page-v15 login-gui-page login-game-page">
      <div className="login-game-shell container">
        <div className="login-game-card panel-card">
          <div className="login-topo-ridge" aria-hidden="true" />

          <div className="login-game-header login-game-header-v17_9">
            <div className="login-header-layout">
              <div className="login-header-main">
                <h1>Portal Login</h1>
                <div className="login-chip-row login-chip-row-under-title">
                  <span className="section-kicker">Team Access</span>
                  <div className="login-security-chip"><Shield size={16} /> Live RPC</div>
                </div>
              </div>

              <div className="login-emblem-wrap login-emblem-wrap-inline">
                <Image
                  src="/images/logo-emblem-clean.png"
                  alt="Phoenix Precision Drones logo"
                  width={1026}
                  height={1028}
                  className="login-emblem-only"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="login-game-grid login-game-grid-v17_4">
            <div className="login-form-zone">
              {checkingSession ? (
                <div className="portal-login-loading"><Loader2 className="portal-spin" size={22} /> Checking session...</div>
              ) : primaryPath ? (
                <div className="portal-session-ready login-session-gui">
                  <div>
                    <strong>Active session</strong>
                    <p>Continue to your dashboard or sign out.</p>
                  </div>
                  <div className="hero-actions centered-actions">
                    <Link className="primary-btn" href={primaryPath}>Continue <ArrowRight size={18} /></Link>
                    <button className="ghost-btn" type="button" onClick={handleSignOut}>Sign out</button>
                  </div>
                </div>
              ) : (
                <form className="login-form-preview login-gui-form login-game-form" onSubmit={handleSubmit}>
                  <label>
                    Email
                    <input
                      type="email"
                      placeholder="Enter your email"
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={!configured || loading}
                      required
                    />
                  </label>
                  <button className="primary-btn full-width-btn login-submit-gui" type="submit" disabled={!configured || loading}>
                    {loading ? <Loader2 className="portal-spin" size={18} /> : <LockKeyhole size={18} />}
                    {configured ? "Login" : "Login unavailable"}
                    {configured && !loading ? <ArrowRight size={18} /> : null}
                  </button>
                </form>
              )}

              {message && <p className="portal-error-note">{message}</p>}
              {!configured && <p className="login-note">Portal login is waiting for live Supabase environment variables.</p>}

              <div className="login-gui-actions login-game-actions">
                <Link className="ghost-btn" href="/signup"><UserPlus size={18} /> Create Customer Account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
