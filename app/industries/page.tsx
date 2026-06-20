const items = [
  ["Construction", "Progress reporting, utility and civil documentation, earthwork visibility, and recurring site updates."],
  ["Telecom", "Cell tower inspections, rooftop communications assets, and field documentation for telecom contractors and providers."],
  ["Insurance & Property", "Roof reviews, storm documentation, safer aerial access, and organized evidence capture."],
  ["Infrastructure", "Roads, bridges, utilities, right-of-way visibility, and inspection support."],
  ["Solar & Energy", "Thermal and visual inspection support for solar farms, arrays, and maintenance workflows."],
  ["Real Estate & Development", "Aerial media and site presentation for listings, land sales, and development marketing."],
  ["Emergency Response", "Rapid aerial support for search operations, incident visibility, and post-event documentation."],
  ["Public Sector", "A professional framework that can extend into public works and agency-aligned aerial service needs."],
] as const;

export default function IndustriesPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Industries</span>
          <h1>Aerial intelligence for the industries most likely to buy repeat drone work.</h1>
          <p className="lead-copy">
            Phoenix Precision Drones serves commercial sectors where visibility, safety, speed,
            and organized aerial deliverables create real value.
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
    </>
  );
}
