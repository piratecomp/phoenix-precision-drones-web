# Phoenix Precision Drones Web V28 — Quote Pipeline UI + Backend Function Audit

This build continues the production-grade portal rollout with quote review and acceptance UI.

## Backend added in Supabase

- `ppd_get_sales_pipeline_panel()`
- `ppd_generate_quote_from_intake()`
- `ppd_process_quote_pipeline()`
- `ppd_accept_quote_and_create_job()`
- `ppd_customer_accept_quote()`
- `ppd_quote_job_pipeline_audit()`

## Frontend pushed

- `components/QuotePipelinePanel.tsx`
- `app/quote-pipeline-v28.css`
- `lib/portalApi.ts`
- `components/PortalDataShell.tsx`
- `app/layout.tsx`

## Quote flow now supported

- Incoming communication can become quote intake.
- Quote intake can generate a quote draft.
- Portal dashboards can display visible quotes.
- Owner/Admin/Sales can accept a quote and create a gated job.
- Matching customer can accept their own quote.
- Accepted quote creates a job, safety checklist, invoice draft, internal AI message, and customer email queue.
- Dispatch remains blocked behind safety, scheduling, and manual approval.

## Backend function audit started

The backend function inventory shows many extension functions plus a large app-function catalog. Initial app-function audit found these main cleanup groups:

- New controlled PPD/portal functions
- Quote/job/dispatch legacy functions
- Communication legacy functions
- Drone/mission legacy functions
- AI orchestration functions
- Funding/grants functions
- Uncategorized legacy functions

High-priority cleanup targets include overloaded functions, duplicate route/dispatch functions, old communication senders, direct drone/mission command functions, and destructive maintenance functions.

## Test routes

- /
- /contact
- /apply
- /login
- /portal/owner
- /portal/admin
- /portal/customer
- /portal/sales
- /portal/finance
- /portal/safety
