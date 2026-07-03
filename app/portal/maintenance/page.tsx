import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import { PortalDashboardDataShell } from "@/components/PortalDataShell";
import MaintenanceBridgePanel from "@/components/MaintenanceBridgePanel";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="maintenance" />
      <DashboardCommandWorkspace dashboardKey="maintenance" />
      <div className="portal-main-area maintenance-bridge-inline-host">
        <MaintenanceBridgePanel dashboardKey="maintenance" />
      </div>
    </>
  );
}
