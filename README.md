# Phoenix Precision Drones Web - V15 Final Public Site Shell

## What changed in V15

V15 rebuilds the public-facing site around the `website-preview.png` mission-control style so the live homepage feels like the final PPD brand direction instead of a temporary informational site.

### Homepage
- Rebuilt hero around the preview image style: black/copper mission-control background, service tiles, portal preview, AI operations sections.
- Added header Login button.
- Kept Request Quote button.
- Kept PPD AI chat widget globally available through the existing layout.
- Added clickable service tiles that route to individual service pages.
- Added portal login CTA and role-based public shell direction.

### Services
- Added a full services directory page.
- Added individual service pages for:
  - `/services/construction-monitoring`
  - `/services/lidar-mapping-surveying`
  - `/services/thermal-inspections`
  - `/services/infrastructure-utility-inspections`
  - `/services/cell-tower-telecom-inspections`
  - `/services/solar-farm-inspections`
  - `/services/insurance-disaster-documentation`
  - `/services/emergency-response-support`
  - `/services/real-estate-marketing-media`
- Each service page includes service explanation, common uses, deliverables, PPD AI workflow, safety notes, and project intake CTA.

### Login
- Rebuilt `/login` as a themed portal access page.
- Includes Customer Login, Pilot Login, and Operations Access cards.
- Login form is intentionally disabled / coming soon until real authentication is wired.
- Public-safe note confirms no private customer, pilot, finance, or operations data is exposed yet.

### Pilot dashboard route
- Added `/pilot-dashboard` public preview page.
- Updated nav/footer to use `/pilot-dashboard` instead of `/dashboard` for the public pilot preview label.
- Existing `/dashboard` page remains in place for backward compatibility.

### Safety / boundaries
- Public wording remains prelaunch-safe.
- The site does not claim active dispatch is live.
- The site does not claim AI approves flights.
- The site does not claim AI directly flies every mission.
- DJI wording remains “AI-assisted planning and command-based workflow support.”

## Notes

This package updates only the website files. It does not change Supabase, website chat SQL, API behavior, authentication, portals, pilot dispatch, payments, or backend operations.

I could not run a full `next build` in this container because `node_modules` are not installed in the runtime. The package keeps the existing project structure and dependency list.
