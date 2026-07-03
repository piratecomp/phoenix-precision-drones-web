import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import MaintenanceBridgePanel from "@/components/MaintenanceBridgePanel";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="maintenance">
      <DashboardCommandWorkspace dashboardKey="maintenance" />
      <MaintenanceBridgePanel dashboardKey="maintenance" />
    </PortalDashboardChrome>
  );
}
