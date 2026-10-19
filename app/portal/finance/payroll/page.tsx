import Link from "next/link";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";
import PayrollDepartmentWorkspace from "@/components/PayrollDepartmentWorkspace";
import PayrollAiControlPanel from "@/components/PayrollAiControlPanel";
import styles from "../page.module.css";

export default function PayrollDepartmentPage() {
  return <PortalDashboardChrome dashboardKey="finance_payroll">
    <section className={styles.aiPanelsSection}>
      <div className={styles.aiPanelsHeader}>
        <span className="section-kicker">Finance AI / Payroll</span>
        <h2>In-house payroll department</h2>
        <p><Link href="/portal/finance">← Finance dashboard</Link> · PPD AI prepares and reviews payroll. Bank transfers, check clearing, and tax remittance require separate verified connections.</p>
      </div>
      <PayrollDepartmentWorkspace />
      <PayrollAiControlPanel />
    </section>
  </PortalDashboardChrome>;
}
