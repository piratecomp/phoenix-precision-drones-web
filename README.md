# Phoenix Precision Drones Web V17.6 — Login Topo Match

This build continues from V17.5 and tightens the portal login visual to better match the desired desert-ridge / topo contour style.

## Changes in V17.6

- Rebuilt the login window background contours to better resemble a **desert landscape with terrain-following topo lines**.
- Kept the contour treatment concentrated toward the **bottom portion of the login window** instead of drifting across the full card.
- Forced the **Team Access** and **Live RPC** chips into a true **side-by-side row** under the logo.
- Further tightened the desktop composition so the login window remains more balanced on laptop screens.
- Preserved the mobile-friendly login form, customer account creation CTA, live Supabase Auth flow, and role-based portal redirects.

## New asset

- `public/images/login-topo-ridge-v17-6.svg`

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
