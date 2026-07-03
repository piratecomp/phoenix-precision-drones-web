import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="safety">
      <DashboardCommandWorkspace dashboardKey="safety" />
    </PortalDashboardChrome>
  );
}
