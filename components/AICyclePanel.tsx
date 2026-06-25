"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type CycleStatus = { counts?: Record<string, any>; state?: any; recent_cycles?: any[]; recent_steps?: any[]; tools?: any[] };

export default function AICyclePanel() {
  const [status, setStatus] = useState<CycleStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("cycles");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_ai_cycle_status");
    if (error) setMessage(error.message); else { setStatus(data as CycleStatus); setMessage(null); }
  }

  async function runCycle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-cycle", { body: { run_business_brain: true, run_department_orchestrator: true, execute_low_risk: true, post_internal_update: true } });
    if (error) setMessage(error.message); else setMessage(data?.ok ? `Cycle completed. Health ${data.health_score}/100. ${data.next_recommended_action}` : data?.error || "Cycle finished.");
    await load(); setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const counts = status?.counts || {};
  const state = status?.state || {};
  const cycles = status?.recent_cycles || [];
  const steps = status?.recent_steps || [];
  const tools = status?.tools || [];

  return (
    <section className="ai-gateway-panel panel-card">
      <div className="portal-game-panel-head"><div><span className="section-kicker">PPD AI Control Cycle</span><h3>Main operating loop</h3></div><div className="maintenance-bridge-buttons"><button className="maintenance-bridge-refresh" type="button" onClick={load} disabled={busy}>Refresh</button><button className="maintenance-bridge-refresh" type="button" onClick={runCycle} disabled={busy}>Run Full Cycle</button></div></div>
      <div className="maintenance-bridge-stats clickable-stats"><button type="button" onClick={() => setView("cycles")}><span>Health</span><strong>{state.health_score ?? 0}</strong><em>Open cycles</em></button><button type="button" onClick={() => setView("steps")}><span>Owner Attention</span><strong>{state.owner_attention_count ?? 0}</strong><em>Open steps</em></button><button type="button" onClick={() => setView("tools")}><span>Tools Active</span><strong>{counts.tools_active ?? 0}/{counts.tools_configured ?? 0}</strong><em>Open tools</em></button><button type="button" onClick={() => setView("counts")}><span>Learning</span><strong>{counts.learning_events ?? 0}</strong><em>Open counts</em></button></div>
      <p className="maintenance-bridge-message">{state.next_recommended_action || "Run the controlled AI cycle to refresh system state."}</p>
      {message && <p className="maintenance-bridge-message">{message}</p>}
      <div className="maintenance-bridge-grid">
        {view === "cycles" && <article className="maintenance-bridge-card"><h4>Recent cycles</h4>{cycles.length === 0 && <p>No cycles yet.</p>}{cycles.slice(0,8).map((c:any)=><div className="maintenance-bridge-row" key={c.id}><strong>{c.cycle_key}</strong><span>{c.cycle_status} · {c.main_brain_version}</span><small>{c.actions_created} created · {c.actions_completed} completed · {c.owner_exceptions} owner attention</small></div>)}</article>}
        {view === "steps" && <article className="maintenance-bridge-card"><h4>Recent cycle steps</h4>{steps.length === 0 && <p>No steps yet.</p>}{steps.slice(0,12).map((s:any)=><div className="maintenance-bridge-row" key={s.id}><strong>{s.step_key}</strong><span>{s.step_status}</span><small>{s.error_text || "Step recorded"}</small></div>)}</article>}
        {view === "tools" && <article className="maintenance-bridge-card"><h4>Provider and bridge tools</h4>{tools.map((t:any)=><div className="maintenance-bridge-row" key={t.tool_key}><strong>{t.tool_key}</strong><span>{t.active ? "active" : t.configured ? "configured" : "needs setup"}</span><small>{t.status_note}</small></div>)}</article>}
        {view === "counts" && <article className="maintenance-bridge-card"><h4>System counts</h4>{Object.entries(counts).map(([key,value])=><div className="maintenance-bridge-row" key={key}><strong>{key}</strong><span>{String(value)}</span></div>)}</article>}
      </div>
    </section>
  );
}
