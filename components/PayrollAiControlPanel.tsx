"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, RefreshCw, Rocket, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import styles from "./FundingAiControlPanel.module.css";

type JsonMap = Record<string, any>;

function clean(value: unknown) {
  return String(value || "unknown").replace(/_/g, " ");
}

function money(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "$0";
  return numeric.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentPeriodDates() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateText(start), end: dateText(end) };
}

async function rpc<T>(name: string, args?: JsonMap) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase browser client is not configured.");
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw error;
  return data as T;
}

export default function PayrollAiControlPanel() {
  const [configured] = useState(isSupabaseConfigured());
  const [panel, setPanel] = useState<JsonMap | null>(null);
  const [drafts, setDrafts] = useState<JsonMap | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<JsonMap | null>(null);

  const counts = panel?.counts || {};
  const draftCounts = drafts?.counts || {};
  const checks: JsonMap[] = panel?.readiness_checks || [];
  const workers: JsonMap[] = panel?.workers || [];
  const batches: JsonMap[] = drafts?.batches || [];
  const activePeriodId = panel?.active_period?.id as string | undefined;
  const latestBatchId = batches?.[0]?.id as string | undefined;
  const blockers = Number(counts.blockers || 0);

  async function loadPanel() {
    if (!configured) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [payrollPanel, draftPanel] = await Promise.all([
        rpc<JsonMap>("ppd_get_payroll_control_panel"),
        rpc<JsonMap>("ppd_get_payroll_draft_batches"),
      ]);
      setPanel(payrollPanel);
      setDrafts(draftPanel);
    } catch (err: any) {
      setError(err?.message || "Unable to load Payroll AI.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPanel();
  }, []);

  async function openCurrentPeriod() {
    const dates = currentPeriodDates();
    const result = await rpc<JsonMap>("ppd_open_payroll_period", {
      p_start_date: dates.start,
      p_end_date: dates.end,
      p_scope: "mixed",
    });
    return result?.payroll_period_id as string | undefined;
  }

  async function runAction(action: string) {
    setBusy(action);
    setError(null);
    try {
      let result: JsonMap | null = null;
      if (action === "refresh") {
        result = await rpc<JsonMap>("ppd_sync_payroll_role_operations");
      }
      if (action === "period") {
        const periodId = await openCurrentPeriod();
        result = { ok: true, payroll_period_id: periodId };
      }
      if (action === "draft") {
        const periodId = activePeriodId || await openCurrentPeriod();
        result = await rpc<JsonMap>("ppd_generate_payroll_draft_batch", { p_payroll_period_id: periodId });
      }
      if (action === "tax") {
        if (!activePeriodId) throw new Error("Open a payroll period first.");
        result = await rpc<JsonMap>("ppd_apply_draft_tax_rates_to_period", { p_payroll_period_id: activePeriodId });
      }
      if (action === "export") {
        if (!latestBatchId) throw new Error("Generate a draft batch first.");
        result = await rpc<JsonMap>("ppd_create_payroll_provider_export", { p_payment_batch_id: latestBatchId });
      }
      setLastResult(result || { ok: true });
      await loadPanel();
    } catch (err: any) {
      setError(err?.message || "Payroll AI action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.window} aria-label="Payroll AI finance control window">
      <div className={styles.header}>
        <div>
          <span className="section-kicker">Finance Payroll AI</span>
          <h2>W-2 / 1099 Payroll Control Window</h2>
          <p>Control payroll readiness, timecards, draft batches, tax review, and provider-safe exports.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><Loader2 className={styles.spin} size={22} /> Loading payroll intelligence…</div>
      ) : !configured ? (
        <p className={styles.error}>Supabase browser variables are not configured.</p>
      ) : (
        <>
          <div className={styles.statusBar}>
            <span className={blockers > 0 ? styles.warn : styles.good}><ShieldCheck size={15} /> Payroll {blockers > 0 ? "Blocked" : "Ready for Review"}</span>
            <span>{clean(panel?.preflight?.preflight_status)}</span>
            <span>Provider: {clean(panel?.company?.payroll_provider_status)}</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.metricsGrid}>
            <div><span>W-2 Ready</span><strong>{counts.w2_ready || 0}/{counts.w2_workers || 0}</strong></div>
            <div><span>1099 Ready</span><strong>{counts.contract_ready || 0}/{counts.contract_workers || 0}</strong></div>
            <div><span>Blockers</span><strong>{counts.blockers || 0}</strong></div>
            <div><span>Warnings</span><strong>{counts.warnings || 0}</strong></div>
            <div><span>Draft Batches</span><strong>{draftCounts.draft_batches || 0}</strong></div>
            <div><span>Held Items</span><strong>{draftCounts.held_items || 0}</strong></div>
            <div><span>Open Timecards</span><strong>{(counts.open_w2_timecards || 0) + (counts.open_contract_timecards || 0)}</strong></div>
            <div><span>Unapproved Cards</span><strong>{(counts.unapproved_w2_timecards || 0) + (counts.unapproved_contract_timecards || 0)}</strong></div>
            <div><span>Latest Net</span><strong>{money(batches?.[0]?.net_total)}</strong></div>
            <div><span>Batch Status</span><strong>{clean(batches?.[0]?.batch_status)}</strong></div>
            <div><span>EIN</span><strong>{clean(panel?.company?.ein_status)}</strong></div>
            <div><span>AZ Withholding</span><strong>{clean(panel?.company?.state_withholding_status)}</strong></div>
          </div>

          <div className={styles.actions}>
            <button className="primary-btn" type="button" onClick={() => runAction("period")} disabled={Boolean(busy)}>{busy === "period" ? <Loader2 className={styles.spin} size={16} /> : <Rocket size={16} />} Open Period</button>
            <button className="primary-btn" type="button" onClick={() => runAction("draft")} disabled={Boolean(busy)}>{busy === "draft" ? <Loader2 className={styles.spin} size={16} /> : <FileText size={16} />} Draft Batch</button>
            <button className="ghost-btn" type="button" onClick={() => runAction("tax")} disabled={Boolean(busy) || !activePeriodId}>Apply Draft Taxes</button>
            <button className="ghost-btn" type="button" onClick={() => runAction("export")} disabled={Boolean(busy) || !latestBatchId}>Provider-Safe Export</button>
            <button className="ghost-btn" type="button" onClick={() => runAction("refresh")} disabled={Boolean(busy)}>{busy === "refresh" ? <Loader2 className={styles.spin} size={16} /> : <RefreshCw size={16} />} Refresh</button>
          </div>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHead}><h3>Readiness Blockers</h3><span>{checks.length}</span></div>
            {checks.length ? checks.slice(0, 8).map((check) => (
              <p className={styles.queueItem} key={check.id}>
                <strong>{check.title}</strong>
                <span>{clean(check.severity)}</span>
                <em>{check.summary}<br />Next: {check.next_step}</em>
              </p>
            )) : <p className={styles.compactItem}><strong>No open blockers.</strong><span>Payroll can move forward when draft totals and provider readiness are verified.</span></p>}
          </section>

          <section className={styles.twoColumn}>
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHead}><h3>Workers</h3><span>{workers.length}</span></div>
              {workers.slice(0, 6).map((worker) => <p className={styles.compactItem} key={worker.id}><strong>{worker.display_name || clean(worker.worker_type)}</strong><span>{clean(worker.worker_type)} · {clean(worker.readiness_status)} · Score {worker.readiness_score || 0}</span></p>)}
            </div>
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHead}><h3>Draft Batches</h3><span>{batches.length}</span></div>
              {batches.slice(0, 6).map((batch) => <p className={styles.compactItem} key={batch.id}><strong>{clean(batch.batch_status)}</strong><span>{clean(batch.batch_type)} · Net {money(batch.net_total)} · Items {batch.item_count || 0}</span></p>)}
            </div>
          </section>

          {lastResult && <section className={styles.explanationPanel}><div className={styles.sectionHead}><h3>Last Payroll AI Action</h3><span>{lastResult.ok === false ? "Error" : "Done"}</span></div><pre className={styles.compactItem}>{JSON.stringify(lastResult, null, 2)}</pre></section>}
        </>
      )}
    </section>
  );
}
