import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import OwnerCompensationDraftPanel from "@/components/OwnerCompensationDraftPanel";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="owner">
      <DashboardCommandWorkspace dashboardKey="owner" />
      <OwnerCompensationDraftPanel />
    </PortalDashboardChrome>
  );
}
