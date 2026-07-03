import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import FundingAiControlPanel from "@/components/FundingAiControlPanel";
import PayrollAiControlPanel from "@/components/PayrollAiControlPanel";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";
import styles from "./page.module.css";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="finance_payroll">
      <DashboardCommandWorkspace dashboardKey="finance_payroll" />

      <section className={styles.aiPanelsSection} aria-label="Finance AI control panels">
        <div className={styles.aiPanelsHeader}>
          <span className="section-kicker">Finance AI Command Center</span>
          <h2>Funding + Payroll Intelligence</h2>
          <p>
            Embedded finance-dashboard controls for grant/contract funding and payroll readiness. These panels are dashboard-only and do not change the public website.
          </p>
        </div>

        <div className={styles.aiPanelsGrid}>
          <PayrollAiControlPanel />
          <FundingAiControlPanel />
        </div>
      </section>
    </PortalDashboardChrome>
  );
}
