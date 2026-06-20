import Image from "next/image";

const features = [
  ["Mission workflow", "Mission acceptance, scheduling context, and live route awareness presented in a clear pilot-first layout."],
  ["Deliverables & uploads", "Photos, mapping outputs, inspection reports, and delivery progress organized around each mission."],
  ["Equipment & safety", "Equipment status, flight readiness, certifications, safety reminders, and operational support in one place."],
];

export default function DashboardPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Pilot dashboard</span>
          <h1>A bright, high-contrast pilot portal built for real field execution.</h1>
          <p className="lead-copy">
            The pilot portal keeps the same futuristic brand language while giving pilots a clear,
            useful mission view built around field execution.
          </p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container portal-page-layout">
          <div className="screenshot-shell tall-shot large-shot">
            <div className="screenshot-track tall-shot-track">
              <Image src="/images/pilot-portal-preview.png" alt="Phoenix Precision Drones pilot dashboard" width={1055} height={1491} className="portal-shot" priority />
            </div>
          </div>
          <div className="feature-stack">
            {features.map(([title, text]) => (
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
