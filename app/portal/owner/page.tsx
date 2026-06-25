import { PortalDashboardDataShell } from "@/components/PortalDataShell";
import AIGatewayPanel from "@/components/AIGatewayPanel";

export default function PortalDashboardPage() {
  return (
    <>
      <PortalDashboardDataShell dashboardKey="owner" />
      <div className="portal-main-area maintenance-bridge-inline-host">
        <AIGatewayPanel />
      </div>
    </>
  );
}
