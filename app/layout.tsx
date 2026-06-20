import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Phoenix Precision Drones | AI-Driven Drone Operations",
  description:
    "Phoenix Precision Drones provides commercial drone services for construction progress, aerial mapping, inspections, thermal imaging, real estate, emergency response support, and AI-assisted operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="grid-bg" />
          <Nav />
          <main className="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
