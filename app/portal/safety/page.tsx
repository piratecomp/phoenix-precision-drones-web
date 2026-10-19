import SafetyDashboard from "@/components/SafetyDashboard";
import PortalDashboardChrome from "@/components/PortalDashboardChrome";

export default function PortalDashboardPage() {
  return <PortalDashboardChrome dashboardKey="safety"><SafetyDashboard /></PortalDashboardChrome>;
}
