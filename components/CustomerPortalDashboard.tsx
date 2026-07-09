"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  acceptPpdQuote,
  checkDashboardAccess,
  getCustomerDashboardSnapshot,
  submitCustomerQuoteIntake,
  type CustomerDashboardSnapshot,
} from "@/lib/portalApi";
import styles from "./CustomerPortalDashboard.module.css";

type FormState = {
  service_type: string;
  project_location: string;
  requested_date: string;
  budget_range: string;
  project_summary: string;
};

const emptyForm: FormState = {
  service_type: "construction_progress",
  project_location: "",
  requested_date: "",
  budget_range: "",
  project_summary: "",
};

const serviceOptions = [
  ["construction_progress", "Construction progress photos / mapping"],
  ["roof_inspection", "Roof / insurance inspection"],
  ["real_estate_media", "Real estate photos / video"],
  ["thermal_inspection", "Thermal inspection"],
  ["lidar_mapping", "LiDAR mapping / survey"],
  ["commercial_drone_services", "Other commercial drone service"],
];

function num(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown) {
  return num(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clean(value: unknown, fallback = "pending") {
  const text = String(value ?? "").trim();
  return (text || fallback).replace(/_/g, " ");
}

function shortDate(value?: string | null) {
  if (!value) return "pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <section className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        <Loader2 className={styles.spin} size={34} />
        <h1>{text}</h1>
        <p className={styles.muted}>Loading your Phoenix Precision Drones customer dashboard.</p>
      </div>
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}

export default function CustomerPortalDashboard() {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [checking, setChecking] = useState(configured);
  const [snapshot, setSnapshot] = useState<CustomerDashboardSnapshot | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);

  const mode = snapshot?.mode || "customer";
  const staffPreview = mode.startsWith("staff");
  const customer = snapshot?.customer;
  const counts = snapshot?.counts || {};
  const intakes = snapshot?.intakes || [];
  const quotes = snapshot?.quotes || [];
  const jobs = snapshot?.jobs || [];
  const deliveries = snapshot?.deliveries || [];
  const invoices = snapshot?.invoices || [];
  const timeline = snapshot?.timeline || [];
  const customers = snapshot?.customers || [];

  async function loadDashboard(customerId?: string) {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setLoading(false);
      setChecking(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        window.location.href = "/login";
        return;
      }
      const access = await checkDashboardAccess(supabase, "/portal/customer");
      if (!access.can_access) throw new Error(access.reason || "Customer dashboard access denied.");
      const data = await getCustomerDashboardSnapshot(supabase, customerId || null);
      setSnapshot(data);
      if (data.selected_customer_id) setSelectedCustomerId(data.selected_customer_id);
      setMessage(null);
    } catch (err: any) {
      setError(err?.message || "Unable to load customer dashboard.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  useEffect(() => {
    void loadDashboard(selectedCustomerId || undefined);
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (staffPreview) {
      setMessage("Preview mode is read-only. Log in as a customer to submit a live job request.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (!form.project_location.trim() || !form.project_summary.trim()) {
      setError("Project address and notes are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await submitCustomerQuoteIntake(supabase, form);
      setMessage(result?.intake_id ? "Request submitted. PPD AI has queued it for quote review." : "Request submitted.");
      setForm(emptyForm);
      await loadDashboard(selectedCustomerId || undefined);
    } catch (err: any) {
      setError(err?.message || "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptQuote(quote: any) {
    if (staffPreview) {
      setMessage("Preview mode is read-only. Customer quote acceptance is disabled for owner preview.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !quote?.id) return;
    setBusyQuoteId(quote.id);
    setError(null);
    setMessage(null);
    try {
      await acceptPpdQuote(supabase, quote.id, "customer", null);
      setMessage("Quote accepted. A job record will appear once the backend conversion completes.");
      await loadDashboard(selectedCustomerId || undefined);
    } catch (err: any) {
      setError(err?.message || "Unable to accept quote.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  const steps = useMemo(() => {
    if (timeline.length > 0) return timeline;
    return [
      { type: "ready", title: "Ready for request", status: "start", detail: "Submit a job request and PPD AI will prepare it for quote review." },
      { type: "quote", title: "Quote review", status: "pending", detail: "Quotes appear here when ready for approval." },
      { type: "delivery", title: "Deliverables", status: "pending", detail: "Downloads appear after owner review and release." },
    ];
  }, [timeline.length]);

  if (checking) return <LoadingScreen text="Customer Portal" />;

  return (
    <section className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/portal/customer">
          <img src="/images/logo-emblem-clean.png" alt="Phoenix Precision Drones" />
          <div><strong>PHOENIX</strong><span>Precision Drones</span></div>
        </Link>
        <div className={styles.identity}>
          <span className={styles.kicker}>Customer Dashboard</span>
          <h1>{customer?.name || "Customer Portal"}</h1>
          <p>{staffPreview ? "Owner preview is customer-safe and read-only." : "Order jobs, track status, approve quotes, download deliverables, and manage invoices."}</p>
        </div>
        <div className={styles.topActions}>
          {staffPreview && (
            <select
              className={styles.select}
              value={selectedCustomerId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedCustomerId(value);
                void loadDashboard(value || undefined);
              }}
            >
              <option value="">Select customer preview</option>
              {customers.map((item: any) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}
            </select>
          )}
          <button className={styles.iconBtn} type="button" onClick={() => loadDashboard(selectedCustomerId || undefined)} disabled={loading}>
            {loading ? <Loader2 className={styles.spin} size={16} /> : <RefreshCw size={16} />} Refresh
          </button>
          <button className={styles.iconBtn} type="button"><MessageCircle size={16} /> Support</button>
        </div>
      </header>

      <main className={styles.mainGrid}>
        <aside className={styles.column}>
          <form className={styles.formCard} onSubmit={submitRequest}>
            <div className={styles.panelHead}>
              <div><span className={styles.kicker}><PlusCircle size={14} /> Order</span><h2>Request a Job</h2></div>
            </div>
            <div className={styles.formGrid}>
              <select className={styles.select} value={form.service_type} onChange={(event) => setForm({ ...form, service_type: event.target.value })}>
                {serviceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input className={styles.input} placeholder="Project address / location" value={form.project_location} onChange={(event) => setForm({ ...form, project_location: event.target.value })} />
              <input className={styles.input} type="date" value={form.requested_date} onChange={(event) => setForm({ ...form, requested_date: event.target.value })} />
              <input className={styles.input} placeholder="Budget range, optional" value={form.budget_range} onChange={(event) => setForm({ ...form, budget_range: event.target.value })} />
              <textarea className={styles.textarea} placeholder="What do you need captured, mapped, inspected, or delivered?" value={form.project_summary} onChange={(event) => setForm({ ...form, project_summary: event.target.value })} />
              <div className={styles.formActions}>
                <button className={styles.primaryBtn} type="submit" disabled={submitting || staffPreview}>
                  {submitting ? <Loader2 className={styles.spin} size={16} /> : <Send size={16} />}
                  Submit Job Request
                </button>
                {staffPreview && <p className={styles.notice}>Read-only preview: customer submissions are disabled while viewing as owner/admin.</p>}
              </div>
            </div>
          </form>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}>Quotes</span><h3>Approvals</h3></div></div>
            <div className={styles.scrollList}>
              {quotes.length === 0 ? <EmptyCard text="No quotes yet. Submit a request and approved quotes will appear here." /> : quotes.map((quote: any) => (
                <article className={styles.rowCard} key={quote.id}>
                  <strong>{quote.quote_number || "Quote"} · {money(quote.estimated_total)}</strong>
                  <span>Status: {clean(quote.status)} · Expires {shortDate(quote.expiration_date)}</span>
                  <div className={styles.rowActions}>
                    <button className={styles.primaryBtn} type="button" onClick={() => acceptQuote(quote)} disabled={staffPreview || busyQuoteId === quote.id || quote.job_id}>
                      {busyQuoteId === quote.id ? "Accepting..." : quote.job_id ? "Accepted" : "Accept Quote"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.centerColumn}>
          <div className={styles.statGrid}>
            <article className={styles.statCard}><span>Requests</span><strong>{num(counts.open_requests)}</strong></article>
            <article className={styles.statCard}><span>Quotes</span><strong>{num(counts.quotes)}</strong></article>
            <article className={styles.statCard}><span>Active Jobs</span><strong>{num(counts.active_jobs)}</strong></article>
            <article className={styles.statCard}><span>Ready Downloads</span><strong>{num(counts.ready_downloads)}</strong></article>
            <article className={styles.statCard}><span>Balance Due</span><strong>{money(counts.balance_due)}</strong></article>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}><ShieldCheck size={14} /> Status</span><h2>Project Timeline</h2></div></div>
            <div className={styles.timeline}>
              {steps.map((step: any, index: number) => (
                <article className={styles.timelineStep} key={`${step.type}-${step.title}-${index}`}>
                  <div className={styles.stepDot}>{index + 1}</div>
                  <div><strong>{clean(step.title, "Project update")}</strong><span>{clean(step.detail, "No detail yet")}</span></div>
                  <em className={styles.statusPill}>{clean(step.status)}</em>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}><FileText size={14} /> Requests</span><h3>Recent Job Requests</h3></div></div>
            <div className={styles.scrollList}>
              {intakes.length === 0 ? <EmptyCard text="No job requests yet." /> : intakes.map((item: any) => (
                <article className={styles.rowCard} key={item.id}>
                  <strong>{clean(item.service_type, "Drone service")} · {money(item.estimated_price)}</strong>
                  <span>{item.project_location || "Location pending"}</span>
                  <small>{clean(item.intake_status, "received")} · requested {shortDate(item.requested_date)}</small>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className={styles.column}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}><PackageCheck size={14} /> Downloads</span><h2>Deliverables</h2></div></div>
            <div className={styles.scrollList}>
              {deliveries.length === 0 ? <EmptyCard text="No deliverables released yet. Finished files will appear here after review." /> : deliveries.map((item: any) => (
                <article className={styles.rowCard} key={item.id}>
                  <strong>{item.package_title || "Delivery package"}</strong>
                  <span>{clean(item.package_type, "deliverable")} · {clean(item.delivery_status)}</span>
                  {item.release_notes && <small>{item.release_notes}</small>}
                  <div className={styles.rowActions}>
                    {item.public_url ? <a className={styles.primaryBtn} href={item.public_url} target="_blank" rel="noreferrer"><Download size={16} /> Download</a> : <button className={styles.secondaryBtn} disabled type="button"><Download size={16} /> Not released</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}><CreditCard size={14} /> Billing</span><h2>Invoices</h2></div></div>
            <div className={styles.scrollList}>
              {invoices.length === 0 ? <EmptyCard text="No invoices yet." /> : invoices.map((item: any) => (
                <article className={styles.rowCard} key={item.id}>
                  <strong>{money(item.balance_due)} due</strong>
                  <span>Total {money(item.total_amount)} · Paid {money(item.amount_paid)}</span>
                  <small>{clean(item.pipeline_status)} · {clean(item.next_step, "No next step")}</small>
                  <button className={styles.secondaryBtn} type="button" disabled>Payment link pending</button>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>

      {(message || error) && <p className={error ? styles.error : styles.notice}>{error || message}</p>}
    </section>
  );
}
