# Phoenix Precision Drones Web - V13 About + Mobile Navigation Fix

This package builds on V12 and keeps the weather-chat phrasing fixes.

## Changed in V13

- Rebuilt `/about` so it explains what Phoenix Precision Drones actually is:
  - AI-assisted commercial drone service platform
  - Construction progress, LiDAR/mapping, inspections, telecom/towers, solar, insurance documentation
  - Customer portal, pilot workflow, and Communication AI operating model
  - Safety/human-review boundaries for regulated or sensitive requests
  - Long-term scalable pilot network direction
- Added mobile primary navigation under the header so mobile users can reach:
  - Services
  - Industries
  - Pilot Network
  - Customer Portal
  - Pilot Dashboard
  - About
  - Contact
- Added CSS for the new About page sections and mobile nav.

## Files changed

- `app/about/page.tsx`
- `components/Nav.tsx`
- `app/globals.css`

## Notes

- No backend/Supabase changes are included in this package.
- No email, AI, queue, or security logic was changed.
- Public branding remains `Phoenix Precision Drones`.
