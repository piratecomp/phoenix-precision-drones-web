import PilotApplicationForm from "@/components/PilotApplicationForm";

export default function ApplyPage() {
  return (
    <>
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Network Application</span>
          <h1>Apply to join Phoenix Precision Drones.</h1>
          <p className="lead-copy">Submit your capability profile. Applications enter the controlled verification queue before any assignment.</p>
        </div>
      </section>
      <section className="section-pad section-divider">
        <div className="container narrow-container">
          <PilotApplicationForm />
        </div>
      </section>
    </>
  );
}
