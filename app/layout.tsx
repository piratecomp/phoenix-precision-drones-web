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
import "./dashboard-shell-v42.css";
import SiteShell from "@/components/SiteShell";

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
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
