# PPD Safety AI audit — 19 October 2026

## Verdict

**Not flight ready.** The database is prelaunch: zero jobs, mission plans, active missions, drone telemetry records, safety checklists, weather forecasts, and drone commands at audit time. No aircraft or pilot has been tested end to end. “100% safe” cannot be certified by a database audit; pilot-in-command authority and site conditions must remain independent checks.

## Verified findings and changes

| Area | Finding | Action / current state |
| --- | --- | --- |
| Weather ingestion | Five Phoenix-area zone caches had expired for months; new NOAA refresh runs at :10/:40 and prebrief. | 19:10 UTC cron completed. Source and observation time retained. Five zones refreshed; gust was null in all five. Chandler and Glendale station observations were >60 minutes old at 19:10. |
| Partial refresh failure | Cron reported success when the NOAA fetch failed for a location, leaving its old cache valid for a short time. | Checked wrapper expires failed locations and records a high-severity operational event. At 19:46 UTC, Glendale failed, four zones updated, Glendale was marked stale and an event was recorded. The first wrapper revision used an invalid event severity and rolled back; a full replacement corrected it and passed the failure-path test. |
| Weather classification | Null wind gust/precipitation previously allowed a safe label; missing briefing values rendered as zero. The legacy Edge sync also substituted zero or wind speed for absent readings. | Missing critical readings return `review_missing_weather`. Known unsafe wind remains unsafe. The briefing shows missing readings and provenance. `sync_job_weather` v46 preserves nulls and labels cached rows as forecasts. |
| Job safety | `evaluate_job_weather_safety` accepted any non-`unsafe` text as safe, even stale. Active jobs were not refreshed when zone cache refreshed. | Requires a recent NOAA station observation and all critical values. Scheduled cache refresh now propagates status to active jobs, including stale/missing states. No active job exists to demonstrate propagation. |
| Legacy weather APIs | Five boolean functions returned true for missing weather or used an arbitrary job's forecast. `weather_safe_for_mission` referenced nonexistent limit columns. | All now fail closed where location, date, or trustworthy data are absent. Legacy date-only APIs cannot establish flight weather. |
| Auto scheduler | Unbounded loop could continue forever after safe weather became unavailable and inserted rejected mission days. | Disabled with an explicit exception pending a bounded, human-reviewed scheduling proposal. |
| Mission evaluator | Referenced deleted `ai_safety_control`, then cleared mission for any weather status other than `unsafe`. | Requires current job weather `safe` and a recent human-cleared checklist with weather, airspace, pilot, aircraft, insurance and site flags. Missing mission returns `unknown_mission`. |
| Telemetry | Absent or old records, missing battery/signal/coordinates, or altitude below zero could yield `safe`. | Freshness and required fields enforced. The output is `telemetry_checks_passed`, deliberately short of flight clearance. Empty telemetry returns `no_current_telemetry`. |
| Low-battery monitor | Scanned historical telemetry below 25% and could queue repeated return-to-home commands for inactive drones. | Now only considers the newest reading within two minutes for an active mission and skips a drone with a pending RTH. Empty-system invocation created zero commands. Aircraft behavior remains untested. |
| Drone decision | Weighted decision could choose `continue` from partial inputs, or `reroute` for unrelated failures. | Returns `human_review_required`; no autonomous continuation/reroute decision. |
| Checklist clearance | Six booleans and risk score could approve a job with no reviewer or current evidence. | Clearance now requires an active owner/admin reviewer, recent site observation evidence, airspace evidence, matching pilot/drone, and current safe weather. Unknown checklist test returned `checklist not found`. The Safety dashboard now records evidence through an authenticated owner/admin RPC; no real checklist exists for an end-to-end clearance test. |
| Checklist invalidation | Cleared status could remain after changing the site, pilot, aircraft, schedule, or weather status. | An enabled job update trigger reopens the checklist and review item when those fields change or weather loses its safe state. No actual job existed for a transition test. |
| Command path | `insert_drone_command_v2` could queue ordinary commands with no mission safety gate. Worker can mark a command prepared, but does not execute aircraft-side commands. The legacy `Execute-mission-` endpoint returned a misleading `send_to_drone` action. | Database trigger blocks ordinary command insertion and status changes until aircraft-side integration and human authorization are validated; emergency `rth`, `land`, `emergency_stop` remain possible for authorized server code. `Execute-mission-` v36 returns HTTP 409 and `human_review_required`. Test takeoff insertion was rejected; command count stayed zero. |
| Safety engine | `safety_ai_engine` only queues a legacy review marker. `run_safety_ai` calls fraud, insurance and pilot checks; it does not unify flight weather or dispatch. | Not presented as autonomous flight clearance. |

## Remaining launch blockers

1. **Aircraft and pilot integration:** Verify actual DJI/mobile command handling, telemetry age and authenticity, connection loss, RTH/landing behavior, manual override, battery, geofence, and the pilot's final authority in a controlled field test. The live Edge worker only prepares a decision and does not prove aircraft behavior.
2. **Site weather:** NOAA station observations and hourly forecasts are regional. Missing gusts and old station observations keep weather in review. Add a reliable site measurement or explicit pilot observation and cross-check aviation weather, alerts, visibility, precipitation, and aircraft-specific limits. Do not auto-clear weather from a regional cache.
3. **Airspace:** The local `no_fly_zones` table is not proof of current FAA authorization, TFRs, LAANC or site restrictions. Review must capture current authorization evidence and time bounds.
4. **Checklist workflow:** The database now requires reviewer identity and evidence fields before clearance, and invalidates on important job/weather changes. The portal now captures airspace and site weather evidence and binds clearance to the authenticated active owner/admin. Independent verification, airspace authorization expiry, and live field changes still need field validation. The internal service-role function still accepts a reviewer ID, so server callers must remain trusted.
5. **Scheduling and dispatch:** Replace the disabled unbounded auto scheduler with a finite proposal workflow. Prove every dispatch/mission command path consults one common safety gate; do not enable ordinary command publishing until then.
   The low-battery monitor is bounded and deduplicated in the database, but its aircraft-side behavior and delivery path have not been field-tested.
6. **End-to-end tests:** Create isolated nonflight fixtures for safe, unsafe, null, stale, provider failure, manual override, changed mission, expired insurance/certificate, command rejection and concurrent changes. Then perform supervised field trials. No active records exist to validate live transitions.
7. **Weather forecast integration:** `sync_job_weather` v46 preserves missing values and labels hourly forecasts. It has not been exercised with a real authenticated job request after deployment. Forecasts do not establish current site weather for flight clearance.

## Checks run

- At 19:10 UTC, cron `ppd_weather_refresh_30m` reported `succeeded` and refreshed five zones. Its job propagation has no active jobs to test.
- At 19:40 UTC, cron ran; a manual checked refresh at 19:46 UTC returned `updated: 4` and one Glendale error. Glendale's cache was expired and a high-severity event inserted. Cron scheduling now calls the checked wrapper.
- Unknown job/mission, absent forecast, absent telemetry and undirected date checks returned `unknown`, `false`, or a human-review status; no safe result.
- Known 29 mph wind returned `unsafe_wind` even with a missing gust; missing gust with otherwise benign values returned `review_missing_weather`.
- A test `takeoff` command was blocked by the database trigger and no command row was persisted.
- `sync_job_weather` v46 deployed with `verify_jwt=true`; source inspection confirms missing forecast values remain null. No authenticated end-to-end request was available.
- Supabase security advisor was run. Its broader findings are tracked separately; no new public execution grant was introduced by these migrations.

## Change set

- `20261019192500_safety_fail_closed_weather_gates.sql`
- `20261019193000_hold_unverified_flight_commands.sql`
- `20261019193500_propagate_weather_review_to_jobs.sql`
- `20261019194500_safety_checklist_evidence_gate.sql`
- `20261019195000_invalidate_failed_weather_refresh.sql`
- `20261019195500_correct_weather_refresh_event_severity.sql`
- `20261019200000_invalidate_changed_job_safety.sql`
- `20261019200500_bound_low_battery_rth_monitor.sql`
- `supabase/functions/sync_job_weather/index.ts`
- `supabase/functions/Execute-mission-/index.ts`

## Safety dashboard audit follow-up (20:08 UTC)

- Replaced the generic Safety workspace. Its status cards did not filter the queue, its route button linked to itself, and generic task completion had no safety-clearing effect. The dedicated page reads a role-scoped snapshot of weather, jobs, review items, checklists, and safety/weather events.
- Added command-lock, weather coverage, active jobs, open reviews, checklist and alert gauges. Zero jobs and checklists are shown as absent evidence, not safe clearance. NOAA rows show station/forecast provenance, actual observation time, fetch time, expiry, missing readings and a working status filter.
- Added signed-in Safety/owner/admin job hold, review start and rate-limited manual NOAA refresh. Clearance evidence is restricted to active owner/admin and passes through the existing checklist gate. These controls do not authorize drone commands.
- TypeScript and production Next build passed. Live owner-scoped snapshot returned five service areas and zero jobs. Authenticated manual refresh returned five updates, zero failures; the subsequent snapshot classified two locations `review` and three `unsafe_wind`. Anonymous execution grants are absent. Job hold and checklist transitions cannot be exercised end to end until real or isolated test records exist.
- Database migration: `20261019232000_safety_dashboard_controls.sql`; UI: `components/SafetyDashboard.tsx`, its CSS module, and `app/portal/safety/page.tsx`.

## Full Safety department dashboard follow-up (20:23 UTC)

The Safety page now includes pilot Part 107 record and reviewer-recorded recurrent-training currency, pilot insurance and duty holds, aircraft condition/maintenance/registration/Remote ID evidence, flight logs, incidents, fatigue policy and timecard-hour advisories, FAA airspace authorization requests, and the existing mission/weather/checklist controls. The pilot hold and aircraft grounding actions block affected jobs and reject future assignments. Releasing a pilot hold does not automatically clear a job hold.

The official Federal Register FAA/14 CFR Part 107 query is checked daily at 13:15 UTC (06:15 Phoenix). Documents are **candidates for impact review**, not automatically certified changes to operating rules; proposed rules remain labeled as proposals. The initial sync loaded 39 historical candidates. It does not cover all FAA guidance, temporary flight restrictions, NOTAMs or live LAANC decisions. The Safety page links each entry to its source and official PDF when available, records a human impact review, and shows the last successful/failed sync.

Live data at implementation: two suspended test pilot accounts with Part 107 rows but no issued dates or recurrent-training evidence, zero insurance rows, one active drone without service, registration, Remote ID or telemetry evidence, zero flight logs, zero incidents, zero authorization requests, and zero active jobs. These are **unverified/missing**, not safe statuses. Part 107 certificates themselves have no listed expiry; the legacy `pilot_certifications.expiration_date` is deliberately not used as proof of currency. A reviewer may record certificate/training evidence and its 24-calendar-month training window. Company fatigue policy is 8 daily hours, 30 weekly hours, 10 rest hours, but timecards do not establish fitness for duty.

Verified: owner-scoped compliance snapshot returned the above live records; Federal Register sync returned 39 candidates; daily cron exists and is active; anonymous execution grants absent; production build passed. Grounding, incident, pilot currency, aircraft evidence, hold and release RPCs were exercised in rolled-back transactions, then the aircraft, incident, maintenance and hold tables were checked unchanged. No active job existed to exercise assignment-block triggers end to end. No live FAA registry/insurance lookup or aircraft-side preflight integration is claimed. FAA/insurance incident reportability is unassessed until a human reviews the incident; this dashboard does not file reports externally.

Changes: `20261019232500_safety_compliance_dashboard.sql`, `20261019233000_pilot_currency_and_grounding_gate.sql`, `20261019233500_pilot_hold_and_aircraft_evidence.sql`, `components/SafetyCompliancePanel.tsx`, and updated `SafetyDashboard.tsx`/CSS.

Additional gates: `20261019233500_pilot_hold_and_aircraft_evidence.sql` gives Safety a pilot duty hold, owner/admin release (without clearing existing job holds), aircraft registration/Remote ID evidence review, and job assignment triggers for held pilots and grounded aircraft. Both triggers were confirmed enabled. The hold/release and evidence RPCs succeeded within rollback transactions; the hold and evidence tables remained empty afterward. No job exists for an end-to-end assignment test. The dashboard links directly to FAA certification, Remote ID, LAANC, TFR and accident reporting resources; it does not treat those linked pages as an automated compliance verdict.
