import Link from "next/link";
import { ServiceDefinition } from "@/lib/services";
import { ArrowLeft, ClipboardCheck, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

type Props = {
  service: ServiceDefinition;
};

export function ServicePageTemplate({ service }: Props) {
  return (
    <>
      <section className="page-hero section-pad service-page-hero">
        <div className="container page-hero-inner">
          <Link className="back-link" href="/services"><ArrowLeft size={16} /> Back to services</Link>
          <span className="section-kicker">{service.eyebrow}</span>
          <h1>{service.title}</h1>
          <p className="lead-copy">{service.hero}</p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/contact">Request This Service</Link>
            <Link className="ghost-btn" href="/services">Explore All Services</Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container service-detail-layout">
          <article className="panel-card service-main-card">
            <span className="section-kicker">What this service is</span>
            <h2>{service.title}</h2>
            <p>{service.summary}</p>
          </article>

          <aside className="panel-card service-side-card">
            <ShieldCheck size={32} />
            <h3>Safety and review note</h3>
            <p>{service.safetyNote}</p>
          </aside>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container service-detail-layout service-detail-layout-three">
          <article className="detail-card panel-card">
            <ClipboardCheck size={30} />
            <h3>Common uses</h3>
            <ul className="mini-list service-list">
              {service.uses.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="detail-card panel-card">
            <Sparkles size={30} />
            <h3>Customer deliverables</h3>
            <ul className="mini-list service-list">
              {service.deliverables.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="detail-card panel-card">
            <MessageCircle size={30} />
            <h3>PPD AI workflow</h3>
            <ul className="mini-list service-list">
              {service.workflow.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container panel-card service-cta-panel">
          <div>
            <span className="section-kicker">Ready to discuss {service.shortTitle}?</span>
            <h2>Send project details for human follow-up.</h2>
            <p>PPD AI can collect project details, but active scheduling, flight approval, insurance documents, and dispatch decisions require the proper business review process.</p>
          </div>
          <Link className="primary-btn" href="/contact">Start Project Intake</Link>
        </div>
      </section>
    </>
  );
}
