"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type BridgeStatus = {
  counts?: Record<string, any>;
  github_actions?: any[];
  database_actions?: any[];
  credential_status?: any[];
};

export default function MaintenanceBridgePanel({ dashboardKey }: { dashboardKey: string }) {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const visible = ["owner", "admin", "maintenance", "safety"].includes(dashboardKey);

  async function loadStatus() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_maintenance_ai_bridge_status");
    if (error) {
      setMessage(error.message);
      return;
    }
    setStatus(data as BridgeStatus);
    setMessage(null);
  }

  useEffect(() => {
    if (visible) loadStatus();
  }, [visible]);

  if (!visible) return null;
  const counts = status?.counts || {};
  const githubActions = status?.github_actions || [];
  const databaseActions = status?.database_actions || [];
  const credentials = status?.credential_status || [];

  return (
    <section className="maintenance-bridge-panel panel-card">
      <div className="portal-game-panel-head maintenance-bridge-head">
        <div>
          <span className="section-kicker">Maintenance AI Bridge</span>
          <h3>Code, database, deployment, and provider repair control</h3>
        </div>
        <button className="maintenance-bridge-refresh" type="button" onClick={loadStatus}>Refresh</button>
      </div>
      <div className="maintenance-bridge-stats">
        <article><span>GitHub Actions</span><strong>{counts.github_actions ?? 0}</strong></article>
        <article><span>DB Actions</span><strong>{counts.database_actions ?? 0}</strong></article>
        <article><span>Owner Exceptions</span><strong>{counts.open_owner_exceptions ?? 0}</strong></article>
        <article><span>Tools Active</span><strong>{counts.tools_active ?? 0}/{counts.tools_configured ?? 0}</strong></article>
      </div>
      {message && <p className="maintenance-bridge-message">{message}</p>}
      <div className="maintenance-bridge-grid">
        <article className="maintenance-bridge-card"><h4>GitHub repair queue</h4>{githubActions.length === 0 && <p>No GitHub actions queued.</p>}{githubActions.slice(0,5).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.file_path || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.target_branch || a.repo_full_name}</small></div>)}</article>
        <article className="maintenance-bridge-card"><h4>Supabase repair queue</h4>{databaseActions.length === 0 && <p>No database actions queued.</p>}{databaseActions.slice(0,5).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.migration_name || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.target_table || a.target_function || "Draft"}</small></div>)}</article>
      </div>
      <div className="maintenance-credential-strip">{credentials.map((c:any)=><span className={c.active ? "active" : c.configured ? "configured" : "missing"} key={c.tool_key}>{c.tool_key}: {c.active ? "active" : c.configured ? "configured" : "needs setup"}</span>)}</div>
    </section>
  );
}
