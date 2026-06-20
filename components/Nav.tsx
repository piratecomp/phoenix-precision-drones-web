import Image from "next/image";
import Link from "next/link";

const links = [
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Pilot Network", "/pilots"],
  ["Customer Portal", "/customer-portal"],
  ["Pilot Dashboard", "/dashboard"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export default function Nav() {
  return (
    <header className="nav-shell">
      <div className="container nav-bar">
        <Link href="/" className="brand-lockup" aria-label="Phoenix Precision Drones home">
          <div className="brand-emblem-wrap">
            <Image src="/images/logo-emblem-transparent.png" alt="Phoenix Precision Drones emblem" width={120} height={120} className="brand-emblem" priority />
          </div>
          <div className="brand-banner-wrap">
            <Image src="/images/banner-transparent.png" alt="Phoenix Precision Drones" width={560} height={186} className="brand-banner" priority />
          </div>
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="ghost-btn nav-contact" href="/contact">
            Contact
          </Link>
          <Link className="primary-btn nav-quote" href="/contact">
            Request a Quote
          </Link>
        </div>
      </div>
    </header>
  );
}
