"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type BoxRow = { id: string; name?: string; addr?: string };

type NoteRow = { id: string; subject?: string; status?: string; created_at?: string };

export default function ZPanel() {
  const [rows, setRows] = useState<BoxRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Loading...");

  async function load(boxId?: string | null) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    const { data, error } = await supabase.rpc("ppd_desk_boxes");
    if (error) {
      setStatus(error.message);
      return;
    }
    const loaded = (data?.boxes || []) as BoxRow[];
    setRows(loaded);
    const active = boxId || selected || loaded[0]?.id || null;
    setSelected(active);
    if (active) {
      const result = await supabase.rpc("ppd_desk_notes", { p_box: active });
      if (!result.error) setNotes((result.data?.notes || []) as NoteRow[]);
    }
    setStatus("Synced.");
  }

  async function sendNow() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !selected) return;
    setStatus("Queueing...");
    const { error } = await supabase.rpc("ppd_desk_send", { p_box: selected, p_to: to, p_subject: subject, p_body: body });
    if (error) {
      setStatus(error.message);
      return;
    }
    setTo("");
    setSubject("");
    setBody("");
    setStatus("Queued.");
    await load(selected);
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="panel-card company-desk-panel">
      <div className="panel-heading-row">
        <div>
          <span className="section-kicker">Company Desk</span>
          <h2>PPD Workspace</h2>
          <p>Shared team addresses and personal addresses are organized here for review and follow-up.</p>
          <small>{status}</small>
        </div>
        <button className="ghost-btn compact-portal-btn" type="button" onClick={() => load(selected)}>Refresh</button>
      </div>
      <div className="desk-layout">
        <aside className="desk-sidebar">
          <h3>Addresses</h3>
          {rows.length === 0 ? <p className="muted-copy">No records loaded yet.</p> : rows.map((row) => (
            <button className={row.id === selected ? "desk-box active" : "desk-box"} key={row.id} type="button" onClick={() => load(row.id)}>
              <strong>{row.name}</strong>
              <span>{row.addr}</span>
            </button>
          ))}
        </aside>
        <div className="desk-thread-list">
          <h3>Compose</h3>
          <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="recipient@example.com" />
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" rows={5} />
          <button className="portal-action-card" type="button" onClick={sendNow}>Queue Message</button>
          <h3>Recent</h3>
          {notes.length === 0 ? <p className="muted-copy">No recent records.</p> : notes.map((note) => (
            <article className="desk-thread" key={note.id}>
              <strong>{note.subject || "Untitled"}</strong>
              <small>{note.status || "queued"}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
