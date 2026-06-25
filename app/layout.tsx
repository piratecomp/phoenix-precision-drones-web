import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-v18-1.css";
import "./portal-game-v19.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Phoenix Precision Drones | Commercial Drone Services & Portal Experience",
  description:
    "Phoenix Precision Drones presents commercial drone services for construction, telecom, mapping, thermal inspections, customer deliverables, and pilot mission workflows.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <Nav />
          <main className="main">{children}</main>
          <Footer />
          <ChatWidget />
        </div>
      </body>
    </html>
  );
}
