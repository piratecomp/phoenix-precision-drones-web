import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock3, MapPinned, Radio, ShieldCheck, UploadCloud } from "lucide-react";

const features = [
  ["Mission queue", "View matched opportunities, job context, time windows, and customer deliverable needs."],
  ["Safety status", "See weather, workload, certification, insurance, equipment readiness, and manual-review flags."],
  ["Route context", "Understand site location, estimated travel, mission area, access notes, and job requirements."],
  ["Uploads", "Keep photos, video, mapping files, thermal media, flight logs, and customer deliverables connected to the job."],
] as const;

export default function PilotDashboardPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container portal-page-layout">
          <div>
            <span className="section-kicker">Pilot Dashboard Preview</span>
            <h1>Mission-control workflow for qualified drone pilots.</h1>
            <p className="lead-copy">
              The pilot dashboard is the future field interface for job offers, mission requirements, safety-aware scheduling, equipment readiness, uploads, messages, and payout support.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/pilots">Join Pilot Network</Link>
              <Link className="ghost-btn" href="/login">Pilot Login</Link>
            </div>
          </div>
          <div className="screenshot-shell large-shot">
            <div className="screenshot-track tall-shot-track">
              <Image src="/images/pilot-portal-preview.png" alt="Pilot portal preview" width={1024} height={1024} className="portal-shot" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container info-card-grid">
          {features.map(([title, text], index) => {
            const icons = [Radio, ShieldCheck, MapPinned, UploadCloud];
            const Icon = icons[index];
            return (
              <article className="detail-card panel-card" key={title}>
                <Icon size={30} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-pad section-divider">
        <div className="container about-credentials-grid">
          <article className="detail-card panel-card"><BadgeCheck size={32} /><h3>Qualification aware</h3><p>Part 107, insurance, drone capability, skill match, safety score, and response history can support pilot matching.</p></article>
          <article className="detail-card panel-card"><Clock3 size={32} /><h3>Workload aware</h3><p>Daily flight time, weekly flight time, and rest windows are designed to help prevent overbooking and fatigue.</p></article>
        </div>
      </section>
    </>
  );
}
