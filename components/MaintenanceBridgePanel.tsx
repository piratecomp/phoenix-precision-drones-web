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
  const [busy, setBusy] = useState(false);
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

  async function createBridgeCheck() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Creating harmless Maintenance AI bridge check...");
    const { error } = await supabase.rpc("ppd_maintenance_ai_create_bridge_check");
    if (error) setMessage(error.message);
    else {
      setMessage("Bridge check created. Run the queued GitHub action to open the PR.");
      await loadStatus();
    }
    setBusy(false);
  }

  async function runGitHubAction(actionId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Running Maintenance AI GitHub bridge action...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-bridge-executor", {
      body: { github_action_id: actionId },
    });
    if (error) setMessage(error.message);
    else setMessage(data?.result?.pull_request_url ? `PR opened: ${data.result.pull_request_url}` : "GitHub bridge action finished.");
    await loadStatus();
    setBusy(false);
  }

  async function runVercelWatch() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Checking Vercel deployment health...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-vercel-watch", {
      body: { project_id: "prj_DyKfJALeQcErqzzMOkDVVWqXN4ci" },
    });
    if (error) setMessage(error.message);
    else setMessage(`Vercel checked: ${data?.deployments_checked ?? 0} deployments, ${data?.failed_count ?? 0} failed.`);
    await loadStatus();
    setBusy(false);
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
        <div className="maintenance-bridge-buttons">
          <button className="maintenance-bridge-refresh" type="button" onClick={loadStatus} disabled={busy}>Refresh</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={runVercelWatch} disabled={busy}>Check Vercel</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={createBridgeCheck} disabled={busy}>Create Test PR</button>
        </div>
      </div>
      <div className="maintenance-bridge-stats">
        <article><span>GitHub Actions</span><strong>{counts.github_actions ?? 0}</strong></article>
        <article><span>DB Actions</span><strong>{counts.database_actions ?? 0}</strong></article>
        <article><span>Owner Exceptions</span><strong>{counts.open_owner_exceptions ?? 0}</strong></article>
        <article><span>Tools Active</span><strong>{counts.tools_active ?? 0}/{counts.tools_configured ?? 0}</strong></article>
      </div>
      {message && <p className="maintenance-bridge-message">{message}</p>}
      <div className="maintenance-bridge-grid">
        <article className="maintenance-bridge-card"><h4>GitHub repair queue</h4>{githubActions.length === 0 && <p>No GitHub actions queued.</p>}{githubActions.slice(0,5).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.file_path || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.pull_request_url || a.target_branch || a.repo_full_name}</small>{["queued","drafted"].includes(a.action_status) && <button className="maintenance-bridge-run" type="button" onClick={() => runGitHubAction(a.id)} disabled={busy}>Run Bridge</button>}</div>)}</article>
        <article className="maintenance-bridge-card"><h4>Supabase repair queue</h4>{databaseActions.length === 0 && <p>No database actions queued.</p>}{databaseActions.slice(0,5).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.migration_name || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.target_table || a.target_function || "Draft"}</small></div>)}</article>
      </div>
      <div className="maintenance-credential-strip">{credentials.map((c:any)=><span className={c.active ? "active" : c.configured ? "configured" : "missing"} key={c.tool_key}>{c.tool_key}: {c.active ? "active" : c.configured ? "configured" : "needs setup"}</span>)}</div>
    </section>
  );
}
