import MaintenanceBridgePanel from "@/components/MaintenanceBridgePanel";

export default function MaintenanceBridgePage() {
  return (
    <section className="section-pad">
      <style>{`
        .maintenance-bridge-panel{margin:22px auto;padding:22px;border-radius:24px;max-width:1180px;background:radial-gradient(circle at 18% 0%,rgba(84,255,160,.12),transparent 24rem),rgba(5,7,11,.94)}
        .maintenance-bridge-head .section-kicker{display:inline-flex;align-items:center;gap:8px}.maintenance-bridge-refresh{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(84,255,160,.32);background:rgba(84,255,160,.08);color:#b8ffd5;border-radius:14px;padding:10px 13px;font-weight:900;cursor:pointer}
        .maintenance-bridge-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.maintenance-bridge-stats article{border:1px solid rgba(84,255,160,.18);background:rgba(84,255,160,.055);border-radius:18px;padding:14px;display:grid;gap:6px}.maintenance-bridge-stats svg{color:#7fffc0}.maintenance-bridge-stats span{color:rgba(226,255,236,.68);text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;font-weight:900}.maintenance-bridge-stats strong{font-size:1.8rem;color:#fff}
        .maintenance-bridge-message{border:1px solid rgba(255,145,34,.28);background:rgba(255,145,34,.08);color:#ffe1ad;border-radius:14px;padding:10px 12px}.maintenance-bridge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.maintenance-bridge-card{border:1px solid rgba(84,255,160,.14);background:rgba(0,0,0,.28);border-radius:18px;padding:14px}.maintenance-bridge-card h4{margin:0 0 12px;display:flex;align-items:center;gap:8px;color:#eaffef}.maintenance-bridge-card p{color:rgba(226,255,236,.64)}
        .maintenance-bridge-row{border:1px solid rgba(84,255,160,.12);background:rgba(84,255,160,.045);border-radius:14px;padding:10px;margin-top:8px}.maintenance-bridge-row strong{display:block;color:#fff}.maintenance-bridge-row span{display:block;color:#b8ffd5;margin-top:4px}.maintenance-bridge-row small{display:block;color:rgba(226,255,236,.58);margin-top:3px}.maintenance-credential-strip{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.maintenance-credential-strip span{border-radius:999px;padding:8px 10px;font-weight:900;font-size:.76rem;text-transform:uppercase;letter-spacing:.04em}.maintenance-credential-strip .active{border:1px solid rgba(84,255,160,.38);background:rgba(84,255,160,.12);color:#b8ffd5}.maintenance-credential-strip .configured{border:1px solid rgba(255,205,92,.32);background:rgba(255,205,92,.1);color:#ffe0a3}.maintenance-credential-strip .missing{border:1px solid rgba(255,90,90,.28);background:rgba(255,90,90,.08);color:#ffb6b6}@media(max-width:900px){.maintenance-bridge-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.maintenance-bridge-grid{grid-template-columns:1fr}}@media(max-width:560px){.maintenance-bridge-stats{grid-template-columns:1fr}.maintenance-bridge-panel{padding:16px}}
      `}</style>
      <div className="container">
        <span className="section-kicker">Maintenance AI</span>
        <h1>Bridge Control</h1>
        <p className="lead-copy">GitHub, Supabase, deployment, provider, and repair-action foundation for PPD Maintenance AI.</p>
      </div>
      <MaintenanceBridgePanel dashboardKey="maintenance" />
    </section>
  );
}
