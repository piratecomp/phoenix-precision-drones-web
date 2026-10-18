"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type DeptStatus = { counts?: Record<string, any>; agents?: any[]; recent_actions?: any[]; recent_cycles?: any[] };

export default function DepartmentAIOrchestratorPanel() {
  const [status, setStatus] = useState<DeptStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("actions");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_get_ai_command_dashboard");
    if (error) setMessage(error.message); else { setStatus(data?.department as DeptStatus); setMessage(null); }
  }

  async function runCycle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-department-ai-orchestrator", { body: { execute_low_risk: true } });
    if (error) setMessage(error.message); else setMessage(`Cycle complete: ${data?.executed_actions ?? 0} executed, ${data?.owner_exceptions ?? 0} owner exceptions.`);
    await load(); setBusy(false);
  }

  async function createCheck() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-department-ai-orchestrator", { body: { create_check: true } });
    if (error) setMessage(error.message); else setMessage(data?.ok ? "Department AI check created and queued." : data?.error || "Check finished.");
    await load(); setBusy(false);
  }

  async function executeAction(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-department-ai-orchestrator", { body: { execute_action_id: id } });
    if (error) setMessage(error.message); else setMessage(data?.ok ? "Department action executed." : data?.message || "Action finished.");
    await load(); setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const counts = status?.counts || {};
  const agents = status?.agents || [];
  const actions = status?.recent_actions || [];
  const cycles = status?.recent_cycles || [];

  return (
    <section className="ai-gateway-panel panel-card">
      <div className="portal-game-panel-head"><div><span className="section-kicker">Department AI Orchestrator</span><h3>Department work status</h3></div><div className="maintenance-bridge-buttons"><button className="maintenance-bridge-refresh" type="button" onClick={load} disabled={busy}>Refresh</button><button className="maintenance-bridge-refresh" type="button" disabled title="Execution is held pending gateway and action-gate validation.">Orchestrator Held</button></div></div>
      <div className="maintenance-bridge-stats clickable-stats"><button type="button" onClick={() => setView("agents")}><span>Agents Active</span><strong>{counts.agents_active ?? 0}</strong><em>Open agents</em></button><button type="button" onClick={() => setView("actions")}><span>Queued</span><strong>{counts.actions_queued ?? 0}</strong><em>Open actions</em></button><button type="button" onClick={() => setView("done")}><span>Completed</span><strong>{counts.actions_completed ?? 0}</strong><em>Open completed</em></button><button type="button" onClick={() => setView("cycles")}><span>Owner Exceptions</span><strong>{counts.actions_owner_exception ?? 0}</strong><em>Open cycles</em></button></div>
      {message && <p className="maintenance-bridge-message">{message}</p>}
      <div className="maintenance-bridge-grid">
        {view === "agents" && <article className="maintenance-bridge-card"><h4>Department AI agents</h4>{agents.map((a:any)=><div className="maintenance-bridge-row" key={a.department_key}><strong>{a.agent_name}</strong><span>{a.agent_status} · {a.autonomy_level}</span><small>{a.mission}</small></div>)}</article>}
        {(view === "actions" || view === "done") && <article className="maintenance-bridge-card"><h4>Department action queue</h4>{actions.length === 0 && <p>No department actions.</p>}{actions.filter((a:any)=> view === "done" ? a.action_status === "completed" : a.action_status !== "completed").slice(0,10).map((a:any)=><div className="maintenance-bridge-row" key={a.id}><strong>{a.title}</strong><span>{a.action_status} · {a.risk_tier} · {a.department_key}</span><small>{a.summary}</small>{["queued","failed"].includes(a.action_status) && <small>Execution held.</small>}</div>)}</article>}
        {view === "cycles" && <article className="maintenance-bridge-card"><h4>Recent cycles</h4>{cycles.length === 0 && <p>No cycles yet.</p>}{cycles.map((c:any)=><div className="maintenance-bridge-row" key={c.id}><strong>{c.cycle_key}</strong><span>{c.cycle_status}</span><small>{c.generated_actions} generated · {c.executed_actions} executed · {c.owner_exceptions} exceptions</small></div>)}</article>}
      </div>
    </section>
  );
}
