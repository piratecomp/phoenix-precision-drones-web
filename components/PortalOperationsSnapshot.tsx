"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  FileText,
  Gauge,
  Loader2,
  Mail,
  MessageSquare,
  PhoneCall,
  PlaneTakeoff,
  Radio,
  RefreshCw,
  Rocket,
  Satellite,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getPpdDashboardAppSnapshot, type PpdDashboardAppSnapshot } from "@/lib/portalApi";

type Row = {
  id?: string;
  source: string;
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
};

type InspectorView = "communications" | "voice" | "queues" | "launch" | "funding" | "fleet";

const viewLabels: Record<InspectorView, string> = {
  communications: "PPD AI Comms",
  voice: "Voice",
  queues: "Queues",
  launch: "Launch",
  funding: "Funding",
  fleet: "Fleet",
};

function num(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function clean(value: unknown, fallback = "none") {
  const text = String(value ?? "").trim();
  return text ? text.replace(/_/g, " ") : fallback;
}

function shortDate(value?: string | null) {
  if (!value) return "no date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function shortDateTime(value?: string | null) {
  if (!value) return "recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "No details yet.";
}

function RowList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className="portal-ops-empty">{empty}</p>;
  return (
    <div className="portal-ops-row-list">
      {rows.map((row, index) => (
        <article className="portal-ops-row" key={`${row.source}-${row.id || index}`}>
          <div>
            <strong>{row.title}</strong>
            {row.subtitle && <span>{row.subtitle}</span>}
            {row.meta && <small>{row.meta}</small>}
          </div>
          <em>{clean(row.status, row.source)}</em>
        </article>
      ))}
    </div>
  );
}

export default function PortalOperationsSnapshot({ dashboardKey }: { dashboardKey: string }) {
  const [configured] = useState(isSupabaseConfigured());
  const [snapshot, setSnapshot] = useState<PpdDashboardAppSnapshot | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<InspectorView>("communications");

  async function loadSnapshot() {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPpdDashboardAppSnapshot(supabase, dashboardKey);
      setSnapshot(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load dashboard app snapshot.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSnapshot();
  }, [dashboardKey]);

  const counts = snapshot?.counts || {};
  const comms = snapshot?.communications || {};
  const launch = snapshot?.launch || {};
  const funding = snapshot?.funding || {};
  const fleet = snapshot?.fleet || {};
  const cards = snapshot?.cards || [];

  const keyCounts = [
    { label: "Internal Threads", value: num(counts.internal_threads), note: "ppd_internal_message_threads" },
    { label: "Internal Messages", value: num(counts.internal_messages), note: "ppd_internal_messages" },
    { label: "Voice Sessions", value: num(counts.voice_call_sessions), note: "ppd_voice_call_sessions" },
    { label: "Launch Items", value: num(counts.launch_items), note: "ppd_launch_checklist" },
    { label: "Funding Apps", value: num(counts.funding_applications), note: "funding_applications" },
  ];

  const metricIcons = [PlaneTakeoff, Satellite, Radio, PhoneCall, DollarSign, ShieldCheck];
  const metricCards = cards.length
    ? cards
    : [
        { title: "Active Jobs", value: num(counts.active_jobs), label: "Live from jobs" },
        { title: "Drones Active", value: num(counts.active_drones), label: `${num(counts.drones)} fleet records` },
        { title: "Pilots Ready", value: num(counts.verified_marketplace_pilots), label: `${num(counts.marketplace_pilots)} pilots` },
        { title: "Open Voice", value: num(counts.open_voice_followups), label: `${num(counts.voice_call_sessions)} sessions` },
        { title: "Funding Packages", value: num(counts.funding_package_ready), label: `${num(counts.funding_applications)} apps` },
        { title: "Launch Passed", value: `${num(counts.launch_passed)}/${num(counts.launch_items)}`, label: `${num(counts.launch_blocked)} blocked` },
      ];

  const threadRows: Row[] = (comms.threads || []).map((item: any) => ({
    id: item.id,
    source: "thread",
    title: item.thread_title || "Internal thread",
    subtitle: `${clean(item.department_key, "department")} · ${shortDateTime(item.sort_at || item.last_message_at)}`,
    status: item.thread_status,
    meta: `Priority: ${clean(item.priority, "normal")}`,
  }));

  const messageRows: Row[] = (comms.messages || []).map((item: any) => ({
    id: item.id,
    source: "message",
    title: `${item.sender_display_name || "PPD AI"} · ${item.thread_title || "Thread"}`,
    subtitle: item.message_body,
    status: item.message_type,
    meta: `${clean(item.department_key, "department")} · ${shortDateTime(item.created_at)}`,
  }));

  const voiceRows: Row[] = (comms.voice_calls || []).map((item: any) => ({
    id: item.id,
    source: "voice",
    title: clean(item.caller_intent, "Voice call"),
    subtitle: firstText(item.summary, item.caller_number, "Voice call captured."),
    status: item.call_status,
    meta: `${item.caller_number || "unknown caller"} · ${shortDateTime(item.sort_at)}`,
  }));

  const queueRows: Row[] = [
    ...(comms.communication_queue || []).map((item: any) => ({
      id: item.id,
      source: "communication_queue",
      title: firstText(item.subject, item.intent, item.channel, "Communication queue item"),
      subtitle: item.recipient || item.last_error || "Communication worker queue",
      status: item.status,
      meta: `${clean(item.channel, "channel")} · ${shortDateTime(item.created_at)}`,
    })),
    ...(comms.email_queue || []).map((item: any) => ({
      id: item.id,
      source: "email_queue",
      title: item.subject || "Email queue item",
      subtitle: item.recipient || item.last_error || "Email worker queue",
      status: item.status,
      meta: shortDateTime(item.created_at),
    })),
    ...(comms.email_outbox || []).map((item: any) => ({
      id: item.id,
      source: "email_outbox",
      title: item.subject || "Email outbox item",
      subtitle: item.recipient || item.last_error || "Outbound email",
      status: item.status,
      meta: `${clean(item.sender, "sender")} · ${shortDateTime(item.created_at)}`,
    })),
    ...(comms.unified_events || []).map((item: any) => ({
      id: item.id,
      source: "unified_event",
      title: firstText(item.subject, item.channel, "Unified communication event"),
      subtitle: item.summary || item.sender_contact || "Unified communication event",
      status: item.processing_status,
      meta: `${clean(item.channel, "channel")} · ${clean(item.direction, "direction")} · ${shortDateTime(item.created_at)}`,
    })),
  ];

  const launchRows: Row[] = (launch.items || []).map((item: any) => ({
    id: item.id,
    source: "launch",
    title: item.checklist_item || "Launch checklist item",
    subtitle: `${clean(item.checklist_area, "area")} · Phase ${item.phase_number || 0}`,
    status: item.checklist_status,
    meta: item.required_for_launch ? "Required for launch" : "Optional",
  }));

  const fundingRows: Row[] = [
    ...(funding.applications || []).map((item: any) => ({
      id: item.id,
      source: "funding_application",
      title: item.notes || "Funding application",
      subtitle: `Owner: ${clean(item.assigned_owner, "unassigned")}`,
      status: item.application_status,
      meta: `Updated ${shortDate(item.updated_at)}`,
    })),
    ...(funding.opportunities || []).map((item: any) => ({
      id: item.id,
      source: "funding_opportunity",
      title: item.title || "Funding opportunity",
      subtitle: item.source_name || item.source_type || "Funding source",
      status: item.go_status || item.package_status || item.opportunity_status || item.status,
      meta: `Score ${item.score ?? 0} · Deadline ${shortDate(item.deadline_date)}`,
    })),
  ];

  const fleetRows: Row[] = (fleet.drones || []).map((item: any) => ({
    id: item.id,
    source: "drone",
    title: item.model || "Drone record",
    subtitle: item.serial_number || "No serial number",
    status: item.operational_status || item.status,
    meta: `${Number(item.total_flight_hours || 0).toLocaleString()} flight hours`,
  }));

  const inspectorRows = useMemo(() => {
    if (view === "communications") return [...threadRows, ...messageRows].slice(0, 16);
    if (view === "voice") return voiceRows.slice(0, 16);
    if (view === "queues") return queueRows.slice(0, 18);
    if (view === "launch") return launchRows.slice(0, 20);
    if (view === "funding") return fundingRows.slice(0, 22);
    return fleetRows.slice(0, 16);
  }, [view, snapshot]);

  function viewForCount(label: string): InspectorView {
    if (label.includes("Voice")) return "voice";
    if (label.includes("Launch")) return "launch";
    if (label.includes("Funding")) return "funding";
    return "communications";
  }

  return (
    <section className="portal-ops-snapshot" aria-label="Live Supabase dashboard snapshot">
      <div className="portal-ops-head">
        <div>
          <span className="section-kicker">Live Supabase Snapshot</span>
          <h2>Operations Command Surface</h2>
          <p>All values are live database counts. Pre-launch tables stay at zero until real records exist.</p>
        </div>
        <button className="portal-app-icon-btn wide" type="button" onClick={loadSnapshot} disabled={loading}>
          {loading ? <Loader2 className="portal-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh snapshot
        </button>
      </div>

      {error && <p className="portal-error-note">{error}</p>}

      <div className="portal-ops-metric-strip">
        {metricCards.map((card: any, index: number) => {
          const Icon = metricIcons[index] || Gauge;
          return (
            <article className="portal-ops-metric-card" key={`${card.title}-${index}`}>
              <Icon size={22} />
              <span>{card.title}</span>
              <strong>{card.value ?? 0}</strong>
              <em>{card.label || "Live count"}</em>
            </article>
          );
        })}
      </div>

      <div className="portal-truth-count-grid">
        {keyCounts.map((item) => (
          <button className="portal-truth-count" type="button" onClick={() => setView(viewForCount(item.label))} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.note}</em>
          </button>
        ))}
      </div>

      <div className="portal-ops-command-grid">
        <article className="portal-ops-map-card panel-card">
          <div className="portal-game-panel-head">
            <div>
              <span className="section-kicker">Pre-launch Map</span>
              <h3>Phoenix, AZ</h3>
            </div>
            <span className="portal-game-live-dot">True Counts</span>
          </div>
          <div className="portal-game-map-stage portal-ops-map-stage" aria-label="Stylized Phoenix operations map">
            <div className="map-route route-a" />
            <div className="map-route route-b" />
            <span className="map-pin pin-green">{num(counts.active_drones)}</span>
            <span className="map-pin pin-orange">{num(counts.active_jobs)}</span>
            <span className="map-pin pin-blue">{num(counts.marketplace_pilots)}</span>
            <span className="map-drone drone-a"><Satellite size={18} /></span>
            <span className="map-drone drone-b"><Satellite size={18} /></span>
            <span className="map-zone zone-a" />
            <span className="map-zone zone-b" />
            <strong>Phoenix</strong>
          </div>
          <div className="portal-game-map-legend">
            <span><i className="green-dot" />Active drones: {num(counts.active_drones)}</span>
            <span><i className="orange-dot" />Active jobs: {num(counts.active_jobs)}</span>
            <span><i className="blue-dot" />Pilots: {num(counts.marketplace_pilots)}</span>
          </div>
        </article>

        <article className="portal-ops-inspector panel-card">
          <div className="portal-game-panel-head">
            <div>
              <span className="section-kicker">Owner Inspector</span>
              <h3>{viewLabels[view]}</h3>
            </div>
            <span className="portal-ops-generated">{snapshot?.generated_at ? shortDateTime(snapshot.generated_at) : "loading"}</span>
          </div>

          <div className="portal-ops-view-tabs">
            {(Object.keys(viewLabels) as InspectorView[]).map((key) => (
              <button className={view === key ? "active" : ""} type="button" onClick={() => setView(key)} key={key}>
                {viewLabels[key]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="portal-ops-empty"><Loader2 className="portal-spin" size={16} /> Loading live snapshot…</p>
          ) : (
            <RowList rows={inspectorRows} empty={`No ${viewLabels[view].toLowerCase()} records found.`} />
          )}
        </article>
      </div>

      <div className="portal-ops-mini-grid">
        <article>
          <MessageSquare size={18} />
          <div><span>Internal</span><strong>{num(counts.internal_threads)} threads · {num(counts.internal_messages)} messages</strong></div>
        </article>
        <article>
          <PhoneCall size={18} />
          <div><span>Voice</span><strong>{num(counts.voice_call_sessions)} sessions · {num(counts.open_voice_followups)} open</strong></div>
        </article>
        <article>
          <Mail size={18} />
          <div><span>Outbound</span><strong>{num(counts.communication_queue_pending)} comm · {num(counts.email_outbox_pending)} email outbox</strong></div>
        </article>
        <article>
          <Rocket size={18} />
          <div><span>Launch</span><strong>{num(counts.launch_passed)}/{num(counts.launch_items)} passed · {num(counts.launch_blocked)} blocked</strong></div>
        </article>
        <article>
          <FileText size={18} />
          <div><span>Funding</span><strong>{num(counts.funding_applications)} applications · {num(counts.funding_opportunities)} opportunities</strong></div>
        </article>
        <article>
          <Wrench size={18} />
          <div><span>Fleet</span><strong>{num(counts.drones)} drones · {num(counts.maintenance_logs)} maintenance logs</strong></div>
        </article>
      </div>
    </section>
  );
}
