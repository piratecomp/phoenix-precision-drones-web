"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./SafetyDashboard.module.css";

type Weather = { location_name: string; source_kind: string | null; observation_time: string | null; forecast_period_start: string | null; fetched_at: string | null; valid_until: string | null; wind_mph: number | null; wind_gust_mph: number | null; temperature_f: number | null; precip_probability: number | null; assessment: string | null };
type Job = { id: string; status: string; job_address: string | null; scheduled_start: string | null; weather_status: string | null; safety_status: string | null; requires_manual_approval: boolean };
type Review = { id: string; job_id: string | null; title: string; summary: string | null; review_status: string; risk_level: string; required_action: string | null; created_at: string };
type Checklist = { id: string; job_id: string; checklist_status: string; weather_checked: boolean; airspace_checked: boolean; pilot_verified: boolean; drone_verified: boolean; insurance_checked: boolean; customer_site_confirmed: boolean; risk_score: number | null; required_action: string | null; updated_at: string };
type Event = { id: string; title: string; summary: string | null; module_key: string; severity: string; created_at: string };
type State = { generated_at: string; flight_commands_held: boolean; can_clear: boolean; weather: Weather[]; jobs: Job[]; reviews: Review[]; checklists: Checklist[]; events: Event[]; counts: { active_jobs: number; open_reviews: number; blocked_checklists: number; cleared_checklists: number; open_events: number } };
const stamp = (value?: string | null) => value ? new Date(value).toLocaleString() : "Unavailable";
const val = (value: number | null | undefined, unit = "") => value == null ? "—" : `${value}${unit}`;
const readable = (value?: string | null) => (value || "unknown").replaceAll("_", " ");

export default function SafetyDashboard() {
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<{ kind: "hold_job" | "start_review"; id: string } | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [airspace, setAirspace] = useState("");
  const [siteWeather, setSiteWeather] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [filter, setFilter] = useState("all");
  const load = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) { setMessage("Supabase is not configured."); setLoading(false); return; }
    setLoading(true);
    const { data: state, error } = await client.rpc("ppd_get_safety_dashboard_state");
    if (error) setMessage(error.message);
    else setData(state as State);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  async function action(name: "hold_job" | "start_review", id: string) {
    if (reason.trim().length < 10) { setMessage("Enter a reason of at least 10 characters."); return; }
    const client = getSupabaseBrowserClient(); if (!client) return;
    setBusy(true); setMessage("");
    const { error } = await client.rpc("ppd_safety_dashboard_action", { p_action: name, p_target_id: id, p_note: reason.trim() });
    if (error) setMessage(error.message);
    else { await load(); setMessage(name === "hold_job" ? "Job hold recorded. Dispatch remains blocked." : "Review started; no flight clearance was issued."); setSelected(null); setReason(""); }
    setBusy(false);
  }
  async function refreshWeather() {
    const client = getSupabaseBrowserClient(); if (!client) return;
    setBusy(true); setMessage("");
    const { data: result, error } = await client.rpc("ppd_safety_dashboard_refresh_weather");
    if (error) setMessage(error.message);
    else { await load(); setMessage(`NOAA refresh: ${result?.updated ?? 0} location(s) updated, ${result?.failed?.length ?? 0} failed. Review each location before planning.`); }
    setBusy(false);
  }
  async function clearChecklist(id: string) {
    const client = getSupabaseBrowserClient(); if (!client) return;
    if (airspace.trim().length < 10 || siteWeather.trim().length < 10 || !observedAt) { setMessage("Record current airspace and site weather evidence, including observation time."); return; }
    setBusy(true); setMessage("");
    const { data: result, error } = await client.rpc("ppd_safety_dashboard_clear_checklist", {
      p_checklist_id: id, p_airspace_evidence: airspace.trim(), p_site_weather_evidence: siteWeather.trim(),
      p_observed_at: new Date(observedAt).toISOString(), p_note: reason.trim() || null,
    });
    if (error) setMessage(error.message);
    else { await load(); setMessage(result?.ok ? "Checklist cleared for scheduling review. Pilot final authorization is still required." : `Clearance withheld: ${result?.reason || result?.error || "requirements unmet"}.`); if (result?.ok) { setChecklistId(null); setReason(""); } }
    setBusy(false);
  }
  const weather = data?.weather || [];
  const shown = filter === "all" ? weather : weather.filter(w => filter === "unsafe" ? (w.assessment || "").startsWith("unsafe") : (w.assessment || "review") === filter);
  const stale = weather.filter(w => w.assessment === "stale").length;
  const review = weather.filter(w => !w.assessment || w.assessment.startsWith("review")).length;
  const unsafe = weather.filter(w => (w.assessment || "").startsWith("unsafe")).length;
  const ready = weather.filter(w => w.assessment === "safe").length;
  return <section className={styles.root} aria-label="Safety control dashboard">
    <div className={styles.header}><div><span className="section-kicker">Safety operations</span><h2>Safety control dashboard</h2><p>Live regional weather, mission holds, reviews, and checklist evidence. Regional data is advisory; the pilot makes the final flight decision.</p></div><button type="button" onClick={() => void load()} disabled={loading || busy}>Refresh dashboard</button></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    {loading && !data && <p className={styles.message}>Loading safety state…</p>}
    {data && <>
      <div className={styles.gauges}>
        <div className={styles.gauge}><small>Flight command gate</small><strong>{data.flight_commands_held ? "HELD" : "Check required"}</strong><span>Ordinary commands blocked at server gate</span></div>
        <div className={styles.gauge}><small>Weather coverage</small><strong>{ready}/{weather.length}</strong><span>{unsafe} unsafe · {review} review · {stale} stale</span></div>
        <div className={styles.gauge}><small>Mission review</small><strong>{data.counts.active_jobs}</strong><span>Active jobs · {data.counts.open_reviews} open reviews</span></div>
        <div className={styles.gauge}><small>Checklist status</small><strong>{data.counts.cleared_checklists}</strong><span>Cleared · {data.counts.blocked_checklists} blocked</span></div>
        <div className={styles.gauge}><small>Open safety alerts</small><strong>{data.counts.open_events}</strong><span>Safety and weather events</span></div>
      </div>
      <article className={styles.panel}><div className={styles.sectionHeader}><div><h3>NOAA regional conditions</h3><p>Actual station observation time and cache expiry are shown separately. Missing gusts and forecasts require review.</p></div><button type="button" disabled={busy} onClick={() => void refreshWeather()}>{busy ? "Working…" : "Refresh NOAA now"}</button></div>
        <div className={styles.filters} aria-label="Filter weather locations">{["all","safe","unsafe","review","review_missing_weather","stale"].map(f => <button key={f} className={filter === f ? styles.active : ""} onClick={() => setFilter(f)} type="button">{readable(f)}</button>)}</div>
        <div className={styles.grid}>{shown.map(w => <div className={styles.item} key={w.location_name}><div className={styles.row}><strong>{w.location_name}</strong><b className={styles.badge}>{readable(w.assessment)}</b></div><p>{readable(w.source_kind)} · Wind {val(w.wind_mph," mph")} · Gust {val(w.wind_gust_mph," mph")} · Temp {val(w.temperature_f," °F")} · Precip {val(w.precip_probability,"%")}</p><small>Observed {stamp(w.observation_time)} · Forecast {stamp(w.forecast_period_start)}<br/>Fetched {stamp(w.fetched_at)} · Expires {stamp(w.valid_until)}</small></div>)}</div>
        {!shown.length && <p className={styles.empty}>No locations match this filter.</p>}
      </article>
      <div className={styles.columns}><article className={styles.panel}><h3>Active jobs and holds</h3>{!data.jobs.length && <p className={styles.empty}>No active jobs. No mission is cleared for flight.</p>}{data.jobs.map(j => <div key={j.id} className={styles.item}><div className={styles.row}><strong>{j.job_address || `Job ${j.id.slice(0,8)}`}</strong><b className={styles.badge}>{readable(j.safety_status)}</b></div><p>{readable(j.status)} · Weather {readable(j.weather_status)} · {j.requires_manual_approval ? "Manual approval required" : "Approval status requires review"}</p><small>Scheduled {stamp(j.scheduled_start)}</small><button type="button" disabled={busy} onClick={() => { setSelected({kind:"hold_job",id:j.id}); setReason(""); }}>Hold job</button></div>)}</article>
        <article className={styles.panel}><h3>Safety review queue</h3>{!data.reviews.length && <p className={styles.empty}>No active review items. This does not establish flight readiness.</p>}{data.reviews.map(r => <div key={r.id} className={styles.item}><div className={styles.row}><strong>{r.title}</strong><b className={styles.badge}>{readable(r.review_status)}</b></div><p>{r.summary || r.required_action || "Review evidence required"}</p><small>{readable(r.risk_level)} risk · {stamp(r.created_at)}</small>{["open","in_review"].includes(r.review_status) && <button type="button" disabled={busy} onClick={() => { setSelected({kind:"start_review",id:r.id}); setReason(""); }}>Start review</button>}</div>)}</article></div>
      {selected && <form className={styles.panel} onSubmit={e => { e.preventDefault(); void action(selected.kind,selected.id); }}><h3>{selected.kind === "hold_job" ? "Hold this job" : "Start review"}</h3><label>Reason or required action<textarea value={reason} onChange={e => setReason(e.target.value)} minLength={10} maxLength={2000} required /></label><div className={styles.actions}><button type="submit" disabled={busy}>{busy ? "Working…" : "Record action"}</button><button type="button" onClick={() => setSelected(null)}>Cancel</button></div></form>}
      <article className={styles.panel}><h3>Checklists and clearance</h3><p>Evidence can be submitted only by an active owner or admin. Existing verified checks, assigned pilot and drone, current job weather, and risk gate must all pass. Clearance is for scheduling review, with pilot final authorization still required.</p>{!data.checklists.length && <p className={styles.empty}>No job checklists exist yet.</p>}{data.checklists.map(c => <div className={styles.item} key={c.id}><div className={styles.row}><strong>Job {c.job_id.slice(0,8)} · risk {val(c.risk_score)}</strong><b className={styles.badge}>{readable(c.checklist_status)}</b></div><p>{["weather","airspace","pilot","drone","insurance","customer site"].map((label,i) => `${label}: ${[c.weather_checked,c.airspace_checked,c.pilot_verified,c.drone_verified,c.insurance_checked,c.customer_site_confirmed][i] ? "verified" : "missing"}`).join(" · ")}</p><small>{c.required_action || "Evidence required"} · Updated {stamp(c.updated_at)}</small>{data.can_clear && c.checklist_status !== "cleared" && <button type="button" onClick={() => { setChecklistId(c.id); setReason(""); setAirspace(""); setSiteWeather(""); setObservedAt(""); }}>Review clearance evidence</button>}</div>)}
        {checklistId && <form className={styles.evidence} onSubmit={e => { e.preventDefault(); void clearChecklist(checklistId); }}><h4>Checklist {checklistId.slice(0,8)}</h4><label>Airspace evidence<textarea value={airspace} onChange={e => setAirspace(e.target.value)} minLength={10} maxLength={2000} required /></label><label>Site weather evidence<textarea value={siteWeather} onChange={e => setSiteWeather(e.target.value)} minLength={10} maxLength={2000} required /></label><label>Site observation time<input type="datetime-local" value={observedAt} onChange={e => setObservedAt(e.target.value)} required /></label><label>Reviewer note<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={2000} /></label><div className={styles.actions}><button disabled={busy} type="submit">{busy ? "Checking…" : "Check and clear"}</button><button type="button" onClick={() => setChecklistId(null)}>Cancel</button></div></form>}
      </article>
      <article className={styles.panel}><h3>Open safety and weather alerts</h3>{!data.events.length && <p className={styles.empty}>No open events recorded. Inspect live evidence before authorizing work.</p>}{data.events.map(e => <div key={e.id} className={styles.item}><div className={styles.row}><strong>{e.title}</strong><b className={styles.badge}>{readable(e.severity)}</b></div><p>{e.summary}</p><small>{readable(e.module_key)} · {stamp(e.created_at)}</small></div>)}</article>
      <p className={styles.timestamp}>Snapshot generated {stamp(data.generated_at)}. Refresh after a field change.</p>
    </>}
  </section>;
}
