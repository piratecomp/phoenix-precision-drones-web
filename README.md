# Phoenix Precision Drones Web V18 — Homepage Simplification

This package continues from V17.9 and shortens the public homepage so the site feels more like a premium landing page instead of a long brochure.

## Changes in V18

- Shortened the homepage to five focused sections:
  1. Hero
  2. Service snapshot
  3. Portal/workspace strip
  4. Trust/operations strip
  5. Final call-to-action
- Moved longer explanations off the homepage and into linked detail pages.
- Kept service cards clickable and routed to the existing service pages.
- Kept portal links routed to Customer Portal, Pilot Dashboard, and Portal.
- Kept the current login page, Supabase Auth wiring, owner portal redirect, and portal backend integration intact.
- Added V18 homepage-specific CSS for shorter, cleaner sections.

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Test routes

```text
/
 /services
/customer-portal
/pilot-dashboard
/login
/portal/owner
```

## Notes

The deeper service, industry, pilot-network, customer-portal, and portal details remain available on linked pages. The homepage is now meant to answer quickly:

- What PPD does
- Who it helps
- Why it is different
- Where visitors should click next
