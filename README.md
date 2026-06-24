# Phoenix Precision Drones Web - V16.3 Vercel Services Build Fix

This package fixes the Vercel build failure on `/services` from V16.2.

## Fix

The `/services` page renders one icon component for each service in `lib/services.ts`. V16.2 added these new service slugs:

- `agriculture-drone-spraying`
- `farm-mapping`

But the `/services` icon map did not include those two slugs, so the icon component was `undefined`. During prerender, Next.js threw:

`Element type is invalid: expected a string ... but got: undefined.`

V16.3 adds icons for both missing slugs and also adds a safe fallback icon.

## Still included

- V16.2 tightened desktop layout.
- New custom desert / powerline / LiDAR / thermal hero image.
- Removed public portal update section.
- Explicit service route pages only.
- Agriculture services and drone spraying intake.
- Farm mapping and crop monitoring.
- Emergency response with thermal search-and-rescue support.

## Upload

Replace the current project files with this package and redeploy on Vercel.
