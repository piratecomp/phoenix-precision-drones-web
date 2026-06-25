"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type LinkedItemsResponse = {
  ok?: boolean;
  item_type?: string;
  items?: Array<Record<string, any>>;
};

const titles: Record<string, { kicker: string; title: string; subtitle: string }> = {
  critical_events: { kicker: "Owner Command", title: "Critical Events", subtitle: "High and critical operational events that need attention." },
  events: { kicker: "Owner Command", title: "Operational Events", subtitle: "Live operating events across PPD systems." },
  approvals: { kicker: "AI Command", title: "AI Approvals", subtitle: "Owner exceptions and AI decisions waiting in the queue." },
  jobs: { kicker: "Operations", title: "Active Jobs", subtitle: "Jobs and field workflow records." },
  readiness: { kicker: "Launch Control", title: "Production Readiness", subtitle: "Current readiness snapshot for the PPD platform." },
};

export default function PortalLinkedItemsPage({ itemType }: { itemType: string }) {
  const [data, setData] = useState<LinkedItemsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const copy = useMemo(() => titles[itemType] || titles.events, [itemType]);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("ppd_get_linked_dashboard_items", {
      p_item_type: itemType,
      p_limit: 50,
    });
    if (error) setError(error.message);
    else {
      setData(data as LinkedItemsResponse);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [itemType]);

  const items = data?.items || [];

  return (
    <section className="section-pad portal-linked-page">
      <div className="container">
        <div className="portal-linked-header panel-card">
          <span className="section-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className="hero-actions centered-actions">
            <button className="primary-btn" type="button" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
            <Link className="ghost-btn" href="/portal/owner">Owner Dashboard</Link>
          </div>
        </div>

        {error && <p className="portal-error-note">{error}</p>}

        <div className="portal-linked-list">
          {!loading && items.length === 0 && <article className="panel-card portal-linked-row"><h3>No records found.</h3><p>This linked dashboard page is ready, but there are no matching records right now.</p></article>}
          {items.map((item, index) => (
            <article className="panel-card portal-linked-row" key={item.id || `${itemType}-${index}`}>
              <div>
                <span className="section-kicker">{item.status || item.source || itemType}</span>
                <h3>{item.title || item.subtitle || "PPD record"}</h3>
                {item.subtitle && <strong>{item.subtitle}</strong>}
                <p>{item.body || item.summary || item.message || "No summary available."}</p>
                <small>{item.created_at ? new Date(item.created_at).toLocaleString() : "Current snapshot"}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
