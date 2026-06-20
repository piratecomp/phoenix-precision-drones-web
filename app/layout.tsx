import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Phoenix Precision Drones | Commercial Drone Services & Portals",
  description:
    "Phoenix Precision Drones provides commercial drone services for construction progress, mapping support, cell tower inspections, thermal inspections, real estate media, and AI-assisted mission operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="background-grid" />
          <div className="background-glow" />
          <Nav />
          <main className="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
