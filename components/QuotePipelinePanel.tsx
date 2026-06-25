"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, FileText, Loader2, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { acceptPpdQuote, getPpdQuotePipelinePanel, type PpdQuotePipelinePanel } from "@/lib/portalApi";

function money(value: any) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function QuotePipelinePanel({ dashboardKey }: { dashboardKey: string }) {
  const [panel, setPanel] = useState<PpdQuotePipelinePanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);

  const shouldShow = useMemo(
    () => ["owner", "admin", "sales_marketing", "finance_payroll", "customer"].includes(dashboardKey),
    [dashboardKey]
  );

  async function loadPanel() {
    if (!shouldShow) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const data = await getPpdQuotePipelinePanel(supabase, dashboardKey);
      setPanel(data);
    } catch (err: any) {
      setMessage(err?.message || "Unable to load quote pipeline.");
    } finally {
      setLoading(false);
    }
  }

  async function acceptQuote(quote: any) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !quote?.id) return;
    setBusyQuoteId(quote.id);
    setMessage("Accepting quote and creating gated job...");
    try {
      const result = await acceptPpdQuote(supabase, quote.id, panel?.viewer_mode, quote.project_location || null);
      setMessage(result?.job_id ? `Job created from quote. Job ID: ${result.job_id}` : "Quote accepted.");
      await loadPanel();
    } catch (err: any) {
      setMessage(err?.message || "Unable to accept quote.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  useEffect(() => {
    loadPanel();
  }, [dashboardKey, shouldShow]);

  if (!shouldShow) return null;

  const stats = panel?.stats || {};
  const quotes = panel?.quotes || [];
  const intakes = panel?.intakes_without_quotes || [];

  return (
    <section className="quote-pipeline-panel panel-card">
      <div className="portal-game-panel-head quote-pipeline-head">
        <div>
          <span className="section-kicker">Quote Pipeline</span>
          <h3>{panel?.viewer_mode === "staff" ? "Sales review and conversion" : "Your quotes and approvals"}</h3>
        </div>
        <button className="quote-refresh-btn" type="button" onClick={loadPanel} disabled={loading}>
          {loading ? <Loader2 className="portal-spin" size={16} /> : <RefreshCw size={16} />} Refresh
        </button>
      </div>

      <div className="quote-pipeline-stats">
        <article><FileText size={20} /><span>Total Quotes</span><strong>{stats.quotes_total ?? quotes.length}</strong></article>
        <article><BadgeDollarSign size={20} /><span>Draft / Sent</span><strong>{Number(stats.quotes_draft || 0) + Number(stats.quotes_sent || 0)}</strong></article>
        <article><CheckCircle2 size={20} /><span>Accepted</span><strong>{stats.quotes_accepted ?? 0}</strong></article>
        <article><FileText size={20} /><span>Open Intakes</span><strong>{stats.open_intakes ?? stats.intakes_open ?? intakes.length}</strong></article>
      </div>

      {message && <p className="quote-pipeline-message">{message}</p>}

      <div className="quote-pipeline-list">
        {quotes.length === 0 && intakes.length === 0 && <p>No quotes or open quote intakes are visible for this dashboard yet.</p>}

        {quotes.map((quote: any) => (
          <article className="quote-pipeline-row" key={quote.id}>
            <div>
              <strong>{quote.quote_number || "Quote Draft"} · {money(quote.estimated_total)}</strong>
              <span>{quote.service_type || "Commercial Drone Services"} — {quote.project_location || "Location pending"}</span>
              <small>{quote.customer_name || quote.customer_email || "Customer"} · {quote.status || "draft"} · expires {quote.expiration_date || "pending"}</small>
              {(quote.line_items || []).slice(0, 2).map((item: any, index: number) => (
                <em key={`${quote.id}-${index}`}>{item.description || "Drone service"}: {money(item.total_price)}</em>
              ))}
            </div>
            <div className="quote-pipeline-actions">
              {quote.job_id && <span className="quote-job-created">Job Created</span>}
              {!quote.job_id && quote.can_accept && (
                <button type="button" onClick={() => acceptQuote(quote)} disabled={busyQuoteId === quote.id}>
                  {busyQuoteId === quote.id ? "Creating..." : panel?.viewer_mode === "staff" ? "Accept / Create Job" : "Accept Quote"}
                </button>
              )}
            </div>
          </article>
        ))}

        {intakes.map((intake: any) => (
          <article className="quote-pipeline-row intake" key={intake.id}>
            <div>
              <strong>Intake needs quote · {money(intake.estimated_price)}</strong>
              <span>{intake.service_type || "Commercial Drone Services"} — {intake.project_location || "Location pending"}</span>
              <small>{intake.requester_name || intake.requester_email || "Requester"} · {intake.intake_status} · {intake.risk_level}</small>
            </div>
            <div className="quote-pipeline-actions"><span>Owner Review</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}
