import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="nav">
      <Link className="nav-brand" href="/">
        <Image src="/images/logo-emblem.jpeg" alt="Phoenix Precision Drones logo" width={64} height={64} />
        <span className="brand-title">
          <strong>Phoenix</strong>
          <span>Precision Drones</span>
        </span>
      </Link>
      <nav className="nav-links">
        <Link href="/services">Services</Link>
        <Link href="/industries">Industries</Link>
        <Link href="/pilots">Pilots</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Login</Link>
        <Link className="nav-cta" href="/contact">Request Quote</Link>
      </nav>
      <Link className="mobile-note" href="/contact">Contact</Link>
    </header>
  );
}
