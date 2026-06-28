import Image from "next/image";
import Link from "next/link";

const facebookPageUrl = "https://www.facebook.com/share/1HNquNL2eq/?mibextid=wwXIfr";
const salesEmail = "sales@phoenixprecisiondrones.com";

const footerContactStackStyle = {
  gap: "6px",
  lineHeight: 1.35,
};

const footerContactLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  width: "fit-content",
  color: "var(--gold)",
  fontWeight: 800,
  textDecoration: "underline",
  textUnderlineOffset: "4px",
};

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="9" fill="#1877F2" />
      <path
        fill="#fff"
        d="M11.9 10.55h1.98l.31-2.37H11.9V6.66c0-.69.19-1.16 1.18-1.16h1.24V3.38c-.21-.03-.95-.09-1.81-.09-1.79 0-3.02 1.09-3.02 3.1v1.79H7.46v2.37h2.03v6.07h2.41v-6.07Z"
      />
    </svg>
  );
}

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
            <Link href="/pilot-dashboard">Pilot Dashboard</Link>
            <Link href="/login">Login</Link>
          </div>
        </div>

        <div>
          <h4>Contact</h4>
          <div className="footer-meta" style={footerContactStackStyle}>
            <a href={`mailto:${salesEmail}`} style={footerContactLinkStyle}>{salesEmail}</a>
            <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer" style={footerContactLinkStyle}>
              <FacebookIcon />
              <span>Facebook Page</span>
            </a>
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
