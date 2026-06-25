"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Code2, DatabaseZap, GitBranch, Loader2, RefreshCw, ShieldAlert, Wrench } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getPpdMaintenanceBridgeStatus, type PpdMaintenanceBridgeStatus } from "@/lib/portalApi";

export default function MaintenanceBridgePanel({ dashboardKey }: { dashboardKey: string }) {
  const [status, setStatus] = useState<PpdMaintenanceBridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const shouldShow = useMemo(() => ["owner", "admin", "maintenance", "safety"].includes(dashboardKey), [dashboardKey]);

  async function loadStatus() {
    if (!shouldShow) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const data = await getPpdMaintenanceBridgeStatus(supabase);
      setStatus(data);
      setMessage(null);
    } catch (err: any) {
      setMessage(err?.message || "Unable to load Maintenance AI bridge status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, [dashboardKey, shouldShow]);

  if (!shouldShow) return null;

  const counts = status?.counts || {};
  const githubActions = status?.github_actions || [];
  const databaseActions = status?.database_actions || [];
  const credentials = status?.credential_status || [];

  return (
    <section className="maintenance-bridge-panel panel-card">
      <div className="portal-game-panel-head maintenance-bridge-head">
        <div>
          <span className="section-kicker"><Bot size={16} /> Maintenance AI Bridge</span>
          <h3>Code, database, deployment, and provider repair control</h3>
        </div>
        <button className="maintenance-bridge-refresh" type="button" onClick={loadStatus} disabled={loading}>
          {loading ? <Loader2 className="portal-spin" size={16} /> : <RefreshCw size={16} />} Refresh
        </button>
      </div>

      <div className="maintenance-bridge-stats">
        <article><GitBranch size={22} /><span>GitHub Actions</span><strong>{counts.github_actions ?? 0}</strong></article>
        <article><DatabaseZap size={22} /><span>DB Actions</span><strong>{counts.database_actions ?? 0}</strong></article>
        <article><ShieldAlert size={22} /><span>Owner Exceptions</span><strong>{counts.open_owner_exceptions ?? 0}</strong></article>
        <article><Wrench size={22} /><span>Tools Active</span><strong>{counts.tools_active ?? 0}/{counts.tools_configured ?? 0}</strong></article>
      </div>

      {message && <p className="maintenance-bridge-message">{message}</p>}

      <div className="maintenance-bridge-grid">
        <article className="maintenance-bridge-card">
          <h4><Code2 size={18} /> GitHub repair queue</h4>
          {githubActions.length === 0 && <p>No GitHub bridge actions queued yet.</p>}
          {githubActions.slice(0, 5).map((action: any) => (
            <div className="maintenance-bridge-row" key={action.id}>
              <strong>{action.file_path || action.action_type}</strong>
              <span>{action.action_status} · {action.risk_tier}</span>
              <small>{action.target_branch || action.repo_full_name}</small>
            </div>
          ))}
        </article>

        <article className="maintenance-bridge-card">
          <h4><DatabaseZap size={18} /> Supabase repair queue</h4>
          {databaseActions.length === 0 && <p>No database bridge actions queued yet.</p>}
          {databaseActions.slice(0, 5).map((action: any) => (
            <div className="maintenance-bridge-row" key={action.id}>
              <strong>{action.migration_name || action.action_type}</strong>
              <span>{action.action_status} · {action.risk_tier}</span>
              <small>{action.destructive_sql_detected ? "Destructive SQL detected" : action.target_table || action.target_function || "Non-destructive draft"}</small>
            </div>
          ))}
        </article>
      </div>

      <div className="maintenance-credential-strip">
        {credentials.map((credential: any) => (
          <span className={credential.active ? "active" : credential.configured ? "configured" : "missing"} key={credential.tool_key}>
            {credential.tool_key}: {credential.active ? "active" : credential.configured ? "configured" : "needs setup"}
          </span>
        ))}
      </div>
    </section>
  );
}
