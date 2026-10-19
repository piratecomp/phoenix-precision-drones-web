import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import Link from "next/link";
import FundingAiControlPanel from "@/components/FundingAiControlPanel";
import PayrollFinanceSummary from "@/components/PayrollFinanceSummary";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";
import styles from "./page.module.css";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="finance_payroll">
      <DashboardCommandWorkspace dashboardKey="finance_payroll" />

      <section className={styles.aiPanelsSection} aria-label="Finance AI control panels">
        <div className={styles.aiPanelsHeader}>
          <span className="section-kicker">Finance AI Command Center</span>
          <h2>Funding and payroll</h2>
          <p>
            Finance AI tracks funding and payroll readiness. Open the payroll department to review timecards, changes, pay runs, tax calculations, and authorizations.
          </p>
          <Link className={styles.payrollLink} href="/portal/finance/payroll">Open payroll dashboard →</Link>
        </div>

        <div className={styles.aiPanelsGrid}>
          <PayrollFinanceSummary />
          <FundingAiControlPanel />
        </div>
      </section>
    </PortalDashboardChrome>
  );
}
