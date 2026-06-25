import Image from "next/image";
import Link from "next/link";
import { serviceDefinitions } from "@/lib/services";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  Flame,
  LockKeyhole,
  Map,
  RadioTower,
  ShieldCheck,
  Sprout,
  Sun,
  Users,
  Zap,
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
    body: "Project requests, job status, files, reports, messages, invoices, and delivery history.",
    href: "/customer-portal",
    Icon: Users,
    stat: "Client workspace",
  },
  {
    title: "Pilot Portal",
    body: "Mission details, safety notes, uploads, flight logs, assignments, and payout workflow.",
    href: "/pilot-dashboard",
    Icon: Activity,
    stat: "Mission workflow",
  },
];

export default function HomePage() {
  const featuredServices = serviceDefinitions.filter((service) =>
    featuredServiceSlugs.includes(service.slug as any)
  );

  return (
    <>
      <section className="hero-section v16-hero section-pad home-v18-1-hero">
        <div className="v16-hero-bg" />
        <div className="container hero-layout v16-hero-layout home-v18-1-hero-layout">
          <div className="hero-copy v16-hero-copy">
            <span className="section-kicker">Aviation intelligence. Precision data.</span>
            <h1>
              Commercial drone data for <span className="accent-text">real project decisions</span>.
            </h1>
            <p className="lead-copy">
              Phoenix Precision Drones provides AI-supported aerial services for construction, mapping, inspections, thermal imaging, infrastructure, solar, agriculture, media, and documented field operations. The company combines professional drone workflows, customer visibility, pilot coordination, and organized deliverables in one operating platform.
            </p>
            <div className="hero-actions v16-hero-actions">
              <Link className="primary-btn hero-explore-btn" href="/contact">
                Request Quote
              </Link>
              <Link className="ghost-btn" href="/services">
                Explore Services
              </Link>
            </div>
            <div className="hero-service-pills home-v18-1-pills" aria-label="Popular service categories">
              <Link href="/services/construction-monitoring">Construction</Link>
              <Link href="/services/lidar-mapping-surveying">LiDAR</Link>
              <Link href="/services/thermal-inspections">Thermal</Link>
              <Link href="/services/agriculture-drone-services">Agriculture</Link>
            </div>
          </div>

          <div className="v16-hero-image-wrap home-v18-1-hero-image" aria-label="Drone scanning desert power-line infrastructure">
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

      <section className="section-pad section-divider home-v18-1-services">
        <div className="container">
          <div className="section-heading centered compact-heading">
            <span className="section-kicker">Explore Services</span>
            <h2>Choose the aerial workflow you need.</h2>
          </div>

          <div className="home-v18-1-service-console">
            {featuredServices.map((service, index) => {
              const Icon = iconBySlug[service.slug];
              const number = String(index + 1).padStart(2, "0");
              return (
                <Link className="home-v18-1-service-button" href={`/services/${service.slug}`} key={service.slug}>
                  <div className="service-button-left">
                    <span className="service-button-number">{number}</span>
                    <Icon size={26} />
                  </div>
                  <div className="service-button-main">
                    <h3>{service.shortTitle}</h3>
                    <p>{service.eyebrow}</p>
                  </div>
                  <span className="service-button-status">Open <ArrowRight size={15} /></span>
                </Link>
              );
            })}
          </div>

          <div className="centered-action-row">
            <Link className="ghost-btn" href="/services">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad section-divider home-v18-1-portals">
        <div className="container">
          <div className="section-heading centered compact-heading">
            <span className="section-kicker">Portal Preview</span>
            <h2>Customer visibility. Pilot workflow.</h2>
          </div>

          <div className="home-v18-1-portal-grid">
            {portalCards.map(({ title, body, href, Icon, stat }) => (
              <Link className="home-v18-1-portal-card panel-card" href={href} key={title}>
                <div className="portal-card-topline">
                  <Icon size={30} />
                  <span>{stat}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="service-button-status">Preview <ArrowRight size={15} /></span>
              </Link>
            ))}

            <Link className="home-v18-1-portal-card panel-card operations-card" href="/portal">
              <div className="portal-card-topline">
                <LockKeyhole size={30} />
                <span>Role-based access</span>
              </div>
              <h3>Operations Portal</h3>
              <p>Owner, admin, finance, safety, maintenance, sales, pilot network, observer, and customer dashboards.</p>
              <span className="service-button-status">Login <ArrowRight size={15} /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad home-v18-1-final">
        <div className="container">
          <div className="home-v18-1-quote-card panel-card">
            <div>
              <span className="section-kicker">Ready for a quote?</span>
              <h2>Tell us what needs to be captured.</h2>
              <p>
                Send the project location, service type, timeline, and deliverables. Phoenix Precision Drones will help route the request into the right aerial workflow.
              </p>
            </div>
            <div className="quote-card-actions">
              <Link className="primary-btn" href="/contact">Request Quote</Link>
              <Link className="ghost-btn" href="/signup">Create Customer Account</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
