"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const statRoutes: Array<{ label: string; route: string }> = [
  { label: "Production Readiness", route: "/portal/owner#production-readiness" },
  { label: "Active Jobs", route: "/portal/jobs" },
  { label: "Verified Pilots", route: "/portal/pilot-network" },
  { label: "AI Approvals", route: "/portal/owner#ai-approvals" },
  { label: "Critical Events", route: "/portal/event-log" },
];

function cleanHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function DashboardClickLinker() {
  useEffect(() => {
    async function showQueueReview() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data, error } = await supabase.rpc("ppd_get_current_queue_item_review");
      if (error) {
        window.alert(error.message);
        return;
      }
      const note = data?.notification;
      const item = data?.approval;
      if (!item) {
        window.alert(data?.message || "No pending queue item.");
        return;
      }
      const preview = cleanHtml(note?.message_html || note?.body).slice(0, 1200);
      window.alert([
        item.action_title || "Queue item",
        item.action_summary || "",
        note?.recipient_email ? `To: ${note.recipient_email}` : "",
        note?.subject ? `Subject: ${note.subject}` : "",
        preview ? `Preview: ${preview}` : "No message body preview available."
      ].filter(Boolean).join("\n\n"));
    }

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

      const rows = Array.from(document.querySelectorAll<HTMLElement>(".portal-game-approval-row"));
      rows.forEach((row) => {
        if (row.dataset.ppdReviewAdded === "true") return;
        const buttons = row.querySelector<HTMLElement>(".approval-buttons");
        if (!buttons) return;
        row.dataset.ppdReviewAdded = "true";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Review";
        btn.className = "ppd-injected-review-btn";
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          showQueueReview();
        });
        buttons.prepend(btn);
      });
    }

    wireCards();
    const observer = new MutationObserver(wireCards);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
