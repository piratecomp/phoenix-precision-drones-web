"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import GoogleOperationsMapBoot from "@/components/GoogleOperationsMapBoot";
import DashboardClickLinker from "@/components/DashboardClickLinker";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPortalRoute = pathname === "/portal" || pathname.startsWith("/portal/");

  if (isPortalRoute) {
    return (
      <div className="site-shell portal-route-shell">
        <main className="main portal-route-main">{children}</main>
        <DashboardClickLinker />
      </div>
    );
  }

  return (
    <div className="site-shell public-route-shell">
      <Nav />
      <main className="main">{children}</main>
      <Footer />
      <ChatWidget />
      <GoogleOperationsMapBoot />
      <DashboardClickLinker />
    </div>
  );
}
