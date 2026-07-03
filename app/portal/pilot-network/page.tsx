import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="pilot_1099">
      <DashboardCommandWorkspace dashboardKey="pilot_1099" />
    </PortalDashboardChrome>
  );
}
