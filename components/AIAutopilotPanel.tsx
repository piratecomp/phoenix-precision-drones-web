"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type AutopilotStatus = {
  counts?: Record<string, any>;
  schedules?: any[];
  recent_runs?: any[];
  active_locks?: any[];
};

export default function AIAutopilotPanel() {
  const [status, setStatus] = useState<AutopilotStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("schedules");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_ai_autopilot_status");
    if (error) setMessage(error.message); else { setStatus(data as AutopilotStatus); setMessage(null); }
  }

  async function markDue() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("ppd_ai_mark_autopilot_due", { p_schedule_key: "main_controlled_ai_cycle" });
    if (error) setMessage(error.message); else setMessage(data?.ok ? "Main AI cycle marked due now." : "Schedule marked due.");
    await load(); setBusy(false);
  }

  async function runDue() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("ppd_ai_run_due_autopilot", { p_limit: 3 });
    if (error) setMessage(error.message); else setMessage(data?.ok ? `Autopilot checked. Runs started: ${data.runs_started ?? 0}.` : data?.reason || "Autopilot finished.");
    await load(); setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const counts = status?.counts || {};
  const schedules = status?.schedules || [];
  const runs = status?.recent_runs || [];
  const locks = status?.active_locks || [];

  return (
    <section className="ai-gateway-panel panel-card">
      <div className="portal-game-panel-head">
        <div>
          <span className="section-kicker">PPD AI Autopilot</span>
          <h3>Recurring controlled AI cycle schedule</h3>
        </div>
        <div className="maintenance-bridge-buttons">
          <button className="maintenance-bridge-refresh" type="button" onClick={load} disabled={busy}>Refresh</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={markDue} disabled={busy}>Mark Due Now</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={runDue} disabled={busy}>Run Due Cycles</button>
        </div>
      </div>

      <div className="maintenance-bridge-stats clickable-stats">
        <button type="button" onClick={() => setView("schedules")}><span>Active Schedules</span><strong>{counts.active_schedules ?? 0}</strong><em>Open schedules</em></button>
        <button type="button" onClick={() => setView("schedules")}><span>Due Now</span><strong>{counts.due_now ?? 0}</strong><em>Open due</em></button>
        <button type="button" onClick={() => setView("runs")}><span>Completed Runs</span><strong>{counts.completed_runs ?? 0}</strong><em>Open runs</em></button>
        <button type="button" onClick={() => setView("locks")}><span>Active Locks</span><strong>{counts.active_locks ?? 0}</strong><em>Open locks</em></button>
      </div>

      <p className="maintenance-bridge-message">The scheduler only runs the controlled AI cycle. High-risk work still routes to owner exception; low-risk work can continue into tasks, events, internal messages, and learning records.</p>
      {message && <p className="maintenance-bridge-message">{message}</p>}

      <div className="maintenance-bridge-grid">
        {view === "schedules" && <article className="maintenance-bridge-card"><h4>Autopilot schedules</h4>{schedules.length === 0 && <p>No schedules configured.</p>}{schedules.map((s:any)=><div className="maintenance-bridge-row" key={s.id}><strong>{s.schedule_name}</strong><span>{s.schedule_status} · every {s.run_every_minutes} minutes</span><small>Next: {s.next_run_at || "not set"}</small><small>Last: {s.last_run_at || "never"} · Runs {s.run_count ?? 0} · Failures {s.failure_count ?? 0}</small></div>)}</article>}
        {view === "runs" && <article className="maintenance-bridge-card"><h4>Recent autopilot runs</h4>{runs.length === 0 && <p>No autopilot runs yet.</p>}{runs.slice(0,10).map((r:any)=><div className="maintenance-bridge-row" key={r.id}><strong>{r.run_key}</strong><span>{r.run_status}</span><small>{r.error_text || `Cycle: ${r.cycle_id || "none"}`}</small><small>{r.started_at} → {r.completed_at || "running"}</small></div>)}</article>}
        {view === "locks" && <article className="maintenance-bridge-card"><h4>Runtime locks</h4>{locks.length === 0 && <p>No active runtime locks.</p>}{locks.map((l:any)=><div className="maintenance-bridge-row" key={l.lock_key}><strong>{l.lock_key}</strong><span>{l.lock_owner}</span><small>Locked until {l.locked_until}</small></div>)}</article>}
      </div>
    </section>
  );
}
