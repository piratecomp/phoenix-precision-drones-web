"use client";

import { useEffect } from "react";

const statRoutes: Array<{ label: string; route: string }> = [
  { label: "Production Readiness", route: "/portal/owner#production-readiness" },
  { label: "Active Jobs", route: "/portal/jobs" },
  { label: "Verified Pilots", route: "/portal/pilot-network" },
  { label: "AI Approvals", route: "/portal/owner#ai-approvals" },
  { label: "Critical Events", route: "/portal/event-log" },
];

export default function DashboardClickLinker() {
  useEffect(() => {
    function wireCards() {
      const cards = Array.from(document.querySelectorAll<HTMLElement>(".portal-game-stat-card"));
      cards.forEach((card) => {
        const text = (card.textContent || "").toLowerCase();
        const match = statRoutes.find((item) => text.includes(item.label.toLowerCase()));
        if (!match || card.dataset.ppdLinked === "true") return;
        card.dataset.ppdLinked = "true";
        card.dataset.ppdRoute = match.route;
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("title", `Open ${match.label}`);
        card.classList.add("ppd-clickable-stat-card");
        const open = () => {
          window.location.href = match.route;
        };
        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      });
    }

    wireCards();
    const observer = new MutationObserver(wireCards);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
