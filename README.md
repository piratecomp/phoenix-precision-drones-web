# Phoenix Precision Drones Web V17.3 — Portal Login Game GUI Polish

This package keeps the V17.1 Supabase portal data wiring and the V17.2 login authentication flow, then updates the login experience to better match the Phoenix Precision Drones game-style portal theme.

## Changes

- Removed the owner email placeholder from the login form.
- Removed `Owner / Team Access`; login now says `Team Access`.
- Replaced the banner logo inside the login panel with the emblem logo only.
- Removed the ambiguous `View Portal` visitor button.
- Replaced `Request Access` with `Create Customer Account`.
- Added `/signup` with a customer account creation form using Supabase Auth.
- Added orange desert-ridge/topographic contour styling inside the login panel.
- Kept owner login redirect and live RPC portal routing intact.

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
