# Phoenix Precision Drones Portal Dashboard Rebuild

Updated: 2026-07-03

## Guardrails

- Public website and login screen are not part of this dashboard pass.
- `/portal/*` dashboards use the portal-only shell in `components/SiteShell.tsx`.
- No fake dashboard numbers and no seed/demo data. Zero means no records yet.
- Audit first before scripts or frontend rewrites. Do not create duplicate systems.

## Repository

- GitHub: `piratecomp/phoenix-precision-drones-web`
- Main dashboard routes use `components/PortalDashboardChrome.tsx`.
- Public route shell remains separate from portal route shell.

## Supabase

- Project: `emxgkftxbpoqnmzxwcop`
- New frontend snapshot RPC: `public.ppd_get_dashboard_app_snapshot(p_dashboard_key text)`
- Purpose: one live, read-only dashboard payload for counts, communications, launch, funding, and fleet inspection.
- Owner/admin get executive-scope communication visibility.

## Live counts confirmed during this pass

- Internal message threads: 9
- Internal messages: 18
- Voice call sessions: 33
- Launch checklist items: 16
- Funding applications: 37
- Jobs: 0
- Marketplace pilots: 0
- Drones: 1
- Maintenance logs: 0

## Frontend files added/changed

- `components/PortalOperationsSnapshot.tsx`
- `components/PortalDashboardChrome.tsx`
- `components/DashboardCommandWorkspace.module.css`
- `app/dashboard-shell-v42.css`
- `lib/portalApi.ts`

## What owner can check now

- Internal PPD AI threads/messages
- Voice sessions/follow-up calls
- Communication queue
- Email queue/outbox
- Unified communication events
- Launch checklist
- Funding applications/opportunities
- Fleet/job/pilot counts without fake data

## Current dashboard direction

The dashboard is being moved from webpage panels into an app-style command surface inspired by the uploaded laptop/mobile mockups: orange/black shell, left rail, profile/brand card, app topbar, true metric cards, Phoenix map panel, owner inspector tabs, and mobile bottom nav.

## Next safe steps

- Load `/portal/owner` after deployment.
- Verify the Owner Inspector tabs: PPD AI Comms, Voice, Queues, Launch, Funding, Fleet.
- Extend role-specific widgets only from existing tables/RPCs.
- Do not seed fake jobs, pilots, or fleet data to make mockup numbers look full.
