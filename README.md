# Phoenix Precision Drones Web - V16 Hero + Agriculture Services Upgrade

## What changed in V16

V16 updates the public website shell with the new professional hero image and expands the service offering.

### Homepage
- Replaced the cropped platform-preview hero visual with a new custom hero image: `/images/hero-drone-powerline-scan.png`.
- The new hero image shows two drones over desert ridges at sunset: one scanning terrain with a blue LiDAR-style 3D grid and one scanning a power-line tower with thermal-style hotspot visualization.
- Removed the public-facing portal/update section from the homepage so visitors see the site as finished, not as an internal release note.
- Kept the Login button in the header.
- Kept the PPD AI chat experience unchanged.

### Services
- Added Agriculture Drone Services.
- Agriculture coverage includes farm mapping, crop monitoring, crop-health visibility, irrigation/drainage observation, livestock-area documentation, storm/drought records, vegetation/weed-pressure visibility, and regulated spraying/spreading intake.
- Added cautious public wording around drone spraying because agricultural application can require FAA Part 137 authority, waivers or exemptions, aircraft registration, chemical-label compliance, state/local licensing, insurance, drift review, weather review, and human approval.
- Updated Emergency Response Support to include thermal search-and-rescue support language while preserving the emergency-services boundary.

### Service routes
- Explicit route pages are included for every service:
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
- Extra agriculture aliases are also included:
  - `/services/agriculture-drone-spraying`
  - `/services/farm-mapping`

## Notes

This package updates only the website files. It does not change Supabase, website chat SQL, API behavior, authentication, portals, pilot dispatch, payments, or backend operations.

The site remains prelaunch-safe and does not claim the website can approve flights, dispatch pilots, issue insurance documents, approve emergency operations, or approve agricultural spraying.
