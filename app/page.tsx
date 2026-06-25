import Image from "next/image";
import Link from "next/link";
import { serviceDefinitions } from "@/lib/services";
import {
  Activity,
  BadgeCheck,
  Building2,
  Flame,
  Map,
  RadioTower,
  ShieldCheck,
  Sun,
  Camera,
  ArrowRight,
  Sprout,
  Zap,
  Users,
  BrainCircuit,
  LockKeyhole,
} from "lucide-react";

const iconBySlug = {
  "construction-monitoring": Building2,
  "lidar-mapping-surveying": Map,
  "thermal-inspections": Flame,
  "infrastructure-utility-inspections": Zap,
  "cell-tower-telecom-inspections": RadioTower,
  "solar-farm-inspections": Sun,
  "insurance-disaster-documentation": ShieldCheck,
  "emergency-response-support": Activity,
  "real-estate-marketing-media": Camera,
  "agriculture-drone-services": Sprout,
};

const featuredServiceSlugs = [
  "construction-monitoring",
  "lidar-mapping-surveying",
  "thermal-inspections",
  "infrastructure-utility-inspections",
  "solar-farm-inspections",
  "agriculture-drone-services",
] as const;

const portalCards = [
  {
    title: "Customer Portal",
    body: "Track requests, project status, reports, invoices, messages, and delivered files.",
    href: "/customer-portal",
    Icon: Users,
  },
  {
    title: "Pilot Portal",
    body: "Mission details, safety notes, uploads, logs, and payout workflow for pilots.",
    href: "/pilot-dashboard",
    Icon: Activity,
  },
  {
    title: "Operations Portal",
    body: "Owner, admin, finance, safety, maintenance, sales, and pilot-network command views.",
    href: "/portal",
    Icon: LockKeyhole,
  },
];

const trustItems = [
  {
    title: "AI-assisted coordination",
    body: "The platform supports intake, dispatch logic, safety review, mission context, and deliverable workflow.",
    Icon: BrainCircuit,
  },
  {
    title: "Safety-aware workflows",
    body: "Weather, airspace-sensitive requests, pilot requirements, and manual review gates stay in the process.",
    Icon: ShieldCheck,
  },
  {
    title: "Scalable pilot network",
    body: "Phoenix-area operations can expand through a qualified 1099 pilot network as service demand grows.",
    Icon: BadgeCheck,
  },
];

export default function HomePage() {
  const featuredServices = serviceDefinitions.filter((service) =>
    featuredServiceSlugs.includes(service.slug as any)
  );

  return (
    <>
      <section className="hero-section v16-hero section-pad home-compact-hero">
        <div className="v16-hero-bg" />
        <div className="container hero-layout v16-hero-layout">
          <div className="hero-copy v16-hero-copy">
            <span className="section-kicker">AI-driven aerial intelligence</span>
            <h1>
              Drone data for <span className="accent-text">projects that need proof</span>.
            </h1>
            <p className="lead-copy">
              Phoenix Precision Drones supports construction, inspections, mapping, thermal imaging, infrastructure, solar, agriculture, media, and emergency documentation workflows.
            </p>
            <div className="hero-actions v16-hero-actions">
              <Link className="primary-btn hero-explore-btn" href="/contact">
                Request Quote
              </Link>
              <Link className="ghost-btn" href="/services">
                Explore Services
              </Link>
            </div>
            <div className="hero-service-pills" aria-label="Popular service categories">
              <Link href="/services/thermal-inspections">Thermal</Link>
              <Link href="/services/lidar-mapping-surveying">LiDAR</Link>
              <Link href="/services/construction-monitoring">Construction</Link>
              <Link href="/services/agriculture-drone-services">Agriculture</Link>
            </div>
          </div>

          <div className="v16-hero-image-wrap" aria-label="Drone scanning desert power-line infrastructure">
            <Image
              src="/images/hero-drone-powerline-scan.png"
              alt="Two drones scanning desert power-line infrastructure with LiDAR and thermal inspection beams at sunset"
              width={1792}
              height={1024}
              className="v16-hero-image"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section-pad section-divider v15-services-band home-compact-services">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Services</span>
            <h2>Start with the service. Open the details when needed.</h2>
            <p>
              The homepage now shows the core service paths only. Each linked page carries the deeper use cases, deliverables, workflow, and safety notes.
            </p>
          </div>

          <div className="service-grid v15-service-grid home-service-snapshot">
            {featuredServices.map((service) => {
              const Icon = iconBySlug[service.slug];
              return (
                <Link className="service-tile panel-card service-card-link" href={`/services/${service.slug}`} key={service.slug}>
                  <Icon size={30} />
                  <h3>{service.shortTitle}</h3>
                  <p>{service.eyebrow}</p>
                  <span>View details <ArrowRight size={16} /></span>
                </Link>
              );
            })}
          </div>

          <div className="centered-action-row">
            <Link className="ghost-btn" href="/services">
              View All Drone Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider home-portal-strip">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Portal system</span>
            <h2>One platform. Different workspaces.</h2>
            <p>
              Customers, pilots, and internal operations each get a role-based portal path instead of one crowded dashboard.
            </p>
          </div>

          <div className="info-card-grid home-portal-card-grid">
            {portalCards.map(({ title, body, href, Icon }) => (
              <Link className="detail-card panel-card service-card-link home-portal-link-card" href={href} key={title}>
                <Icon size={30} />
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="card-link-text">Open page <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad section-divider home-trust-strip">
        <div className="container about-credentials-grid home-trust-grid">
          {trustItems.map(({ title, body, Icon }) => (
            <article className="panel-card detail-card" key={title}>
              <Icon size={32} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-pad home-final-cta">
        <div className="container">
          <div className="panel-card final-cta-card">
            <span className="section-kicker">Ready for aerial data?</span>
            <h2>Request a quote or create a customer account.</h2>
            <p>
              Tell Phoenix Precision Drones what you need captured, where the project is, and what deliverables matter.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/contact">Request Quote</Link>
              <Link className="ghost-btn" href="/signup">Create Customer Account</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
