# Phoenix Precision Drones Web V19 — Portal Game UI System

This build continues from V18.1 and begins the full portal dashboard transformation into a game-style command center UI.

## Changes in V19

- Adds live Owner/Admin command-center wiring to `ppd_get_command_center()`.
- Adds AI approval queue controls wired to `ppd_decide_ai_approval()`.
- Adds a game HUD style for portal dashboards: orange/black panels, glowing borders, stat cards, map/dispatch feel, and compact mobile behavior.
- Adds a live operations map-style panel for owner/admin dashboards.
- Keeps all dangerous drone/dispatch/mission actions behind approval gates.
- Keeps the existing portal bootstrap, tasks, notifications, route guards, login, and customer signup intact.

## New/updated frontend files

- `components/PortalDataShell.tsx`
- `lib/portalApi.ts`
- `app/portal-game-v19.css`
- `app/layout.tsx`

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Test routes

```text
/portal/owner
/portal/admin
/portal/maintenance
/portal/safety
/portal/finance
/portal/pilot-network
/portal/pilot-w2
/login
```
