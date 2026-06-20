import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand-wrap" aria-label="Phoenix Precision Drones home">
          <Image className="brand-icon" src="/images/logo-emblem-transparent.png" alt="Phoenix Precision Drones emblem" width={320} height={220} priority />
          <Image className="brand-banner" src="/images/phoenix-banner.png" alt="Phoenix Precision Drones banner" width={1536} height={1024} priority />
        </Link>

        <nav className="nav-links">
          <Link href="/services">Services</Link>
          <Link href="/industries">Industries</Link>
          <Link href="/pilots">Pilot Network</Link>
          <Link href="/customer-portal">Customer Portal</Link>
          <Link href="/dashboard">Pilot Dashboard</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Login</Link>
          <Link className="nav-cta" href="/contact">Request Quote</Link>
        </nav>

        <Link className="btn nav-mobile" href="/contact">Contact</Link>
      </div>
    </header>
  );
}
