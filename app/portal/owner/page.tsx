import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="owner">
      <DashboardCommandWorkspace dashboardKey="owner" />
    </PortalDashboardChrome>
  );
}
