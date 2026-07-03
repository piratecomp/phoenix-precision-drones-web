"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getPpdRoleOperationsPanel, type PpdRoleOperationsPanel } from "@/lib/portalApi";
import styles from "./DashboardCommandWorkspace.module.css";

type Item = Record<string, any>;

const titles: Record<string, string> = {
  owner: "Owner Command Workspace",
  admin: "Admin Operations Workspace",
  finance_payroll: "Finance Control Workspace",
  maintenance: "Maintenance Control Workspace",
  safety: "Safety Control Workspace",
  sales_marketing: "Sales Command Workspace",
  pilot_w2: "W-2 Pilot Mission Workspace",
  pilot_1099: "1099 Pilot Network Workspace",
  pilot_observer: "Observer Field Workspace",
  customer: "Customer Project Workspace",
};

const subtitles: Record<string, string> = {
  owner: "Company decisions, AI queues, department health, and owner review.",
  admin: "Users, records, onboarding, permissions, and job control.",
  finance_payroll: "Invoices, payroll blockers, pilot payouts, funding items, and finance approvals.",
  maintenance: "Fleet readiness, grounded equipment, repair queues, and bridge actions.",
  safety: "Mission risk, no-fly controls, compliance holds, and incident review.",
  sales_marketing: "Leads, quotes, voice follow-ups, campaigns, and conversion actions.",
  pilot_w2: "Assigned missions, timecards, checklists, equipment, uploads, and safety notes.",
  pilot_1099: "Available offers, verification, mission details, payout holds, and uploads.",
  pilot_observer: "Support assignments, observer checklist, training, and field reports.",
  customer: "Active jobs, quotes, deliverables, messages, invoices, and service requests.",
};

function clean(value: unknown, fallback = "pending") {
  const text = String(value ?? "").trim();
  return (text || fallback).replace(/_/g, " ");
}

function titleOf(item?: Item | null) {
  if (!item) return "Select a work item";
  return item.title || item.task_title || item.action_title || item.notification_title || item.status || "Workspace item";
}

function statusOf(item?: Item | null) {
  if (!item) return "idle";
  return item.status || item.task_status || item.finance_status || item.review_status || item.delivery_status || item.verification_status || item.approval_status || item.source || "review";
}

function summaryOf(item?: Item | null) {
  if (!item) return "Choose a queue item to inspect details and next steps.";
  return item.summary || item.task_summary || item.action_summary || item.next_step || item.required_action || item.release_notes || item.description || "No summary available yet.";
}

function routeFor(key: string) {
  if (key === "finance_payroll") return "/portal/finance";
  if (key === "sales_marketing") return "/portal/sales";
  if (key === "pilot_1099") return "/portal/pilot-network";
  if (key === "pilot_w2") return "/portal/pilot-w2";
  if (key === "pilot_observer") return "/portal/observer";
  return `/portal/${key}`;
}

function isTask(item?: Item | null) {
  return Boolean(item?.id && (item?.type === "department_task" || item?.task_title || item?.task_status || item?.source === "portal_department_tasks"));
}

function mergeItems(a: Item[], b: Item[]) {
  const seen = new Set<string>();
  return [...a, ...b].filter((item, index) => {
    const key = `${item.source || item.type || "item"}:${item.id || titleOf(item) || index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function DashboardCommandWorkspace({ dashboardKey }: { dashboardKey: string }) {
  const [configured] = useState(isSupabaseConfigured());
  const [panel, setPanel] = useState<PpdRoleOperationsPanel | null>(null);
  const [queue, setQueue] = useState<Item[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(configured);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [busy, setBusy] = useState(false);

  const cards = panel?.cards || [];
  const items = mergeItems(queue, panel?.items || []);
  const selected = items[selectedIndex] || null;

  async function loadWorkspace() {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rolePanel, queueResult] = await Promise.all([
        getPpdRoleOperationsPanel(supabase, dashboardKey),
        supabase.rpc("ppd_get_dashboard_workspace_queue", { p_dashboard_key: dashboardKey }),
      ]);
      if (queueResult.error) throw queueResult.error;
      setPanel(rolePanel);
      setQueue(queueResult.data?.items || []);
      setQueueCounts(queueResult.data?.counts || {});
      setSelectedIndex(0);
      setNotice(null);
    } catch (err: any) {
      setNotice(err?.message || "Workspace data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function queueReview() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("ppd_request_dashboard_action", {
        p_dashboard_key: dashboardKey,
        p_action_key: "review_selected_item",
        p_selected_item: selected || {},
        p_note: `Review requested from ${titles[dashboardKey] || "dashboard"}: ${titleOf(selected)}`,
      });
      if (error) throw error;
      setNotice(`Action queued. Task: ${data?.task_id || "created"}.`);
      await loadWorkspace();
    } catch (err: any) {
      setNotice(err?.message || "Unable to queue action.");
    } finally {
      setBusy(false);
    }
  }

  async function setTaskStatus(status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !selected?.id) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("ppd_update_dashboard_task_status", {
        p_task_id: selected.id,
        p_task_status: status,
        p_resolution: `${titles[dashboardKey] || "Dashboard"} moved task to ${status}.`,
      });
      if (error) throw error;
      setNotice(`Task updated: ${clean(data?.new_status || status)}.`);
      await loadWorkspace();
    } catch (err: any) {
      setNotice(err?.message || "Unable to update task.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadWorkspace(); }, [dashboardKey]);

  return (
    <section className={styles.workspace} aria-label={`${dashboardKey} command workspace`}>
      <div className={styles.header}>
        <div><span className="section-kicker">Dashboard Command Workspace</span><h2>{titles[dashboardKey] || "Dashboard Workspace"}</h2><p>{subtitles[dashboardKey] || "Live queue, status filters, item inspector, and dashboard actions."}</p></div>
        <button className={styles.statusPill} type="button" onClick={loadWorkspace} disabled={loading}>{loading ? <Loader2 className="portal-spin" size={16} /> : <RefreshCw size={16} />} Refresh</button>
      </div>
      {notice && <p className={styles.notice}>{notice}</p>}
      <div className={styles.board}>
        <aside className={styles.panel}>
          <div className={styles.panelHead}><h3>Status filters</h3><span>{cards.length + 1}</span></div>
          <div className={styles.cardGrid}>
            <button className={`${styles.statCard} ${activeCard === -1 ? styles.active : ""}`} type="button" onClick={() => setActiveCard(-1)}><span>Workspace Queue</span><strong>{queueCounts.total_items ?? items.length}</strong><em className={styles.meta}>{queueCounts.department_tasks || 0} tasks · {queueCounts.operational_events || 0} events</em></button>
            {cards.map((card, index) => <button className={`${styles.statCard} ${index === activeCard ? styles.active : ""}`} key={`${card.title}-${index}`} type="button" onClick={() => setActiveCard(index)}><span>{card.title || "Status"}</span><strong>{card.value ?? 0}</strong><em className={styles.meta}>{card.label || "Live count"}</em></button>)}
          </div>
        </aside>
        <main className={styles.panel}>
          <div className={styles.panelHead}><h3>Live work queue</h3><span>{items.length}</span></div>
          <div className={styles.queueList}>
            {loading && <p className={styles.notice}>Loading live queue…</p>}
            {!loading && items.length === 0 && <p className={styles.notice}>No live queue items yet. This dashboard needs its department records wired next.</p>}
            {items.map((item, index) => <button className={`${styles.queueItem} ${index === selectedIndex ? styles.active : ""}`} key={`${item.source || item.type || "item"}-${item.id || index}`} type="button" onClick={() => setSelectedIndex(index)}><strong>{titleOf(item)}</strong><span>{summaryOf(item)}</span><em>{clean(statusOf(item))}</em></button>)}
          </div>
        </main>
        <aside className={`${styles.panel} ${styles.inspector}`}>
          <div className={styles.panelHead}><h3>Inspector</h3><span><Eye size={16} /></span></div>
          <div className={styles.inspectorCard}><h3>{titleOf(selected)}</h3><p>{summaryOf(selected)}</p><div className={styles.metaGrid}><div><span>Status</span><strong>{clean(statusOf(selected))}</strong></div><div><span>Type</span><strong>{clean(selected?.type || selected?.source || selected?.finance_type || selected?.task_type)}</strong></div><div><span>Value</span><strong>{selected?.amount !== undefined ? `$${Number(selected.amount || 0).toLocaleString()}` : clean(selected?.value || selected?.readiness_score || selected?.risk_score)}</strong></div><div><span>Next</span><strong>{clean(selected?.next_step || selected?.required_action || selected?.action_label || selected?.created_at)}</strong></div></div></div>
          <div className={styles.actions}>
            <Link className={styles.actionButton} href={routeFor(dashboardKey)}><strong>Open dashboard route</strong><span>Use the protected route while this workspace is being expanded.</span></Link>
            <button className={styles.actionButton} type="button" onClick={queueReview} disabled={busy}><strong>{busy ? "Working…" : "Queue department review"}</strong><span>Create a protected department task. Safe mode: review queue only.</span></button>
            {isTask(selected) && <><button className={styles.actionButton} type="button" onClick={() => setTaskStatus("in_progress")} disabled={busy}><strong>Start task</strong><span>Move the selected task into active review.</span></button><button className={styles.actionButton} type="button" onClick={() => setTaskStatus("blocked")} disabled={busy}><strong>Block / hold task</strong><span>Keep this task visible as blocked.</span></button><button className={styles.actionButton} type="button" onClick={() => setTaskStatus("completed")} disabled={busy}><strong>Complete task</strong><span>Close the task with a dashboard resolution.</span></button></>}
          </div>
        </aside>
      </div>
    </section>
  );
}
