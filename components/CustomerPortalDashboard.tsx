"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  FolderDown,
  LayoutDashboard,
  Loader2,
  MapPinned,
  MessageSquareText,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
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
        <p>Loading customer workspace.</p>
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

  const activeJob = jobs[0];
  const latestIntake = intakes[0];
  const latestQuote = quotes[0];
  const latestDelivery = deliveries[0];
  const latestInvoice = invoices[0];

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
    const base = [
      { label: "Request", done: intakes.length > 0, value: intakes.length || 0 },
      { label: "Quote", done: quotes.length > 0, value: quotes.length || 0 },
      { label: "Scheduled", done: jobs.length > 0, value: jobs.length || 0 },
      { label: "Delivered", done: num(counts.ready_downloads) > 0, value: num(counts.ready_downloads) },
    ];
    return base;
  }, [intakes.length, quotes.length, jobs.length, counts.ready_downloads]);

  if (checking) return <LoadingScreen text="Customer Portal" />;

  return (
    <section className={styles.shell}>
      <aside className={styles.rail}>
        <Link className={styles.brand} href="/portal/customer">
          <img src="/images/logo-emblem-clean.png" alt="Phoenix Precision Drones" />
          <div><strong>PHOENIX</strong><span>Precision Drones</span></div>
        </Link>

        <nav className={styles.navStack} aria-label="Customer dashboard sections">
          <a className={styles.activeNav} href="#overview"><LayoutDashboard size={18} /> Overview</a>
          <a href="#requests"><FileText size={18} /> Requests</a>
          <a href="#deliverables"><FolderDown size={18} /> Deliverables</a>
          <a href="#billing"><CreditCard size={18} /> Billing</a>
        </nav>

        <div className={styles.railStatus}>
          <span>Portal Status</span>
          <strong>{staffPreview ? "Owner Preview" : "Customer Live"}</strong>
          <small>{customer?.email || snapshot?.viewer?.email || "Signed in"}</small>
        </div>
      </aside>

      <main className={styles.board} id="overview">
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>Customer Portal</span>
            <h1>{customer?.name || "Customer Workspace"}</h1>
            <p>{staffPreview ? "Previewing the protected customer dashboard with customer-safe data only." : "Project requests, status, files, reports, messages, invoices, and delivery history."}</p>
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
            <button className={styles.iconBtn} type="button"><MessageSquareText size={16} /> Message PPD</button>
          </div>
        </header>

        <section className={styles.previewGrid}>
          <section className={`${styles.panel} ${styles.heroPanel}`}>
            <div className={styles.panelHead}>
              <div><span className={styles.kicker}><ShieldCheck size={14} /> Project Visibility</span><h2>{activeJob?.job_address || latestIntake?.project_location || "No active project yet"}</h2></div>
              <em className={styles.statusPill}>{clean(activeJob?.status || latestIntake?.intake_status || "ready for request")}</em>
            </div>
            <div className={styles.missionVisual}>
              <div className={styles.scanGrid} />
              <div className={styles.scanPulse} />
              <MapPinned className={styles.mapPin} size={32} />
              <div className={styles.visualText}>
                <strong>{clean(activeJob?.weather_status || activeJob?.safety_status || latestIntake?.service_type || "Aerial data workspace")}</strong>
                <span>{activeJob?.scheduled_start ? `Scheduled ${shortDate(activeJob.scheduled_start)}` : "Submit location, service needs, timing, and deliverable goals."}</span>
              </div>
            </div>
            <div className={styles.phaseStrip}>
              {steps.map((step) => (
                <article className={step.done ? styles.donePhase : ""} key={step.label}>
                  <CheckCircle2 size={17} />
                  <span>{step.label}</span>
                  <strong>{step.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <form className={`${styles.panel} ${styles.requestPanel}`} id="requests" onSubmit={submitRequest}>
            <div className={styles.panelHead}>
              <div><span className={styles.kicker}><PlusCircle size={14} /> Request</span><h3>Start New Job</h3></div>
            </div>
            <div className={styles.formGrid}>
              <select className={styles.select} value={form.service_type} onChange={(event) => setForm({ ...form, service_type: event.target.value })}>
                {serviceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input className={styles.input} placeholder="Project address / location" value={form.project_location} onChange={(event) => setForm({ ...form, project_location: event.target.value })} />
              <div className={styles.twoFieldGrid}>
                <input className={styles.input} type="date" value={form.requested_date} onChange={(event) => setForm({ ...form, requested_date: event.target.value })} />
                <input className={styles.input} placeholder="Budget, optional" value={form.budget_range} onChange={(event) => setForm({ ...form, budget_range: event.target.value })} />
              </div>
              <textarea className={styles.textarea} placeholder="Scope, notes, access details, deliverable goals" value={form.project_summary} onChange={(event) => setForm({ ...form, project_summary: event.target.value })} />
              <button className={styles.primaryBtn} type="submit" disabled={submitting || staffPreview}>
                {submitting ? <Loader2 className={styles.spin} size={16} /> : <Send size={16} />}
                Submit Request
              </button>
            </div>
          </form>

          <section className={`${styles.panel} ${styles.metricPanel}`}>
            <article><span>Open Requests</span><strong>{num(counts.open_requests)}</strong></article>
            <article><span>Quotes</span><strong>{num(counts.quotes)}</strong></article>
            <article><span>Active Jobs</span><strong>{num(counts.active_jobs)}</strong></article>
            <article><span>Downloads</span><strong>{num(counts.ready_downloads)}</strong></article>
            <article><span>Balance Due</span><strong>{money(counts.balance_due)}</strong></article>
          </section>

          <section className={`${styles.panel} ${styles.quotesPanel}`}>
            <div className={styles.panelHead}><div><span className={styles.kicker}>Quote Details</span><h3>Approvals</h3></div></div>
            <div className={styles.stackList}>
              {quotes.length === 0 ? <EmptyCard text="No quotes yet. Approved quotes will appear here." /> : quotes.map((quote: any) => (
                <article className={styles.rowCard} key={quote.id}>
                  <div><strong>{quote.quote_number || "Quote"} · {money(quote.estimated_total)}</strong><span>{clean(quote.status)} · expires {shortDate(quote.expiration_date)}</span></div>
                  <button className={styles.primaryBtn} type="button" onClick={() => acceptQuote(quote)} disabled={staffPreview || busyQuoteId === quote.id || quote.job_id}>{quote.job_id ? "Accepted" : "Accept"}</button>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.timelinePanel}`}>
            <div className={styles.panelHead}><div><span className={styles.kicker}>Updates</span><h3>Project History</h3></div></div>
            <div className={styles.stackList}>
              {timeline.length === 0 ? <EmptyCard text="Project activity history will appear here." /> : timeline.slice(0, 5).map((item: any, index: number) => (
                <article className={styles.updateRow} key={`${item.type}-${index}`}>
                  <span>{index + 1}</span>
                  <div><strong>{clean(item.title, "Project update")}</strong><small>{clean(item.status)} · {shortDate(item.event_at)}</small></div>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.deliveryPanel}`} id="deliverables">
            <div className={styles.panelHead}><div><span className={styles.kicker}><PackageCheck size={14} /> Deliverables</span><h3>Reports & Files</h3></div></div>
            <div className={styles.stackList}>
              {deliveries.length === 0 ? <EmptyCard text="Reports, maps, photos, inspection records, and file links will appear here after release." /> : deliveries.map((item: any) => (
                <article className={styles.rowCard} key={item.id}>
                  <div><strong>{item.package_title || "Delivery package"}</strong><span>{clean(item.package_type, "deliverable")} · {clean(item.delivery_status)}</span></div>
                  {item.public_url ? <a className={styles.secondaryBtn} href={item.public_url} target="_blank" rel="noreferrer"><Download size={15} /> Download</a> : <button className={styles.secondaryBtn} disabled type="button"><UploadCloud size={15} /> Pending</button>}
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.billingPanel}`} id="billing">
            <div className={styles.panelHead}><div><span className={styles.kicker}><CreditCard size={14} /> Billing</span><h3>Invoices</h3></div></div>
            <div className={styles.stackList}>
              {invoices.length === 0 ? <EmptyCard text="No invoices yet." /> : invoices.map((item: any) => (
                <article className={styles.rowCard} key={item.id}>
                  <div><strong>{money(item.balance_due)} due</strong><span>Total {money(item.total_amount)} · {clean(item.pipeline_status)}</span></div>
                  <button className={styles.secondaryBtn} type="button" disabled>Payment Link Pending</button>
                </article>
              ))}
            </div>
          </section>
        </section>

        {(latestQuote || latestDelivery || latestInvoice) && <div className={styles.hiddenSummary} aria-hidden="true" />}
        {(message || error) && <p className={error ? styles.error : styles.notice}>{error || message}</p>}
      </main>
    </section>
  );
}
