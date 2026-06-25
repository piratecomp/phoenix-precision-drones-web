"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type GatewayStatus = { counts?: Record<string, any>; recent_requests?: any[]; recent_work_items?: any[] };

export default function AIGatewayPanel() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("all");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_ai_gateway_status");
    if (error) setMessage(error.message); else { setStatus(data as GatewayStatus); setMessage(null); }
  }

  async function createTest() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { create_test: true } });
    if (error) setMessage(error.message); else setMessage(data?.request_id ? `Request queued: ${data.request_id}` : "Request queued.");
    await load(); setBusy(false);
  }

  async function runBusinessCycle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { business_cycle: true } });
    if (error) setMessage(error.message); else setMessage(`Brain cycle queued ${data?.created_count ?? 0} requests.`);
    await load(); setBusy(false);
  }

  async function runRequest(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { request_id: id } });
    if (error) setMessage(error.message); else setMessage(data?.ok ? "Request completed." : data?.error || "Request finished.");
    await load(); setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const counts = status?.counts || {};
  const allRequests = status?.recent_requests || [];
  const requests = view === "queued" ? allRequests.filter((r) => r.request_status === "queued") : view === "completed" ? allRequests.filter((r) => r.request_status === "completed") : view === "failed" ? allRequests.filter((r) => r.request_status === "failed") : allRequests;
  const workItems = status?.recent_work_items || [];

  return (
    <section className="ai-gateway-panel panel-card">
      <div className="portal-game-panel-head"><div><span className="section-kicker">PPD Business Brain</span><h3>AI Gateway execution layer</h3></div><div className="maintenance-bridge-buttons"><button className="maintenance-bridge-refresh" type="button" onClick={load} disabled={busy}>Refresh</button><button className="maintenance-bridge-refresh" type="button" onClick={createTest} disabled={busy}>Create Test</button><button className="maintenance-bridge-refresh" type="button" onClick={runBusinessCycle} disabled={busy}>Run Brain Cycle</button></div></div>
      <div className="maintenance-bridge-stats clickable-stats"><button type="button" onClick={() => setView("queued")}><span>Queued</span><strong>{counts.queued ?? 0}</strong><em>Open list</em></button><button type="button" onClick={() => setView("completed")}><span>Completed</span><strong>{counts.completed ?? 0}</strong><em>Open list</em></button><button type="button" onClick={() => setView("failed")}><span>Failed</span><strong>{counts.failed ?? 0}</strong><em>Open list</em></button><button type="button" onClick={() => setView("work")}><span>Work Items</span><strong>{counts.generated_work_items ?? 0}</strong><em>Open items</em></button></div>
      {message && <p className="maintenance-bridge-message">{message}</p>}
      <div className="maintenance-bridge-grid">
        {view !== "work" && <article className="maintenance-bridge-card"><h4>AI Gateway requests</h4>{requests.length === 0 && <p>No requests in this view.</p>}{requests.slice(0, 8).map((r:any)=><div className="maintenance-bridge-row" key={r.id}><strong>{r.request_type}</strong><span>{r.request_status} · {r.risk_tier} · {r.department_key}</span><small>{r.prompt_preview}</small>{r.request_status === "queued" && <button className="maintenance-bridge-run" type="button" onClick={() => runRequest(r.id)} disabled={busy}>Run Request</button>}{r.request_status === "failed" && <small>External gateway rejected this run. Check provider account readiness before retry.</small>}</div>)}</article>}
        {(view === "all" || view === "work") && <article className="maintenance-bridge-card"><h4>Generated work items</h4>{workItems.length === 0 && <p>No generated work items yet.</p>}{workItems.slice(0, 8).map((w:any)=><div className="maintenance-bridge-row" key={w.id}><strong>{w.title}</strong><span>{w.work_item_status} · {w.risk_tier} · {w.department_key}</span><small>{w.summary}</small></div>)}</article>}
      </div>
    </section>
  );
}
