import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-v18-1.css";
import "./portal-game-v19.css";
import "./portal-game-v20.css";
import "./launch-v21.css";
import "./portal-map-v22.css";
import "./google-map-v23.css";
import "./internal-messages-v26.css";
import "./quote-pipeline-v28.css";
import "./maintenance-bridge-v35.css";
import "./dashboard-comms-v41.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import GoogleOperationsMapBoot from "@/components/GoogleOperationsMapBoot";
import DashboardClickLinker from "@/components/DashboardClickLinker";

export const metadata: Metadata = {
  title: "Phoenix Precision Drones | Commercial Drone Services & Portal Experience",
  description: "Phoenix Precision Drones commercial drone services and portal experience.",
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
          <GoogleOperationsMapBoot />
          <DashboardClickLinker />
        </div>
      </body>
    </html>
  );
}
