"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type GatewayStatus = {
  counts?: Record<string, any>;
  recent_requests?: any[];
  recent_work_items?: any[];
};

export default function AIGatewayPanel() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("ppd_ai_gateway_status");
    if (error) setMessage(error.message);
    else {
      setStatus(data as GatewayStatus);
      setMessage(null);
    }
  }

  async function createTest() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { create_test: true } });
    if (error) setMessage(error.message);
    else setMessage(data?.request_id ? `Test request queued: ${data.request_id}` : "Test request queued.");
    await load();
    setBusy(false);
  }

  async function runBusinessCycle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { business_cycle: true } });
    if (error) setMessage(error.message);
    else setMessage(`Business brain cycle queued ${data?.created_count ?? 0} requests.`);
    await load();
    setBusy(false);
  }

  async function runRequest(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("Running AI Gateway request...");
    const { data, error } = await supabase.functions.invoke("ppd-ai-gateway-executor", { body: { request_id: id } });
    if (error) setMessage(error.message);
    else setMessage(data?.ok ? "AI Gateway request completed." : data?.error || "AI request finished.");
    await load();
    setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const counts = status?.counts || {};
  const requests = status?.recent_requests || [];
  const workItems = status?.recent_work_items || [];

  return (
    <section className="ai-gateway-panel panel-card">
      <div className="portal-game-panel-head">
        <div><span className="section-kicker">PPD Business Brain</span><h3>AI Gateway execution layer</h3></div>
        <div className="maintenance-bridge-buttons">
          <button className="maintenance-bridge-refresh" type="button" onClick={load} disabled={busy}>Refresh</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={createTest} disabled={busy}>Create Test</button>
          <button className="maintenance-bridge-refresh" type="button" onClick={runBusinessCycle} disabled={busy}>Run Brain Cycle</button>
        </div>
      </div>

      <div className="maintenance-bridge-stats">
        <article><span>Queued</span><strong>{counts.queued ?? 0}</strong></article>
        <article><span>Completed</span><strong>{counts.completed ?? 0}</strong></article>
        <article><span>Failed</span><strong>{counts.failed ?? 0}</strong></article>
        <article><span>Work Items</span><strong>{counts.generated_work_items ?? 0}</strong></article>
      </div>
      {message && <p className="maintenance-bridge-message">{message}</p>}

      <div className="maintenance-bridge-grid">
        <article className="maintenance-bridge-card">
          <h4>AI Gateway requests</h4>
          {requests.length === 0 && <p>No AI Gateway requests yet.</p>}
          {requests.slice(0, 8).map((r: any) => (
            <div className="maintenance-bridge-row" key={r.id}>
              <strong>{r.request_type}</strong>
              <span>{r.request_status} · {r.risk_tier} · {r.department_key}</span>
              <small>{r.prompt_preview}</small>
              {["queued", "failed"].includes(r.request_status) && <button className="maintenance-bridge-run" type="button" onClick={() => runRequest(r.id)} disabled={busy}>Run Request</button>}
            </div>
          ))}
        </article>
        <article className="maintenance-bridge-card">
          <h4>Generated work items</h4>
          {workItems.length === 0 && <p>No generated work items yet.</p>}
          {workItems.slice(0, 8).map((w: any) => (
            <div className="maintenance-bridge-row" key={w.id}>
              <strong>{w.title}</strong>
              <span>{w.work_item_status} · {w.risk_tier} · {w.department_key}</span>
              <small>{w.summary}</small>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
