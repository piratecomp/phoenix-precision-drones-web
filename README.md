# Phoenix Precision Drones Web V17.4 — Login Topo Layout Polish

This package keeps the V17.1 Supabase portal data wiring and the later login/auth updates, then applies one more pass to the login panel layout and styling.

## Changes in V17.4

- Removed the dashboard access button stack below the login/create-account area.
- Kept only the core login/session actions plus `Create Customer Account`.
- Moved the emblem logo to the top-right area of the login panel.
- Stacked `Team Access` and `Live RPC` on the left above the `Portal Login` title.
- Strengthened the orange topographic / desert ridge background styling inside the login window.
- Kept the emblem-only treatment inside the login panel.
- Kept live Supabase Auth login, active-session detection, and role-based portal redirect behavior intact.

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
