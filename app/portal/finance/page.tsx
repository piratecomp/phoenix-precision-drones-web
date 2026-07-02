import FundingAiControlPanel from "@/components/FundingAiControlPanel";
import { PortalDashboardDataShell } from "@/components/PortalDataShell";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="finance_payroll" />
      <FundingAiControlPanel />
    </>
  );
}
