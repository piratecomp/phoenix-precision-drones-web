const pillars = [
  ["Field-first mindset", "Built around the realities of construction, inspection, and operational site work rather than generic creative-only drone marketing."],
  ["Stronger brand continuity", "The public site, customer portal, pilot portal, flyer concepts, and card mockups share the same futuristic mission-control theme."],
  ["Operations-oriented growth", "Customer visibility, pilot workflow, repeatable deliverables, and commercial positioning all support long-term service growth."],
];

export default function AboutPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">About</span>
          <h1>Phoenix Precision Drones is designed to look and operate like a serious commercial platform.</h1>
          <p className="lead-copy">
            The brand direction pairs a bold public presence with role-based portal experiences for
            customers and pilots, keeping the business presentation aligned with field execution.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container info-card-grid">
          {pillars.map(([title, text]) => (
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
