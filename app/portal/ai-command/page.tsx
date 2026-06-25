import AIGatewayPanel from "@/components/AIGatewayPanel";
import MaintenanceBridgePanel from "@/components/MaintenanceBridgePanel";

export default function AICommandPage() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="panel-card portal-linked-header">
          <span className="section-kicker">PPD AI Command</span>
          <h1>Business Brain Control</h1>
          <p>Controlled AI Gateway execution for business reasoning, quote analysis, maintenance repair reasoning, and generated department work items.</p>
        </div>
        <AIGatewayPanel />
        <MaintenanceBridgePanel dashboardKey="owner" />
      </div>
    </section>
  );
}
