"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./FundingAiControlPanel.module.css";

type OwnerPlan = {
  ok?: boolean;
  status?: string;
  pilot_hourly_rate_proposal?: number;
  profit_cash_target?: number;
  reserve_months?: number;
  tax_treatment?: string;
  payroll_enabled?: boolean;
  distributions_enabled?: boolean;
};

export default function OwnerCompensationDraftPanel() {
  const [plan, setPlan] = useState<OwnerPlan | null>(null);
  const [message, setMessage] = useState("Loading owner compensation draft…");

  useEffect(() => {
    let active = true;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setMessage("Dashboard connection unavailable.");
      return;
    }
    client.rpc("ppd_get_owner_compensation_setup").then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage("Owner compensation draft is unavailable for this login.");
      else if (!data?.ok) setMessage("No owner compensation draft is linked to this login.");
      else { setPlan(data as OwnerPlan); setMessage(""); }
    });
    return () => { active = false; };
  }, []);

  return (
    <section className={styles.window} aria-label="Owner compensation draft">
      <div className={styles.header}>
        <div>
          <span className="section-kicker">Owner Compensation</span>
          <h2>Pilot Work + Profit Distribution</h2>
          <p>Owner draw planning for pilot work and cash distributions. No W-2 pay or transfers are enabled.</p>
        </div>
      </div>
      {message ? <p className={styles.compactItem}>{message}</p> : plan && (
        <>
          <div className={styles.statusBar}>
            <span className={styles.warn}>{plan.status === "draft_owner_draw" ? "Draft · owner draw plan" : "Draft · tax review"}</span>
            <span>W-2 payroll for owner {plan.payroll_enabled ? "enabled" : "disabled"}</span>
            <span>Distributions {plan.distributions_enabled ? "enabled" : "disabled"}</span>
          </div>
          <div className={styles.metricsGrid}>
            <div><span>Pilot hour tracking rate</span><strong>${Number(plan.pilot_hourly_rate_proposal || 0).toFixed(2)}/hour</strong></div>
            <div><span>Quarterly cash target</span><strong>{Math.round(Number(plan.profit_cash_target || 0) * 100)}%</strong></div>
            <div><span>Operating reserve target</span><strong>{plan.reserve_months || 0} months</strong></div>
          </div>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHead}><h3>How the two streams are tracked</h3></div>
            <p className={styles.compactItem}><strong>Pilot work</strong><span>Track your job hours at the proposed rate for job costing and an owner draw target. This is not W-2 wages or a separate deductible salary.</span></p>
            <p className={styles.compactItem}><strong>Owner cash distribution</strong><span>Consider up to the target share of available cash after expenses, tax obligations, debt, and reserves. Record any actual transfer through the PPD → Desert Ridge → trust ownership chain.</span></p>
            <p className={styles.compactItem}>The Smith Family Trust is revocable. This plan assumes both LLCs remain single-member disregarded entities. Confirm their membership records and tax elections before making payments.</p>
          </section>
        </>
      )}
    </section>
  );
}
