const items = [
  ["Construction", "Progress reporting, utility and civil documentation, earthwork visibility, jobsite history, recurring site updates, and stakeholder reporting."],
  ["Telecom", "Cell tower inspections, rooftop communications assets, antenna documentation, tower close-ups, and field support for telecom contractors."],
  ["Insurance & Property", "Roof reviews, storm documentation, property condition evidence, safer aerial access, and organized visual records for human review."],
  ["Infrastructure", "Roads, bridges, utilities, right-of-way visibility, pipeline corridors, asset inspection, and maintenance documentation support."],
  ["Solar & Energy", "Thermal and visual inspection support for solar farms, arrays, panel issues, maintenance records, and asset management workflows."],
  ["Real Estate & Development", "Aerial media, site perspective, land visibility, development marketing, progress visuals, and commercial property presentation."],
  ["Emergency Response", "Rapid aerial support for incident visibility, disaster assessment, post-event documentation, and emergency-response support workflows."],
  ["Public Sector", "A professional framework that can support public works, infrastructure, documentation, emergency planning, and agency-aligned aerial service needs."],
] as const;

const platformBenefits = [
  ["Recurring work ready", "The system supports repeatable job templates, subscriptions, mission days, deliverables, and customer records."],
  ["Location-aware", "Jobs can be tied to coordinates, service zones, weather snapshots, pilot routes, and mission boundaries."],
  ["Safety controlled", "Weather, operating limits, safety status, manual review, pilot compliance, and workload constraints can be part of each workflow."],
  ["Data organized", "Flight logs, media uploads, reports, invoices, customer deliverables, and project messages stay connected."],
] as const;

export default function IndustriesPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Industries</span>
          <h1>Aerial intelligence for industries that need repeatable data.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones serves commercial sectors where visibility, safety, speed, documentation, and organized deliverables create real value. The platform is built to support repeat work, mission planning, pilot routing, and customer records across multiple industries.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container info-card-grid">
          {items.map(([title, text]) => (
            <article className="detail-card panel-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Why the platform matters</span>
            <h2>Drone data becomes more valuable when the workflow is organized.</h2>
            <p>
              PPD is designed to help customers move from request to review to mission to delivered data with fewer disconnected steps.
            </p>
          </div>
          <div className="service-detail-grid">
            {platformBenefits.map(([title, text]) => (
              <article className="detail-card panel-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
