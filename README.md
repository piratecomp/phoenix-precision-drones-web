# Phoenix Precision Drones Web V17.5 — Login Layout Refine

This package continues from V17.4 and tightens the portal login layout based on live desktop and iPhone review screenshots.

## Changes in V17.5

- Narrowed the desktop login window so it no longer feels too wide on laptop screens.
- Reworked the login header layout so the emblem remains in the upper-right area.
- Moved the `Team Access` and `Live RPC` pills to sit under the logo as a grouped header element.
- Rebuilt the contour styling so the topo/desert ridge lines render primarily along the bottom of the login window instead of drifting across the top.
- Kept the cleaned-up action area: login plus `Create Customer Account`, with the extra dashboard button stack removed.
- Kept live Supabase Auth login, active-session detection, and role-based redirect behavior intact.

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Test routes

```text
/login
/signup
/portal
/portal/owner
```
