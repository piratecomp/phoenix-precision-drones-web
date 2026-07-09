# Phoenix Precision Drones Portal Dashboard Rebuild

Updated: 2026-07-03

## Guardrails

- Public website and login screen are not part of this dashboard pass.
- `/portal/*` dashboards use the portal-only shell in `components/SiteShell.tsx`.
- No fake dashboard numbers and no seed/demo data. Zero means no records yet.
- Audit first before scripts or frontend rewrites. Do not create duplicate systems.
- Customer dashboard must never show owner/internal communications, funding, launch, or admin operations.

## Repository

- GitHub: `piratecomp/phoenix-precision-drones-web`
- Main internal dashboard routes use `components/PortalDashboardChrome.tsx`.
- Customer route is now standalone through `components/CustomerPortalDashboard.tsx`.
- Public route shell remains separate from portal route shell.

## Supabase

- Project: `emxgkftxbpoqnmzxwcop`
- Internal dashboard snapshot RPC: `public.ppd_get_dashboard_app_snapshot(p_dashboard_key text)`
- Customer dashboard snapshot RPC: `public.ppd_get_customer_dashboard_snapshot(p_customer_id uuid)`
- Customer intake submit RPC: `public.ppd_customer_submit_quote_intake(p_payload jsonb)`
- Customer resolver RPC: `public.ppd_resolve_customer_for_portal(p_customer_id uuid)`
- Owner/admin can preview a selected customer safely. Actual customer users are resolved by customer link or matching email.

## Live counts confirmed during the owner/dashboard pass

- Internal message threads: 9
- Internal messages: 18
- Voice call sessions: 33
- Launch checklist items: 16
- Funding applications: 37
- Jobs: 0
- Marketplace pilots: 0
- Drones: 1
- Maintenance logs: 0

## Customer portal backend counts confirmed before rebuild

- Customers: 4
- Jobs: 0
- Quotes: 0
- Quote intakes: 0
- Deliverables: 0
- Customer deliverables: 0
- Customer delivery packages: 0
- Invoices: 0
- Invoice pipeline: 0

## Frontend files added/changed

- `components/PortalOperationsSnapshot.tsx`
- `components/PortalDashboardChrome.tsx`
- `components/CustomerPortalDashboard.tsx`
- `components/CustomerPortalDashboard.module.css`
- `components/DashboardCommandWorkspace.module.css`
- `app/dashboard-shell-v42.css`
- `app/portal/customer/page.tsx`
- `lib/portalApi.ts`

## What owner can check now

- Internal PPD AI threads/messages
- Voice sessions/follow-up calls
- Communication queue
- Email queue/outbox
- Unified communication events
- Launch checklist
- Funding applications/opportunities
- Fleet/job/pilot counts without fake data

## What customers can check now

- Submit a new job request from the dashboard
- See requests, quotes, active jobs, deliverables, and invoices scoped to their customer record
- Accept released quotes when logged in as a customer
- Download released delivery packages when a public URL exists
- Owner/admin preview is read-only and uses a customer selector instead of owner data

## Current dashboard direction

Internal dashboards follow an app-style command surface inspired by the uploaded laptop/mobile mockups: orange/black shell, left rail, profile/brand card, app topbar, true metric cards, Phoenix map panel, owner inspector tabs, and mobile bottom nav.

Customer dashboard is a separate one-screen app surface: request job, quote approvals, status timeline, recent requests, deliverables, invoices, and support controls. It is intentionally simpler than internal dashboards.

## Next safe steps

- Load `/portal/customer` as owner and verify customer selector appears without owner/internal data.
- Select one of the existing customer records and confirm counts remain zero until real customer records exist.
- Test actual customer login later with a non-suspended customer user.
- Add payment provider link and file upload flow only after auditing current storage/payment tables.
- Do not seed fake jobs, pilots, or fleet data to make mockup numbers look full.
