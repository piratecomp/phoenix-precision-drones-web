"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Info, Loader2, RefreshCw, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import styles from "./FundingAiControlPanel.module.css";

type FundingOpportunity = {
  id: string;
  title?: string | null;
  source_name?: string | null;
  source_type?: string | null;
  application_url?: string | null;
  source_url?: string | null;
  deadline_date?: string | null;
  deadline_text?: string | null;
  value?: number | string | null;
  score?: number | string | null;
  confidence_score?: number | string | null;
  opportunity_status?: string | null;
  status?: string | null;
  package_status?: string | null;
  owner_go_enabled?: boolean;
  go_status?: string | null;
};

type FundingPanel = {
  ok?: boolean;
  generated_at?: string;
  counts?: Record<string, number>;
  control?: Record<string, any>;
  cron_jobs?: Array<Record<string, any>>;
  opportunities?: FundingOpportunity[];
  applications?: Array<Record<string, any>>;
  documents?: Array<Record<string, any>>;
  execution_queue?: Array<Record<string, any>>;
};

type FundingExplanation = {
  ok?: boolean;
  generated_at?: string;
  opportunity?: Record<string, any>;
  rules?: Record<string, any>;
  fit?: Record<string, any>;
  gaps?: string[];
  documents?: Array<Record<string, any>>;
  next_step?: string;
};

function money(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "$0";
  return numeric.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * (numeric <= 1 ? 100 : 1))}%`;
}

function shortDate(value?: string | null) {
  if (!value) return "Monitor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function asText(value: unknown, fallback = "Not extracted yet") {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value.length ? value.join("; ") : fallback;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const text = String(value).trim();
  return text || fallback;
}

function renderList(value: unknown, fallback = "Not extracted yet") {
  if (Array.isArray(value) && value.length) {
    return (
      <ul className={styles.explanationList}>
        {value.map((item, index) => <li key={`${String(item)}-${index}`}>{asText(item)}</li>)}
      </ul>
    );
  }
  return <p>{fallback}</p>;
}

async function rpc<T>(name: string, args?: Record<string, any>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase browser client is not configured.");
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw error;
  return data as T;
}

async function invokeFundingWorker(name: string, body: Record<string, any>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase browser client is not configured.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

export default function FundingAiControlPanel() {
  const [configured] = useState(isSupabaseConfigured());
  const [panel, setPanel] = useState<FundingPanel | null>(null);
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [explanation, setExplanation] = useState<FundingExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const counts = panel?.counts || {};
  const opportunities = useMemo(() => panel?.opportunities || [], [panel]);
  const applications = panel?.applications || [];
  const documents = panel?.documents || [];
  const queue = panel?.execution_queue || [];
  const cronJobs = panel?.cron_jobs || [];

  async function loadPanel() {
    if (!configured) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await rpc<FundingPanel>("ppd_get_funding_control_panel");
      setPanel(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load Funding AI control panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPanel();
  }, []);

  async function runHuntCycle() {
    setBusy("hunt");
    setError(null);
    try {
      await invokeFundingWorker("funding-source-monitor", { source: "finance_payroll_dashboard", force: true, limit: 5 });
      await invokeFundingWorker("funding-search-worker", { source: "finance_payroll_dashboard", force: true, limit: 4 });
      await invokeFundingWorker("funding-opportunity-extractor", { source: "finance_payroll_dashboard", force: true, limit: 10 });
      await rpc("ppd_funding_dashboard_refresh");
      await loadPanel();
    } catch (err: any) {
      setError(err?.message || "Funding AI hunt failed.");
    } finally {
      setBusy(null);
    }
  }

  async function refreshFundingAi() {
    setBusy("refresh");
    setError(null);
    try {
      await rpc("ppd_funding_dashboard_refresh");
      await loadPanel();
    } catch (err: any) {
      setError(err?.message || "Funding AI refresh failed.");
    } finally {
      setBusy(null);
    }
  }

  async function explainOpportunity(opportunityId: string) {
    setExplanationLoading(true);
    setError(null);
    try {
      const data = await rpc<FundingExplanation>("ppd_get_funding_opportunity_explanation", { p_opportunity_id: opportunityId });
      setExplanation(data);
    } catch (err: any) {
      setError(err?.message || "Funding explanation failed.");
    } finally {
      setExplanationLoading(false);
    }
  }

  async function preparePackage(opportunityId: string) {
    setBusy(`prepare-${opportunityId}`);
    setError(null);
    try {
      await rpc("ppd_funding_prepare_package", { p_opportunity_id: opportunityId });
      await loadPanel();
      await explainOpportunity(opportunityId);
    } catch (err: any) {
      setError(err?.message || "Package preparation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function approveGo(opportunity: FundingOpportunity) {
    const title = opportunity.title || "this funding opportunity";
    const confirmed = window.confirm(`Approve Go for ${title}? This will queue the owner-approved submission workflow.`);
    if (!confirmed) return;
    setBusy(`go-${opportunity.id}`);
    setError(null);
    try {
      await rpc("ppd_funding_owner_go", { p_opportunity_id: opportunity.id });
      await loadPanel();
      await explainOpportunity(opportunity.id);
    } catch (err: any) {
      setError(err?.message || "Owner Go failed.");
    } finally {
      setBusy(null);
    }
  }

  if (!open) {
    return (
      <button className={styles.floatingOpenButton} type="button" onClick={() => setOpen(true)}>
        <Sparkles size={16} /> Funding AI
      </button>
    );
  }

  return (
    <aside className={styles.window} aria-label="Funding AI finance control window">
      <div className={styles.header}>
        <div>
          <span className="section-kicker">Finance Funding AI</span>
          <h2>Grant & Contract Control Window</h2>
          <p>Hunt opportunities, prepare application packages, explain rules and fit, and queue owner-approved Go workflows.</p>
        </div>
        <button className={styles.closeButton} type="button" onClick={() => setOpen(false)}>Minimize</button>
      </div>

      {loading ? (
        <div className={styles.loading}><Loader2 className={styles.spin} size={22} /> Loading funding intelligence…</div>
      ) : !configured ? (
        <p className={styles.error}>Supabase browser variables are not configured.</p>
      ) : (
        <>
          <div className={styles.statusBar}>
            <span className={panel?.control?.funding_ai_enabled ? styles.good : styles.warn}><ShieldCheck size={15} /> Funding AI {panel?.control?.funding_ai_enabled ? "ON" : "OFF"}</span>
            <span>{cronJobs.length ? `${cronJobs.length} funding cron active` : "No funding cron found"}</span>
            <span>{panel?.generated_at ? `Synced ${shortDate(panel.generated_at)}` : "Live RPC"}</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.metricsGrid}>
            <div><span>Opportunities</span><strong>{counts.opportunities || 0}</strong></div>
            <div><span>Packages Ready</span><strong>{counts.package_ready || 0}</strong></div>
            <div><span>Go Ready</span><strong>{counts.go_ready || 0}</strong></div>
            <div><span>Pending Queue</span><strong>{counts.pending_execution || 0}</strong></div>
            <div><span>Research Queries</span><strong>{counts.research_queries || 0}</strong></div>
            <div><span>AI Recs</span><strong>{counts.open_recommendations || 0}</strong></div>
          </div>

          <div className={styles.actions}>
            <button className="primary-btn" type="button" onClick={runHuntCycle} disabled={Boolean(busy)}>
              {busy === "hunt" ? <Loader2 className={styles.spin} size={16} /> : <Rocket size={16} />} Hunt Now
            </button>
            <button className="ghost-btn" type="button" onClick={refreshFundingAi} disabled={Boolean(busy)}>
              {busy === "refresh" ? <Loader2 className={styles.spin} size={16} /> : <RefreshCw size={16} />} Refresh Scores
            </button>
          </div>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHead}><h3>Top Funding Opportunities</h3><span>{opportunities.length}</span></div>
            <div className={styles.list}>
              {opportunities.slice(0, 8).map((opportunity) => {
                const link = opportunity.application_url || opportunity.source_url;
                const packageReady = opportunity.package_status === "package_ready";
                return (
                  <article className={styles.row} key={opportunity.id}>
                    <div className={styles.rowMain}>
                      <strong>{opportunity.title || "Untitled opportunity"}</strong>
                      <span>{opportunity.source_name || opportunity.source_type || "Unknown source"} · {shortDate(opportunity.deadline_date || opportunity.deadline_text)}</span>
                      <small>{money(opportunity.value)} · Score {opportunity.score || 0} · Confidence {pct(opportunity.confidence_score)}</small>
                    </div>
                    <div className={styles.rowActions}>
                      {link && <a className={styles.iconLink} href={link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Source</a>}
                      <button className="ghost-btn compact-portal-btn" type="button" onClick={() => explainOpportunity(opportunity.id)} disabled={Boolean(busy) || explanationLoading}>
                        {explanationLoading ? <Loader2 className={styles.spin} size={14} /> : <Info size={14} />} Explain Fit
                      </button>
                      <button className="ghost-btn compact-portal-btn" type="button" onClick={() => preparePackage(opportunity.id)} disabled={Boolean(busy)}>
                        {packageReady ? "Rebuild Package" : "Prepare"}
                      </button>
                      <button className="primary-btn compact-portal-btn" type="button" onClick={() => approveGo(opportunity)} disabled={!packageReady || Boolean(busy)}>
                        Go
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {explanation && (
            <section className={styles.explanationPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <span className="section-kicker">Grant Explanation</span>
                  <h3>{explanation.opportunity?.title || "Funding opportunity"}</h3>
                </div>
                <button className={styles.closeButton} type="button" onClick={() => setExplanation(null)}>Close</button>
              </div>

              <div className={styles.explanationGrid}>
                <div className={styles.explanationCard}>
                  <h4>Rules & Requirements</h4>
                  <p><b>Source:</b> {asText(explanation.rules?.source)}</p>
                  <p><b>Type:</b> {asText(explanation.rules?.opportunity_type)}</p>
                  <p><b>Deadline:</b> {asText(explanation.rules?.deadline, "Monitor")}</p>
                  <p><b>Estimated Value:</b> {money(explanation.rules?.estimated_value)}</p>
                  <p><b>Eligibility:</b> {asText(explanation.rules?.eligibility_summary)}</p>
                  <p><b>Application Summary:</b> {asText(explanation.rules?.application_summary)}</p>
                </div>

                <div className={styles.explanationCard}>
                  <h4>Why PPD Fits</h4>
                  <p><b>Company:</b> {asText(explanation.fit?.company)}</p>
                  <p><b>Stage:</b> {asText(explanation.fit?.business_stage)}</p>
                  <p><b>Location:</b> {asText(explanation.fit?.location)}</p>
                  <p><b>Industry Fit:</b> {asText(explanation.fit?.industry_fit)}</p>
                  <p><b>Founder Fit:</b> {asText(explanation.fit?.founder_fit)}</p>
                  <p><b>Use of Funds:</b> {asText(explanation.fit?.use_of_funds_fit)}</p>
                </div>

                <div className={styles.explanationCard}>
                  <h4>Required Documents</h4>
                  {renderList(explanation.rules?.required_documents)}
                  <h4>Application Questions</h4>
                  {renderList(explanation.rules?.application_questions)}
                </div>

                <div className={styles.explanationCard}>
                  <h4>Missing / Risk Items</h4>
                  {renderList(explanation.gaps, "No missing items flagged yet.")}
                  <h4>Next Step</h4>
                  <p>{explanation.next_step || "Review the package and confirm the source rules before clicking Go."}</p>
                </div>
              </div>
            </section>
          )}

          <section className={styles.twoColumn}>
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHead}><h3>Applications</h3><span>{applications.length}</span></div>
              {applications.slice(0, 5).map((app: any) => (
                <p className={styles.compactItem} key={app.id}><strong>{app.application_status}</strong><span>{app.opportunity_title || app.opportunity_id}</span></p>
              ))}
            </div>
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHead}><h3>Documents</h3><span>{documents.length}</span></div>
              {documents.slice(0, 5).map((doc: any) => (
                <p className={styles.compactItem} key={doc.id}><strong>{doc.document_type}</strong><span>{doc.title}</span></p>
              ))}
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHead}><h3>Go / Execution Queue</h3><span>{queue.length}</span></div>
            {queue.slice(0, 6).map((item: any) => (
              <p className={styles.queueItem} key={item.id}><strong>{item.action}</strong><span>{item.status}</span><em>{item.opportunity_title || "General funding task"}</em></p>
            ))}
          </section>
        </>
      )}
    </aside>
  );
}
