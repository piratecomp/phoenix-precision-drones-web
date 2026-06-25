# Phoenix Precision Drones Web V20 — Role Operations Boards

This build continues from V19 and adds the next portal dashboard phase.

## Changes in V20

- Adds dashboard-specific role operations boards.
- Wires frontend dashboards to `ppd_get_role_operations_panel()`.
- Shows controlled workflow cards and rows for delivery packages, pilot verification, review items, finance items, and owner/admin rollups.
- Adds V20 game-HUD styling for role operation boards.
- Keeps V19 command center wiring to `ppd_get_command_center()`.
- Keeps AI approvals gated through `ppd_decide_ai_approval()`.

## Backend phase installed in Supabase

- `ppd_customer_delivery_packages`
- `ppd_pilot_verification_tasks`
- `ppd_safety_review_items`
- `ppd_finance_control_items`
- `ppd_sync_role_operations_panels()`
- `ppd_get_role_operations_panel()`

## Updated frontend files

- `components/PortalDataShell.tsx`
- `lib/portalApi.ts`
- `app/portal-game-v20.css`
- `app/layout.tsx`

## Test routes

- /portal/owner
- /portal/admin
- /portal/customer
- /portal/pilot-w2
- /portal/pilot-network
- /portal/safety
- /portal/finance
- /portal/maintenance
- /login
