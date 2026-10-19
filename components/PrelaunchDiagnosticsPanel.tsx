"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Finding = {
  key: string;
  status: string;
  severity: string;
  title: string;
  body: string;
  recommendation: string;
  checked_at: string;
};

export default function PrelaunchDiagnosticsPanel() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState("");

  async function refresh() {
    const client = getSupabaseBrowserClient();
    if (!client) { setError("Supabase is not configured."); return; }
    const { data, error: queryError } = await client.rpc("ppd_prelaunch_diagnostic_status");
    if (queryError) { setError(queryError.message); return; }
    setFindings(data?.findings || []);
    setError("");
  }

  useEffect(() => { void refresh(); }, []);

  return <section className="ai-gateway-panel panel-card" aria-label="Prelaunch system diagnostics">
    <div className="portal-game-panel-head">
      <div><span className="section-kicker">PPD AI · Prelaunch</span><h3>System diagnostics</h3></div>
      <button className="maintenance-bridge-refresh" type="button" onClick={() => void refresh()}>Refresh</button>
    </div>
    <p className="maintenance-bridge-message">Checks run every 30 minutes without starting jobs, payments, flights, or the main AI cycle.</p>
    {error && <p role="alert">{error}</p>}
    {!error && findings.length === 0 && <p>No diagnostic cycle has completed yet.</p>}
    <div className="maintenance-bridge-grid">
      {findings.map(f => <article className="maintenance-bridge-card" key={f.key}>
        <h4>{f.title}</h4>
        <p>{f.status} · {f.severity} · {new Date(f.checked_at).toLocaleString()}</p>
        <p>{f.body}</p>
        {f.status !== "passed" && <small>{f.recommendation}</small>}
      </article>)}
    </div>
  </section>;
}
