import QuoteIntakeForm from "@/components/QuoteIntakeForm";

export default function ContactPage() {
  return (
    <>
      <section className="page-hero section-pad portal-foundation-hero">
        <div className="container page-hero-inner">
          <span className="section-kicker">Request a quote</span>
          <h1>Start a controlled PPD mission workflow.</h1>
          <p className="lead-copy">
            Submit project details below. The request enters the production quote-to-job pipeline, gets AI classification, and waits for owner review before any job is created.
          </p>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container narrow-container">
          <QuoteIntakeForm />
        </div>
      </section>
    </>
  );
}
