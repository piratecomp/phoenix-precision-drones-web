import Image from "next/image";
import { BadgeCheck, Clock3, MapPinned, PlaneTakeoff, ShieldCheck, UploadCloud } from "lucide-react";

const features = [
  ["Mission workflow", "Mission offers, scheduling context, job details, route awareness, and acceptance flow are presented in a clear pilot-first layout."],
  ["Deliverables & uploads", "Photos, mapping outputs, inspection reports, flight media, and delivery progress are organized around each mission."],
  ["Equipment & safety", "Equipment status, drone capability, flight readiness, certifications, insurance, weather, and safety reminders stay visible."],
  ["Payout support", "Jobs can connect to pilot payouts, time cards, payroll records, and status tracking so the field work ties back to payment workflow."],
];

const readiness = [
  ["Qualified", "Part 107, insurance, background status, drone verification, and skill match can support pilot readiness.", BadgeCheck],
  ["Close", "Location, distance, ETA, and route data can support better assignment decisions.", MapPinned],
  ["Available", "Availability windows and response history can help dispatch route work to pilots who can actually take it.", Clock3],
  ["Rested", "Daily flight hours, weekly flight hours, and rest windows are designed into fatigue-aware scheduling.", ShieldCheck],
  ["Equipped", "LiDAR, thermal, photography, and DJI-compatible drone capability can be matched to job requirements.", PlaneTakeoff],
  ["Uploaded", "Files, media, reports, and customer deliverables can be organized after field execution.", UploadCloud],
] as const;

export default function DashboardPage() {
  return (
    <>
      <section className="page-hero section-pad">
        <div className="container page-hero-inner">
          <span className="section-kicker">Pilot dashboard</span>
          <h1>A pilot portal built for field execution, not generic account management.</h1>
          <p className="lead-copy">
            The pilot dashboard is designed to help qualified pilots receive organized work, understand mission context, confirm readiness, complete field capture, upload data, and stay connected to the PPD operating system.
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
      <section className="section-pad section-divider">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Pilot readiness model</span>
            <h2>The platform is designed to match work with qualified, available, properly equipped pilots.</h2>
            <p>
              Dispatch is strongest when it understands the pilot, the aircraft, the job, the weather, the schedule, and the safety context.
            </p>
          </div>
          <div className="service-detail-grid">
            {readiness.map(([title, text, Icon]) => (
              <article className="detail-card panel-card" key={title}>
                <div className="detail-icon"><Icon size={28} /></div>
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
