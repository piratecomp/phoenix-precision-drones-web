# Phoenix Precision Drones Web - V16.5 Mobile Viewport + Services Fix


## V16.3 changes

- Removed the duplicate agriculture service buttons from the public service grid.
- Kept one Agriculture Drone Services card and folded farm mapping, crop monitoring, spraying/spreading intake, and agricultural documentation into that page.
- Removed the Request a Quote button from the homepage hero because the header already has that CTA.
- Made Explore Services the primary glowing hero button.
- Changed the hero quick pills to Thermal, LiDAR, Photo/Video, and Agriculture.
- Slightly reduced the hero image size on desktop.
- Tightened the technology platform card section so the four boxes are smaller and more balanced.
- Changed the platform section title to “Aviation intelligence and precision data on a technology platform.”
- Reworded visible public copy so it does not sound like an internal build/update page.
- Kept the new desert power-line LiDAR/thermal hero image.
- Kept PPD AI chat and Login.

## Service route notes

The public service grid now links to one Agriculture Drone Services page instead of separate public buttons for spraying and farm mapping.

The agriculture page still describes:
- farm mapping
- crop monitoring
- irrigation/drainage visibility
- vegetation and weed-pressure visibility
- livestock-area and fence-line documentation
- storm/drought records
- regulated drone spraying/spreading/seeding/fertilizer/herbicide/pesticide intake where authorized

## Safety wording

Drone spraying and chemical application remain human-reviewed services and are not approved by website chat.

## V16.4 Mobile Header Logo Fix

- Added `public/images/header-brand-mobile-clean.png` as a mobile-specific wordmark asset.
- Updated `components/Nav.tsx` to use the full combined logo on desktop and the clean mobile wordmark on small screens.
- Added responsive CSS so the mobile header no longer enlarges the emblem artwork or exposes the bright map/mountain panels.
- Shortened the mobile Request Quote button visually to `Quote` so Login and Quote fit on iPhone widths without pushing off-screen.
- Desktop header continues using the full combined brand image.


## V16.5 changes

- Added a Next.js viewport export so mobile browsers use the real device width instead of desktop-scale layout.
- Restored the Phoenix emblem in the mobile header by using the combined brand image again, but scaled it down for mobile.
- Kept the mobile header compact with Login and Quote visible.
- Fixed the mobile services grid so service cards stack cleanly instead of rendering as narrow desktop columns.
- Mobile service cards now use a horizontal card layout with readable text and a compact Open indicator.
