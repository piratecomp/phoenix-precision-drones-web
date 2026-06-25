"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function QueuePanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { data, error } = await sb.rpc("ppd_get_linked_dashboard_items", { p_item_type: "approvals", p_limit: 20 });
    if (error) setMsg(error.message); else setRows(data?.items || []);
  }

  async function inspect(id: string) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { data, error } = await sb.rpc("ppd_get_queue_item_review", { p_id: id });
    if (error) setMsg(error.message); else setOpen(data);
  }

  useEffect(() => { load(); }, []);

  const item = open?.approval;
  const note = open?.notification;

  return (
    <section className="queue-panel panel-card" id="ai-queue">
      <div className="portal-game-panel-head"><div><span className="section-kicker">Queue Review</span><h3>Open before deciding</h3></div><button className="maintenance-bridge-refresh" type="button" onClick={load}>Refresh</button></div>
      {msg && <p className="maintenance-bridge-message">{msg}</p>}
      <div className="queue-panel-grid">
        <article className="queue-panel-list">
          {rows.length === 0 && <p>No records waiting.</p>}
          {rows.map((row) => <div className="queue-row" key={row.id}><div><strong>{row.title}</strong><span>{row.detail_text || row.subtitle}</span><small>{row.source} · {row.status}</small></div><button type="button" onClick={() => inspect(row.id)}>Review</button></div>)}
        </article>
        <article className="queue-panel-detail">
          {!open && <p>Select Review to see the record context.</p>}
          {open && <><h4>{item?.action_title}</h4><p>{item?.action_summary}</p>{note && <div><p><strong>To:</strong> {note.recipient_email}</p><p><strong>Subject:</strong> {note.subject}</p><p><strong>Status:</strong> {note.send_status}</p></div>}</>}
        </article>
      </div>
    </section>
  );
}
