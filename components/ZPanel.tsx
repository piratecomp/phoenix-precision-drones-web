"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type BoxRow = { id: string; name?: string; addr?: string };

export default function ZPanel() {
  const [rows, setRows] = useState<BoxRow[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    let alive = true;
    async function run() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setStatus("Supabase is not configured.");
        return;
      }
      const { data, error } = await supabase.rpc("ppd_desk_boxes");
      if (!alive) return;
      if (error) {
        setStatus(error.message);
        return;
      }
      setRows((data?.boxes || []) as BoxRow[]);
      setStatus("Synced.");
    }
    run();
    return () => { alive = false; };
  }, []);

  return (
    <section className="panel-card company-desk-panel">
      <div className="panel-heading-row">
        <div>
          <span className="section-kicker">Company Desk</span>
          <h2>PPD Workspace</h2>
          <p>Shared team addresses and personal addresses are organized here for review and follow-up.</p>
          <small>{status}</small>
        </div>
      </div>
      <div className="desk-layout">
        <aside className="desk-sidebar">
          <h3>Addresses</h3>
          {rows.length === 0 ? <p className="muted-copy">No records loaded yet.</p> : rows.map((row) => (
            <div className="desk-box" key={row.id}>
              <strong>{row.name}</strong>
              <span>{row.addr}</span>
            </div>
          ))}
        </aside>
        <div className="desk-thread-list">
          <h3>Workspace</h3>
          <p className="muted-copy">Thread and reply tools will appear here as records arrive.</p>
        </div>
      </div>
    </section>
  );
}
