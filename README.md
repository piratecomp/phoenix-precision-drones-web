# Phoenix Precision Drones Web V17.8 — Login Topo Desktop Align

This build continues from V17.7 and addresses the latest login-page feedback.

## Changes in V17.8

- Moves the logo left so it sits immediately beside the `Portal Login` title on desktop, matching the tighter mobile feel.
- Keeps `Team Access` and `Live RPC` under the title.
- Uses the uploaded topo/desert reference image directly again as the bottom login-card background (`public/images/login-topo-background-v17-8.png`).
- Increases topo image visibility and scales it so the ridge/background art reads more clearly.
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
