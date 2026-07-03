import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import { PortalDashboardDataShell } from "@/components/PortalDataShell";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="sales_marketing" />
      <DashboardCommandWorkspace dashboardKey="sales_marketing" />
    </>
  );
}
