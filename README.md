# Phoenix Precision Drones Website — V17.2 Login GUI Polish

This package is based on V17.1 Portal Data Wiring and keeps the successful Supabase Auth / portal RPC connection.

## What changed in V17.2

- Reworked `/login` so it looks more like the Phoenix Precision Drones website theme.
- Added the Phoenix Precision Drones header logo inside the login panel.
- Removed the technical description explaining Supabase Auth / route guard behavior.
- Replaced the older text-heavy login layout with a tighter GUI-style secure portal card.
- Added compact portal-area cards for Customer, Pilot, and Operations access.
- Kept live portal login wiring intact:
  - Supabase Auth sign-in
  - `portal_get_bootstrap()` dashboard routing
  - `/portal/owner` redirect for the owner account

## Required Vercel environment variables

These must remain configured in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Deployment

Upload this project/package to Vercel or push it to the connected GitHub repo, then redeploy.

Recommended first deploy:

```text
Redeploy with existing Build Cache
```

If the build fails from stale cache:

```text
Redeploy with Clear Build Cache
```
