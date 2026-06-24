import Image from "next/image";
import Link from "next/link";

const links = [
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Pilot Network", "/pilots"],
  ["Customer Portal", "/customer-portal"],
  ["Pilot Dashboard", "/pilot-dashboard"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export default function Nav() {
  return (
    <header className="nav-shell">
      <div className="container nav-bar">
        <Link href="/" className="brand-lockup combined-brand" aria-label="Phoenix Precision Drones home">
          <Image
            src="/images/header-brand-combined.png"
            alt="Phoenix Precision Drones"
            width={1128}
            height={296}
            className="combined-header-logo"
            priority
          />
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions nav-actions-v15">
          <Link className="ghost-btn nav-login" href="/login">
            Login
          </Link>
          <Link className="primary-btn nav-quote" href="/contact">
            Request Quote
          </Link>
        </div>

        <nav className="mobile-nav" aria-label="Mobile primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
