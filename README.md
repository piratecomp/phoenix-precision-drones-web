# Phoenix Precision Drones Web V17.9 — Login Topo Hero Background

This build continues from V17.8 and addresses the latest login-page feedback.

## Changes in V17.9

- Rebuilds the login header so the title and logo align on the same row on desktop like the mobile version.
- Moves the `Team Access` and `Live RPC` chips directly under the title to remove the big vertical gap.
- Uses the newly provided reference hero image as the basis for the login card background, cropped to the lower canyon/topographic portion so the background art is visible without the large text banner.
- Keeps the card width tight on desktop and preserves the existing mobile sizing.
- Keeps Supabase Auth login, customer account creation, and portal redirects intact.

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
