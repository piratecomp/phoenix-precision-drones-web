# Phoenix Precision Drones Web — V17.1 Portal Data Wiring

This build upgrades the V17 Phase 1 portal shell so the portal can connect to the completed Supabase Phase 1.10 backend.

## What changed in V17.1

- Added Supabase browser client support.
- Added live Supabase Auth login form.
- Added route guard wiring through `portal_check_dashboard_access()`.
- Added dashboard bootstrap wiring through `portal_get_bootstrap()`.
- Added live dashboard modules from `portal_dashboard_modules`.
- Added live quick actions from `portal_quick_actions`.
- Added visible task queue from `portal_get_my_tasks(false)`.
- Added unread notification center from `portal_get_my_notifications(false)`.
- Added profile bridge display from `portal_get_my_entity_links()`.
- Added notification read action using `portal_mark_notification_read()`.
- Added task complete action using `portal_complete_task()`.
- Added fallback preview mode when Supabase public browser env vars are not configured.

## Required Vercel environment variables

Add these in Vercel before testing live login:

```env
NEXT_PUBLIC_SUPABASE_URL=https://emxgkftxbpoqnmzxwcop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

Keep the service role key server-only. Do not expose the service role key to browser code.

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Main portal routes

```text
/portal
/portal/owner
/portal/admin
/portal/finance
/portal/maintenance
/portal/safety
/portal/sales
/portal/pilot-w2
/portal/pilot-network
/portal/observer
/portal/customer
```

## Supabase RPCs used

```text
portal_check_dashboard_access(path)
portal_get_bootstrap(path)
portal_get_my_dashboard_operating_summary(path)
portal_get_my_tasks(false)
portal_get_my_notifications(false)
portal_get_my_entity_links()
portal_mark_notification_read(notification_id)
portal_complete_task(task_id, resolution)
portal_add_task_comment(task_id, comment)
```

## Notes

This build expects the SQL backend through Step 241 to be installed and healthy. The latest confirmed backend health showed `ok: true` with portal roles, dashboards, permissions, modules, quick actions, access guard, operating summaries, entity links, and frontend contract installed.
