# Phoenix Precision Drones Web - V16.6 Mobile Header Logo Correction

## What changed in V16.6

- Added a cleaned mobile combined header logo:
  - `/public/images/header-brand-mobile-combined-clean.png`
- Mobile now keeps the phoenix/drone emblem and the Phoenix Precision Drones wordmark together in one combined image.
- The bright white/blue map-panel area in the mobile emblem has been darkened/tinted so it no longer looks like a missed transparent background on iPhone.
- Desktop still uses the original combined header image that already looked good on laptop.
- Mobile CSS now swaps to the cleaned mobile combined image only on small screens.
- Mobile logo sizing was tightened so the emblem remains visible without dominating the header.

## Notes

This update only changes the header logo asset, navigation image rendering, and CSS. It does not change Supabase, webchat, authentication, API routes, service routes, or backend behavior.


## V16.7 mobile header double-logo fix

- Fixed the iPhone header showing both the desktop logo image and the mobile logo image at the same time.
- Added final CSS overrides so desktop shows only `desktop-header-logo` and mobile shows only `mobile-header-logo`.
- Kept the cleaned mobile combined logo with emblem + wordmark.
- Left desktop layout unchanged.
