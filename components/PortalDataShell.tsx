"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalRedesignShell";
import { portalDashboards } from "@/lib/portal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { checkDashboardAccess } from "@/lib/portalApi";

export function PortalIndexClient() {
  const [configured] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(configured);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;
      if (!sessionData.session) {
        setLoading(false);
        return;
      }
      try {
        const access = await checkDashboardAccess(supabase, "/portal");
        if (!alive) return;
        setPrimaryPath(access.redirect_to || access.requested_dashboard_path || access.primary_dashboard_path || null);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Unable to check portal access.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner portal-loading-card">
          <h1>Checking portal access</h1>
          <p className="lead-copy">Loading your role-based dashboard route.</p>
        </div>
      </section>
    );
  }

  if (primaryPath) {
    return (
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Portal access ready</span>
          <h1>Your Supabase session is active.</h1>
          <p className="lead-copy">Continue to your role-based dashboard.</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href={primaryPath}>Continue to Dashboard</Link>
            <Link className="ghost-btn" href="/login">Switch account</Link>
          </div>
          {error && <p className="portal-error-note">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">PPD portal system</span>
          <h1>One operating portal. Role-based command views.</h1>
          <p className="lead-copy">Customer, pilot, maintenance, safety, finance, operations, and owner command-center dashboards are connected to the Supabase portal registry.</p>
          <div className="hero-actions centered-actions">
            <Link className="primary-btn" href="/login">Login</Link>
            <Link className="ghost-btn" href="/portal/customer">Preview Customer Portal</Link>
          </div>
          {!configured && <p className="portal-error-note">Supabase browser variables are not configured yet.</p>}
          {error && <p className="portal-error-note">{error}</p>}
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-kicker">Role dashboards</span>
            <h2>Frontend routes match the Supabase portal registry.</h2>
          </div>
          <div className="portal-role-grid">
            {portalDashboards.map((dashboard) => (
              <Link className="portal-role-card panel-card" href={dashboard.path} key={dashboard.key}>
                <div>
                  <span>{dashboard.department}</span>
                  <h3>{dashboard.title}</h3>
                  <p>{dashboard.description}</p>
                  <small>{dashboard.path}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function PortalDashboardDataShell({ dashboardKey }: { dashboardKey: string }) {
  return <PortalShell dashboardKey={dashboardKey} />;
}
