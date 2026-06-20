const items = [
  ["Construction", "Progress photos, site visibility, utility and civil work documentation, and recurring updates for field operations."],
  ["Telecom", "Cell tower inspections, communication-site documentation, equipment visibility, and contractor support."],
  ["Insurance & Property", "Roof inspections, condition reports, storm documentation, and safer aerial access."],
  ["Solar & Infrastructure", "Thermal and visual support for solar assets, infrastructure checks, and maintenance workflows."],
  ["Real Estate & Development", "Aerial media for listings, land, developments, and investor-focused presentation material."],
  ["Government & Public Sector", "Future support for public works, emergency response, and infrastructure mission visibility."]
];

export default function IndustriesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Industries</span>
          <h1><span className="gradient">Aerial intelligence</span> for the sectors most likely to need repeat drone work.</h1>
          <p className="lead">Phoenix Precision Drones is aimed at industries where visibility, speed, documentation, and organized deliverables create real operational value.</p>
        </div>
      </section>
      <section className="section">
        <div className="container cards">
          {items.map(([title, text]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
