import DashboardCommandWorkspace from "@/components/DashboardCommandWorkspace";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";
import QuotePipelinePanel from "@/components/QuotePipelinePanel";

export default function PortalDashboardPage() {
  return (
    <PortalDashboardChrome dashboardKey="sales_marketing">
      <DashboardCommandWorkspace dashboardKey="sales_marketing" />
      <QuotePipelinePanel dashboardKey="sales_marketing" />
    </PortalDashboardChrome>
  );
}
