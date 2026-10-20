import AICyclePanel from "@/components/AICyclePanel";
import AIGatewayPanel from "@/components/AIGatewayPanel";
import DepartmentAIOrchestratorPanel from "@/components/DepartmentAIOrchestratorPanel";
import MaintenanceBridgePanel from "@/components/MaintenanceBridgePanel";
import PrelaunchDiagnosticsPanel from "@/components/PrelaunchDiagnosticsPanel";

export default function AICommandPage() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="panel-card portal-linked-header">
          <span className="section-kicker">PPD AI Command</span>
          <h1>Business Brain Control</h1>
          <p>Controlled AI cycle, AI Gateway execution, department AI routing, generated work items, maintenance repair actions, and owner-exception governance.</p>
        </div>
        <PrelaunchDiagnosticsPanel />
        <AICyclePanel />
        <AIGatewayPanel />
        <DepartmentAIOrchestratorPanel />
        <MaintenanceBridgePanel dashboardKey="owner" />
      </div>
    </section>
  );
}
