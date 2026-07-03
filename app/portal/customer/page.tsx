import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import { PortalDashboardDataShell } from "@/components/PortalDataShell";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="customer" />
      <DashboardCommandWorkspace dashboardKey="customer" />
    </>
  );
}
