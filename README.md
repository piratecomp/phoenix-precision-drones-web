# Phoenix Precision Drones Web V17.7 — Login Topo Image Refine

This build continues from V17.6 and uses the uploaded desert/topo reference image directly as the bottom background treatment inside the login card.

## Changes in V17.7

- Added the uploaded reference image as `public/images/login-topo-background-v17-7.png`.
- Reworked the login card background to show the desert ridge / topo image on the lower portion of the login window.
- Moved `Team Access` and `Live RPC` under the `Portal Login` title.
- Tightened the login card width again for desktop/laptop screens.
- Kept the logo on the upper-right side of the login card.
- Kept Supabase Auth login, customer account creation, active-session detection, and role-based redirects intact.

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
