const industries = [
  ["Construction", "Progress photos, site documentation, route visibility, utility corridors, earthwork status, and stakeholder updates."],
  ["Insurance", "Roof, property, storm, and condition documentation from safer aerial viewpoints."],
  ["Solar", "Solar array inspections, thermal-ready workflows, panel documentation, and maintenance support."],
  ["Real Estate", "Aerial media for residential, commercial, land, development, and investor presentations."],
  ["Utilities & Infrastructure", "Inspection support for towers, corridors, assets, and difficult-to-access locations."],
  ["Government & Public Sector", "Future support for public works, emergency response documentation, mapping, and infrastructure projects."]
];

export default function IndustriesPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Industries</span>
        <h1><span className="gradient-text">Aerial intelligence</span> for high-value field operations.</h1>
        <p className="lead">The company is focused on customers who need faster visibility, safer inspection methods, documented progress, and organized mission deliverables.</p>
      </section>
      <section className="section">
        <div className="cards">
          {industries.map(([title, body]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
