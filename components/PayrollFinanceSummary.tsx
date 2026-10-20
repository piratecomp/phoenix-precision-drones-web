"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./PayrollDepartmentWorkspace.module.css";

export default function PayrollFinanceSummary() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) { setError("Payroll data unavailable."); return; }
    void client.rpc("ppd_get_payroll_dashboard_state").then(({ data, error }) => {
      if (error) setError(error.message); else setData(data);
    });
  }, []);
  return <section className={styles.workspace} aria-label="Finance payroll summary">
    <div className={styles.header}><div><span className="section-kicker">Finance AI · Payroll</span><h2>Payroll status</h2>
      <p>{data ? `${data.counts?.w2_workers || 0} W-2 workers · ${data.counts?.blockers || 0} setup items · ${data.counts?.unapproved_timecards || 0} unapproved timecards` : error || "Loading payroll status…"}</p></div>
      <Link href="/portal/finance/payroll">Open payroll dashboard →</Link></div>
    {data?.readiness_checks?.length > 0 && <p className={styles.notice}>Next: {data.readiness_checks[0].title} · {data.readiness_checks[0].next_step}</p>}
  </section>;
}
