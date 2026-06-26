# PPD Mobile Alerts Setup

PPD does not need Expo for production mobile alerts.

## Architecture

- iOS uses Apple APNs.
- Android uses Firebase Cloud Messaging.
- The app stores each device token in Supabase through `ppd_register_push_device`.
- Backend events queue records in `ppd_notification_outbox` with `channel = 'push'`.
- The worker claims queued records, sends to APNs or FCM, and logs each delivery in `ppd_push_delivery_log`.

## Supabase pieces installed

- `ppd_push_devices`
- `ppd_push_preferences`
- `ppd_push_delivery_log`
- `ppd_register_push_device`
- `ppd_queue_push`
- `ppd_claim_push_outbox`
- `ppd_mark_push_sent`
- `ppd_mark_push_failed`
- `ppd_push_devices_for_user`
- `ppd_log_push_delivery`
- `ppd_disable_push_device`

## App setup overview

1. Ask the user for notification permission.
2. Get APNs token on iOS or FCM token on Android.
3. Call `ppd_register_push_device` after login.
4. Queue notifications with `ppd_queue_push` or through PPD automation.
5. Run the worker to deliver queued alerts.

## Secret values needed later

### Android / FCM

- Firebase project id
- Firebase service account JSON or service account credentials

### iOS / APNs

- Apple Team ID
- Apple Key ID
- APNs Auth Key `.p8`
- Bundle ID
- APNs environment: sandbox or production
