import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Image src="/images/logo-emblem-clean.png" alt="Phoenix Precision Drones emblem" width={96} height={96} className="footer-emblem" />
          <div>
            <strong>Phoenix Precision Drones</strong>
            <p>Aviation intelligence, precision data, and mission-ready deliverables.</p>
          </div>
        </div>

        <div>
          <h4>Quick links</h4>
          <div className="footer-links">
            <Link href="/services">Services</Link>
            <Link href="/industries">Industries</Link>
            <Link href="/pilots">Pilot Network</Link>
            <Link href="/customer-portal">Customer Portal</Link>
            <Link href="/dashboard">Pilot Dashboard</Link>
          </div>
        </div>

        <div>
          <h4>Contact</h4>
          <div className="footer-meta">
            <span>sales@phoenixprecisiondrones.com</span>
            <span>Phoenix, Arizona</span>
            <span>Commercial drone services, customer portals, and pilot workflows.</span>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Phoenix Precision Drones. All rights reserved.</span>
        <div className="footer-bottom-links">
          <span>FAA-aligned operations</span>
          <span>AI-assisted workflows</span>
          <span>Cell tower inspection ready</span>
        </div>
      </div>
    </footer>
  );
}
