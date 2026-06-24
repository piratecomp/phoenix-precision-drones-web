# Phoenix Precision Drones Web - V16.1 Tight Desktop Layout Fix

## What changed in V16.1

V16.1 tightens the desktop/laptop layout after live review of the V16 homepage.

### Homepage / hero

- Reduced the desktop header height so the logo, nav, Login, and Request Quote buttons take less vertical space.
- Reduced desktop headline size so the left hero text no longer overwhelms laptop screens.
- Changed the hero headline to: **Commercial drone intelligence powered by AI.**
- Removed the mockup/dashboard frame treatment around the hero image.
- The new drone/desert/powerline LiDAR + thermal image is now treated as a cinematic hero image instead of a platform-preview card.
- Removed public-facing update/portal shell language.
- Added compact hero service pills for Thermal, LiDAR, Utilities, and Agriculture.

### Services

- Kept clickable service cards.
- Added Agriculture Drone Services.
- Added separate Agriculture Drone Spraying Intake service page.
- Added separate Farm Mapping & Crop Monitoring service page.
- Emergency Response includes thermal search-and-rescue support with public-safety boundaries.

### Routes included

- `/services/construction-monitoring`
- `/services/lidar-mapping-surveying`
- `/services/thermal-inspections`
- `/services/infrastructure-utility-inspections`
- `/services/cell-tower-telecom-inspections`
- `/services/solar-farm-inspections`
- `/services/insurance-disaster-documentation`
- `/services/emergency-response-support`
- `/services/real-estate-marketing-media`
- `/services/agriculture-drone-services`
- `/services/agriculture-drone-spraying`
- `/services/farm-mapping`

### Safety language

- Drone spraying is described as a regulated, human-reviewed intake path.
- Website chat and the public site do not approve chemical application, Part 137 operations, airspace-sensitive flights, emergency operations, or insurance documents.
- DJI wording remains AI-assisted planning and command-based workflow support, not uncontrolled autonomous flight approval.

## Deployment note

If any `/services/...` route still returns 404 after deployment, the deployed project is not receiving the nested route folders under `app/services/.../page.tsx`. Confirm those folders exist in the deployed GitHub/Vercel source.

