"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./PayrollDepartmentWorkspace.module.css";

type Row = Record<string, any>;
type View = "timecards" | "adjustments" | "payruns" | "tax" | "audit";
const sections: { key: View; label: string }[] = [
  { key: "timecards", label: "Timecards" }, { key: "adjustments", label: "Adjustments" },
  { key: "payruns", label: "Pay runs" }, { key: "tax", label: "Tax AI" }, { key: "audit", label: "Audit trail" },
];

function cash(value: unknown) {
  return value === null || value === undefined ? "Held" : Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function label(value: unknown) { return String(value ?? "Pending").replaceAll("_", " "); }

export default function PayrollDepartmentWorkspace() {
  const [periodId, setPeriodId] = useState("");
  const [data, setData] = useState<Row | null>(null);
  const [view, setView] = useState<View>("timecards");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("timecard");
  const [workerId, setWorkerId] = useState("");
  const [change, setChange] = useState("");
  const [correctedMinutes, setCorrectedMinutes] = useState<Record<string, string>>({});

  const load = useCallback(async (selected?: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) { setNotice("Payroll database is not configured."); return; }
    const [workspace, dashboard] = await Promise.all([
      client.rpc("ppd_get_payroll_workspace", { p_payroll_period_id: selected || null }),
      client.rpc("ppd_get_payroll_dashboard_state"),
    ]);
    if (workspace.error || dashboard.error) { setNotice(workspace.error?.message || dashboard.error?.message || "Unable to load payroll."); return; }
    const result = workspace.data as Row;
    const flags = result?.period?.id ? await client.rpc("ppd_get_payroll_review_flags", { p_period_id: result.period.id }) : null;
    if (flags?.error) { setNotice(flags.error.message); return; }
    setData({ ...result, workers: dashboard.data?.workers || [], review_flags: flags?.data || {} });
    setPeriodId(result?.period?.id || "");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(name: string, args: Row) {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true); setNotice("");
    try {
      const { data: result, error } = await client.rpc(name, args);
      if (error) throw error;
      if (result?.ok === false) throw new Error(result.error || "Action blocked by payroll controls.");
      setNotice("Recorded. No payment or tax filing was sent.");
      setReason(""); setChange("");
      await load(periodId);
    } catch (err: any) { setNotice(err?.message || "Unable to complete payroll action."); }
    finally { setBusy(false); }
  }

  const period = data?.period;
  const timecards: Row[] = data?.timecards || [];
  const entries: Row[] = data?.entries || [];
  const batches: Row[] = data?.batches || [];
  const changes: Row[] = data?.changes || [];
  const rates: Row[] = data?.tax_rates || [];
  const owner = data?.permissions?.owner === true;
  const changeFlags: Row[] = data?.review_flags?.changes || [];
  const batchFlags: Row[] = data?.review_flags?.batches || [];
  const periodOpen = period && !["paid", "closed", "locked"].includes(period.status);
  const taxTotals = entries.reduce((sum, entry) => ({
    federal: sum.federal + Number(entry.federal || 0), az: sum.az + Number(entry.az || 0),
    social: sum.social + Number(entry.social_security || 0), medicare: sum.medicare + Number(entry.medicare || 0),
    futa: sum.futa + Number(entry.futa || 0),
  }), { federal: 0, az: 0, social: 0, medicare: 0, futa: 0 });

  return <section className={styles.workspace} aria-label="Payroll department workspace">
    <header className={styles.header}>
      <div><span className="section-kicker">PPD Payroll Department</span><h2>Payroll workspace</h2>
        <p>Review time, proposed changes, payroll drafts, tax holds, and authorizations in one place.</p></div>
      <button type="button" onClick={() => load(periodId)} disabled={busy}>Refresh workspace</button>
    </header>
    <div className={styles.periodRow}>
      <label>Workweek <select value={periodId} onChange={(event) => void load(event.target.value)}>
        {!periodId && <option value="">No period</option>}
        {(data?.periods || []).map((p: Row) => <option key={p.id} value={p.id}>{p.start_date} – {p.end_date} · {label(p.status)}</option>)}
      </select></label>
      <span>Pay date: {period?.pay_date || "Not set"}</span><span>Preflight: {label(period?.preflight_status)}</span>
    </div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <nav className={styles.tabs} aria-label="Payroll sections">{sections.map((tab) =>
      <button key={tab.key} type="button" aria-current={view === tab.key ? "page" : undefined} onClick={() => setView(tab.key)}>{tab.label}</button>)}</nav>

    {view === "timecards" && <div className={styles.cards}>
      <h3>Timecard review <small>{timecards.length} records</small></h3>
      <label>Review note <input value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="Reason for a hold or review" /></label>
      {!timecards.length && <p>No timecards in this workweek.</p>}
      {timecards.map((card) => <article className={styles.row} key={`${card.card_type}-${card.id}`}>
        <div><strong>{card.display_name || "Unmatched worker"} · {card.card_type.toUpperCase()}</strong>
          <span>{card.clock_in} → {card.clock_out || "Open"} · {card.total_minutes ?? "?"} minutes · {card.approved ? "Approved" : "Needs review"}</span></div>
        <div className={styles.rowActions}>
          <input aria-label={`Correct minutes for ${card.display_name || "worker"}`} type="number" min="1" value={correctedMinutes[card.id] ?? ""}
            onChange={(event) => setCorrectedMinutes((previous) => ({ ...previous, [card.id]: event.target.value }))} placeholder="Minutes" />
          <button type="button" disabled={busy || !periodOpen || !card.clock_out || card.timecard_status === "drafted" || reason.trim().length < 12 || !correctedMinutes[card.id]}
            onClick={() => act("ppd_correct_payroll_timecard_minutes", { p_card_type: card.card_type, p_card_id: card.id,
              p_minutes: Number(correctedMinutes[card.id]), p_reason: reason })}>Correct minutes</button>
          <button type="button" disabled={busy || !periodOpen || !card.clock_out || card.timecard_status === "drafted" || card.approved}
            onClick={() => act("ppd_review_payroll_timecard", { p_card_type: card.card_type, p_card_id: card.id, p_decision: "approve", p_note: reason || null })}>Approve time</button>
          <button type="button" disabled={busy || !periodOpen || !card.clock_out || card.timecard_status === "drafted" || reason.trim().length < 8}
            onClick={() => act("ppd_review_payroll_timecard", { p_card_type: card.card_type, p_card_id: card.id, p_decision: "hold", p_note: reason })}>Hold</button>
        </div>
      </article>)}
    </div>}

    {view === "adjustments" && <div className={styles.cards}>
      <h3>Request a payroll change</h3><p>Requests are reviewed and logged. Approval flags a change for recalculation; it does not alter wages or taxes.</p>
      <div className={styles.formGrid}>
        <label>Category <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="timecard">Timecard</option><option value="pay_rate">Pay rate</option><option value="tax_inputs">Tax inputs</option><option value="other">Other</option>
        </select></label>
        <label>Worker <select value={workerId} onChange={(event) => setWorkerId(event.target.value)}><option value="">General / select later</option>
          {(data?.workers || []).map((w: Row) => <option key={w.id} value={w.id}>{w.display_name}</option>)}</select></label>
      </div>
      <label>Proposed change <textarea value={change} maxLength={2000} onChange={(event) => setChange(event.target.value)} placeholder="Describe the correction and supporting records. Do not enter SSNs or bank account numbers." /></label>
      <button type="button" disabled={busy || !periodOpen || change.trim().length < 12}
        onClick={() => act("ppd_request_payroll_change", { p_period_id: periodId, p_worker_id: workerId || null, p_category: category, p_proposed_change: change })}>Submit for review</button>
      <h3>Change queue</h3>{!changes.length && <p>No proposed changes.</p>}
      {changes.map((item) => { const flag = changeFlags.find((candidate) => candidate.id === item.id); return <article className={styles.row} key={item.id}><div><strong>{label(item.category)} · {item.worker || "General"}</strong>
        <span>{item.proposed_change}</span><small>{label(item.status)} {item.review_note ? `· ${item.review_note}` : ""}</small></div>
        {owner && item.status === "pending_review" && <div className={styles.rowActions}>
          <input aria-label="Owner review note" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Review note (8+ characters)" />
          <button type="button" disabled={busy || reason.trim().length < 8} onClick={() => act("ppd_review_payroll_change", { p_request_id: item.id, p_decision: "approved_for_recalculation", p_note: reason })}>Approve review</button>
          <button type="button" disabled={busy || reason.trim().length < 8} onClick={() => act("ppd_review_payroll_change", { p_request_id: item.id, p_decision: "rejected", p_note: reason })}>Reject</button>
        </div>}
        {owner && item.status === "approved_for_recalculation" && !flag?.resolved_at && <div className={styles.rowActions}>
          <input aria-label="Recalculation evidence" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe correction (12+ characters)" />
          <button type="button" disabled={busy || reason.trim().length < 12} onClick={() => act("ppd_resolve_payroll_change", { p_request_id: item.id, p_note: reason })}>Confirm new draft</button>
        </div>}
        {flag?.resolved_at && <small>New draft confirmed · {flag.resolution_note}</small>}
      </article>; })}
    </div>}

    {view === "payruns" && <div className={styles.cards}>
      <h3>Payroll drafts and authorization</h3><p>Owner authorization uses the live payroll gate. It cannot send funds; held items and missing registrations block approval.</p>
      {!batches.length && <p>No batch for the selected workweek. Use the control panel below to prepare a draft.</p>}
      {batches.map((batch) => { const hold = batchFlags.find((candidate) => candidate.id === batch.id)?.manual_hold_reason; return <article className={styles.row} key={batch.id}><div><strong>{label(batch.status)} · {batch.item_count} items</strong>
        <span>Gross {cash(batch.gross)} · Net {cash(batch.net)} · Tax estimate {cash(batch.tax)}</span></div><div className={styles.rowActions}>
        {owner && !batch.owner_approved_at && !hold && <button type="button" disabled={busy || !periodOpen || batch.item_count === 0}
          onClick={() => act("ppd_mark_payroll_batch_owner_approved", { p_payment_batch_id: batch.id })}>Owner authorize (gated)</button>}
        <input aria-label="Batch hold reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Hold reason (8+ characters)" />
        {hold ? <><span>Manual hold: {hold}</span>{owner && <button type="button" disabled={busy || !periodOpen || reason.trim().length < 8} onClick={() => act("ppd_release_payroll_batch_hold", { p_batch_id: batch.id, p_reason: reason })}>Release hold for review</button>}</> :
          <button type="button" disabled={busy || !periodOpen || reason.trim().length < 8} onClick={() => act("ppd_hold_payroll_batch", { p_batch_id: batch.id, p_reason: reason })}>Hold batch</button>}
      </div></article>; })}
      <h3>W-2 calculations</h3>{!entries.length && <p>No W-2 calculations for this workweek.</p>}
      {entries.map((entry) => <article className={styles.row} key={entry.id}><div><strong>{entry.worker || "Worker"} · Gross {cash(entry.gross)} · Net {cash(entry.net)}</strong>
        <span>{label(entry.status)} {entry.hold_reason ? `· ${entry.hold_reason}` : ""}</span></div></article>)}
    </div>}

    {view === "tax" && <div className={styles.cards}>
      <h3>Tax AI · payroll tax review</h3><p>Tax AI reads the same payroll calculation records Finance AI uses. These are draft liabilities, not tax deposits or filed returns.</p>
      <button type="button" disabled={busy} onClick={() => act("ppd_recheck_payroll_tax_rules", { p_period_id: periodId || null })}>Recheck recorded tax rules</button>
      <p>This checks saved rate versions and flags review needs. It does not fetch new agency publications or certify a tax election.</p>
      <div className={styles.taxGrid}><div>Federal withholding <strong>{cash(taxTotals.federal)}</strong></div><div>Arizona withholding <strong>{cash(taxTotals.az)}</strong></div>
        <div>Employee Social Security <strong>{cash(taxTotals.social)}</strong></div><div>Employee Medicare <strong>{cash(taxTotals.medicare)}</strong></div>
        <div>Employer FUTA before credit <strong>{cash(taxTotals.futa)}</strong></div></div>
      {entries.some((entry) => entry.hold_reason || entry.net === null) && <p className={styles.notice}>One or more entries are held. Totals shown here are incomplete.</p>}
      <h3>Current tax rule review</h3>{rates.map((rate, index) => <article className={styles.row} key={`${rate.type}-${index}`}><div>
        <strong>{label(rate.jurisdiction)} · {label(rate.type)}</strong><span>{label(rate.status)} · {rate.rate === null ? "Table / rule" : `${Number(rate.rate) * 100}%`}
          {rate.requires_external_table ? " · Additional table review" : ""}</span></div>
        {rate.source_url?.startsWith("https://") && <a href={rate.source_url} target="_blank" rel="noopener noreferrer">Source</a>}
      </article>)}</div>}

    {view === "audit" && <div className={styles.cards}><h3>Payroll review trail</h3>
      {!(data?.audit || []).length && <p>No review actions for this workweek.</p>}
      {(data?.audit || []).map((event: Row, index: number) => <article className={styles.row} key={index}><div>
        <strong>{label(event.action)}</strong><span>{event.created_at} {event.note ? `· ${event.note}` : ""}</span></div></article>)}
    </div>}
  </section>;
}
