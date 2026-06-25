"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [view, setView] = useState<"all" | "github" | "database" | "credentials" | "exceptions">("all");
  const [detail, setDetail] = useState<any | null>(null);
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

  async function createDatabaseCheck() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Creating harmless database bridge check...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-database-executor", { body: { create_check: true } });
    if (error) setMessage(error.message);
    else setMessage(data?.ok ? "Database bridge check created." : data?.error || "Database check finished.");
    await loadStatus();
    setBusy(false);
  }

  async function runGitHubAction(actionId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Running Maintenance AI GitHub bridge action...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-bridge-executor", { body: { github_action_id: actionId } });
    if (error) setMessage(error.message);
    else setMessage(data?.result?.pull_request_url ? `PR opened: ${data.result.pull_request_url}` : "GitHub bridge action finished.");
    await loadStatus();
    setBusy(false);
  }

  async function runDatabaseAction(actionId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Running controlled database executor...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-database-executor", { body: { database_action_id: actionId } });
    if (error) setMessage(error.message);
    else setMessage(data?.ok ? "Database repair action applied." : data?.validation?.block_reason || data?.error || "Database executor finished.");
    await loadStatus();
    setBusy(false);
  }

  async function showDetail(type: "github" | "database", id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("ppd_get_maintenance_bridge_detail", { p_item_type: type, p_item_id: id });
    if (error) setMessage(error.message);
    else {
      setDetail(data);
      setMessage(null);
    }
    setBusy(false);
  }

  async function runVercelWatch() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Checking Vercel deployment health...");
    const { data, error } = await supabase.functions.invoke("maintenance-ai-vercel-watch", { body: { project_id: "prj_DyKfJALeQcErqzzMOkDVVWqXN4ci" } });
    if (error) setMessage(error.message);
    else setMessage(`Vercel checked: ${data?.deployments_checked ?? 0} deployments, ${data?.failed_count ?? 0} failed.`);
    await loadStatus();
    setBusy(false);
  }

  useEffect(() => { if (visible) loadStatus(); }, [visible]);

  const githubActions = status?.github_actions || [];
  const databaseActions = status?.database_actions || [];
  const credentials = status?.credential_status || [];
  const counts = status?.counts || {};
  const filteredGithub = useMemo(() => view === "database" || view === "credentials" ? [] : githubActions, [view, githubActions]);
  const filteredDatabase = useMemo(() => view === "github" || view === "credentials" ? [] : databaseActions, [view, databaseActions]);

  if (!visible) return null;

  return (
    <section className="maintenance-bridge-panel panel-card">
      <div className="portal-game-panel-head maintenance-bridge-head">
        <div><span className="section-kicker">Maintenance AI Bridge</span><h3>Code, database, deployment, and provider repair control</h3></div>
        <div className="maintenance-bridge-buttons">
          <button className="maintenance-bridge-refresh" type="button" onClick={loadStatus} disabled={busy}>Refresh</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={runVercelWatch} disabled={busy}>Check Vercel</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={createBridgeCheck} disabled={busy}>Create Test PR</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={createDatabaseCheck} disabled={busy}>Create DB Check</button>
        </div>
      </div>

      <div className="maintenance-bridge-stats clickable-stats">
        <button type="button" onClick={() => setView("github")}><span>GitHub Actions</span><strong>{counts.github_actions ?? 0}</strong><em>Open list</em></button>
        <button type="button" onClick={() => setView("database")}><span>DB Actions</span><strong>{counts.database_actions ?? 0}</strong><em>Open list</em></button>
        <button type="button" onClick={() => setView("exceptions")}><span>Owner Exceptions</span><strong>{counts.open_owner_exceptions ?? 0}</strong><em>Open list</em></button>
        <button type="button" onClick={() => setView("credentials")}><span>Tools Active</span><strong>{counts.tools_active ?? 0}/{counts.tools_configured ?? 0}</strong><em>Open tools</em></button>
      </div>

      {message && <p className="maintenance-bridge-message">{message}</p>}

      {detail && (
        <article className="maintenance-bridge-detail panel-card">
          <div className="portal-game-panel-head"><div><span className="section-kicker">Bridge Detail</span><h3>{detail.repair_plan?.title || detail.database_action?.migration_name || detail.github_action?.file_path || "Repair action"}</h3></div><button className="maintenance-bridge-refresh" type="button" onClick={() => setDetail(null)}>Close</button></div>
          <p>{detail.repair_plan?.description || detail.incident?.description || detail.database_action?.action_type || detail.github_action?.action_type}</p>
          {detail.github_action?.pull_request_url && <a className="maintenance-bridge-run" href={detail.github_action.pull_request_url} target="_blank" rel="noreferrer">Open PR</a>}
          {detail.database_action && <pre>{JSON.stringify({ status: detail.database_action.action_status, risk: detail.database_action.risk_tier, result: detail.database_action.execution_result, logs: detail.execution_logs }, null, 2)}</pre>}
          {detail.github_action && <pre>{JSON.stringify({ status: detail.github_action.action_status, risk: detail.github_action.risk_tier, branch: detail.github_action.target_branch, result: detail.github_action.execution_result }, null, 2)}</pre>}
        </article>
      )}

      <div className="maintenance-bridge-grid">
        {(view === "all" || view === "github" || view === "exceptions") && <article className="maintenance-bridge-card"><h4>GitHub repair queue</h4>{filteredGithub.length === 0 && <p>No GitHub actions in this view.</p>}{filteredGithub.slice(0,8).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.file_path || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.pull_request_url || a.target_branch || a.repo_full_name}</small><div className="maintenance-bridge-row-actions"><button className="maintenance-bridge-run" type="button" onClick={() => showDetail("github", a.id)} disabled={busy}>Details</button>{a.pull_request_url && <a className="maintenance-bridge-run" href={a.pull_request_url} target="_blank" rel="noreferrer">Open PR</a>}{["queued","drafted"].includes(a.action_status) && <button className="maintenance-bridge-run" type="button" onClick={() => runGitHubAction(a.id)} disabled={busy}>Run Bridge</button>}</div></div>)}</article>}
        {(view === "all" || view === "database" || view === "exceptions") && <article className="maintenance-bridge-card"><h4>Supabase repair queue</h4>{filteredDatabase.length === 0 && <p>No database actions in this view.</p>}{filteredDatabase.slice(0,8).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.migration_name || a.action_type}</strong><span>{a.action_status} · {a.risk_tier}</span><small>{a.target_table || a.target_function || "Draft"}</small><div className="maintenance-bridge-row-actions"><button className="maintenance-bridge-run" type="button" onClick={() => showDetail("database", a.id)} disabled={busy}>Details</button>{["queued","drafted","validated"].includes(a.action_status) && <button className="maintenance-bridge-run" type="button" onClick={() => runDatabaseAction(a.id)} disabled={busy}>Run DB Executor</button>}</div></div>)}</article>}
      </div>

      {(view === "all" || view === "credentials") && <div className="maintenance-credential-strip">{credentials.map((c:any)=><span className={c.active ? "active" : c.configured ? "configured" : "missing"} key={c.tool_key}>{c.tool_key}: {c.active ? "active" : c.configured ? "configured" : "needs setup"}</span>)}</div>}
    </section>
  );
}
