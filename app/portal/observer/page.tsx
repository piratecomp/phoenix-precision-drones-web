import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="pilot_observer">
      <DashboardCommandWorkspace dashboardKey="pilot_observer" />
    </PortalDashboardChrome>
  );
}
