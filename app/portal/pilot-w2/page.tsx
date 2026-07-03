import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import { PortalDashboardDataShell } from "@/components/PortalDataShell";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="pilot_w2" />
      <DashboardCommandWorkspace dashboardKey="pilot_w2" />
    </>
  );
}
