import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="pilot_w2">
      <DashboardCommandWorkspace dashboardKey="pilot_w2" />
    </PortalDashboardChrome>
  );
}
