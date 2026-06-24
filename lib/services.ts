export type ServiceSlug =
  | "construction-monitoring"
  | "lidar-mapping-surveying"
  | "thermal-inspections"
  | "infrastructure-utility-inspections"
  | "cell-tower-telecom-inspections"
  | "solar-farm-inspections"
  | "insurance-disaster-documentation"
  | "emergency-response-support"
  | "real-estate-marketing-media"
  | "agriculture-drone-services";

export type ServiceDefinition = {
  slug: ServiceSlug;
  title: string;
  shortTitle: string;
  eyebrow: string;
  hero: string;
  summary: string;
  uses: string[];
  deliverables: string[];
  workflow: string[];
  safetyNote: string;
};

export const serviceDefinitions: ServiceDefinition[] = [
  {
    slug: "construction-monitoring",
    title: "Construction Monitoring",
    shortTitle: "Construction",
    eyebrow: "Construction progress intelligence",
    hero: "Aerial progress documentation for jobsites, earthwork, utilities, structures, and stakeholder reporting.",
    summary:
      "Construction monitoring uses recurring drone capture to help owners, contractors, developers, and project teams understand what changed on site without relying only on ground photos or delayed reports.",
    uses: ["Progress photos and video", "Earthwork and grading visibility", "Utility corridor documentation", "Milestone capture", "Stakeholder updates", "Recurring site records"],
    deliverables: ["Aerial photos and video", "Progress documentation packages", "Site overview imagery", "Optional map-ready capture", "Milestone folders", "Customer portal-ready delivery"],
    workflow: ["Collect site location, schedule, access notes, and deliverable needs", "Review weather, access, airspace-sensitive topics, and safety notes", "Match pilot capability and mission requirements", "Capture organized site media", "Deliver files and notes through the customer workflow"],
    safetyNote:
      "Construction sites can have people, equipment, cranes, dust, traffic, and changing hazards. PPD routes safety-sensitive requests for human review before real flight planning.",
  },
  {
    slug: "lidar-mapping-surveying",
    title: "LiDAR Mapping & Surveying Support",
    shortTitle: "LiDAR Mapping",
    eyebrow: "Mapping and terrain intelligence",
    hero: "LiDAR-ready and mapping-focused drone workflows for terrain, site planning, development, and asset visibility.",
    summary:
      "LiDAR and mapping workflows are designed for projects that need more than standard photos. PPD supports structured capture planning, overlap settings, waypoint organization, upload tracking, and mapping deliverable coordination.",
    uses: ["Site planning", "Terrain visibility", "Development documentation", "Right-of-way review", "Earthwork support", "Recurring map updates"],
    deliverables: ["Map-ready aerial capture", "LiDAR-ready workflow support", "Flight logs", "Grid and overlap planning records", "Organized uploads", "Mapping deliverable coordination"],
    workflow: ["Collect boundary and accuracy requirements", "Review altitude, overlap, sidelap, weather, and safety factors", "Prepare mission planning inputs", "Coordinate qualified pilot and capable drone", "Organize uploaded mapping files for processing or delivery"],
    safetyNote:
      "PPD can support mapping workflows, but survey-grade deliverables, legal boundary determinations, and engineering sign-off require qualified professionals where applicable.",
  },
  {
    slug: "thermal-inspections",
    title: "Thermal Inspections",
    shortTitle: "Thermal",
    eyebrow: "Heat signature inspection support",
    hero: "Thermal drone inspection support for roofs, solar assets, utilities, equipment, and structures.",
    summary:
      "Thermal drone inspections use infrared imaging to help identify heat differences, abnormal patterns, and possible problem areas without requiring unsafe access to every surface.",
    uses: ["Solar panel inspection support", "Roof moisture indicators", "Electrical hot spot documentation", "Utility inspection support", "Building heat-loss indicators", "Equipment monitoring"],
    deliverables: ["Thermal imagery", "Standard visual reference imagery", "Issue markers or notes", "Location-linked documentation", "Organized media folders", "Optional repeat inspection workflow"],
    workflow: ["Confirm thermal objective and asset type", "Review weather, time-of-day, access, and safety conditions", "Match a thermal-capable drone and qualified pilot", "Capture thermal and reference imagery", "Organize deliverables for customer review"],
    safetyNote:
      "Thermal results are inspection support and should be reviewed by the appropriate customer, contractor, engineer, adjuster, electrician, roofer, or specialist depending on the issue.",
  },
  {
    slug: "infrastructure-utility-inspections",
    title: "Infrastructure & Utility Inspections",
    shortTitle: "Infrastructure",
    eyebrow: "Hard-to-access asset documentation",
    hero: "Aerial inspection support for utilities, corridors, structures, roads, bridges, and infrastructure assets.",
    summary:
      "Infrastructure and utility inspection workflows help teams document assets from safer vantage points, reduce unnecessary access risks, and organize visual evidence for maintenance or engineering review.",
    uses: ["Utility corridor review", "Bridge and structure documentation", "Roadway and drainage assets", "Pipeline or right-of-way support", "Maintenance planning", "Recurring inspection programs"],
    deliverables: ["Aerial photos and video", "Close-up inspection media", "Location-linked notes", "Asset documentation packages", "Recurring inspection records", "Customer-ready delivery links"],
    workflow: ["Collect asset type, access rules, and restricted-area concerns", "Review airspace, safety, permissions, and weather", "Match pilot, drone, and camera capability", "Capture structured media", "Organize deliverables by asset, location, or issue"],
    safetyNote:
      "Sensitive sites, critical infrastructure, restricted facilities, and utility corridors may require additional authorization, permissions, and human review before real mission planning.",
  },
  {
    slug: "cell-tower-telecom-inspections",
    title: "Cell Tower & Telecom Inspections",
    shortTitle: "Telecom",
    eyebrow: "Telecom asset visibility",
    hero: "Drone documentation support for tower owners, telecom contractors, rooftop assets, and 5G infrastructure.",
    summary:
      "Cell tower and telecom inspection support helps document antennas, mounts, lines, rooftop equipment, tower conditions, and asset changes without requiring unnecessary climbing for every visual check.",
    uses: ["Tower condition documentation", "Antenna and mount visibility", "Rooftop telecom assets", "Pre-work and post-work records", "Recurring site checks", "Contractor documentation"],
    deliverables: ["High-resolution asset imagery", "Video or orbit capture", "Close-up inspection media", "Site overview shots", "Organized asset folders", "Recurring inspection records"],
    workflow: ["Collect site type, access details, asset targets, and customer requirements", "Review airspace, sensitive-site concerns, and safety conditions", "Match qualified pilot and camera capability", "Capture close-up and overview media", "Organize deliverables by tower, asset, or work package"],
    safetyNote:
      "Tower and telecom work can involve restricted access, RF site concerns, height hazards, customer permissions, and airspace review. PPD routes sensitive requests for human review.",
  },
  {
    slug: "solar-farm-inspections",
    title: "Solar Farm Inspections",
    shortTitle: "Solar",
    eyebrow: "Solar asset documentation",
    hero: "Aerial and thermal support for panel fields, solar arrays, site conditions, and maintenance visibility.",
    summary:
      "Solar inspection workflows can combine visual and thermal-ready capture to support maintenance teams, asset managers, and property owners with organized documentation of solar assets.",
    uses: ["Solar panel inspection support", "Thermal anomaly documentation", "Array condition review", "Vegetation or access visibility", "Maintenance planning", "Recurring site records"],
    deliverables: ["Visual aerial imagery", "Thermal-ready inspection capture", "Array overview media", "Issue notes", "Organized uploads", "Repeat inspection records"],
    workflow: ["Collect array size, location, deliverable needs, and access notes", "Review weather, time-of-day, safety, and site conditions", "Match thermal or visual-capable drone requirements", "Capture organized imagery", "Deliver media and notes for customer review"],
    safetyNote:
      "Solar inspections may require customer permission, site access coordination, electrical safety awareness, and specialist review of any suspected system issues.",
  },
  {
    slug: "insurance-disaster-documentation",
    title: "Insurance & Disaster Documentation",
    shortTitle: "Insurance",
    eyebrow: "Condition and recovery documentation",
    hero: "Aerial documentation support for property condition, storm evidence, roof visibility, and post-event records.",
    summary:
      "Insurance and disaster documentation workflows are designed to help customers collect organized aerial evidence after storms, damage, construction events, or property changes.",
    uses: ["Roof and property documentation", "Storm or damage evidence", "Before/after records", "Large property visibility", "Recovery documentation", "Claim-support imagery"],
    deliverables: ["Aerial photos and video", "Roof and property overview imagery", "Damage-area documentation", "Before/after comparison support", "Organized media folders", "Human-reviewed documentation packages"],
    workflow: ["Collect property details, damage area, timing, and documentation goals", "Review access, weather, safety, and authorization", "Capture aerial evidence", "Organize media by location and issue", "Prepare deliverables for customer review"],
    safetyNote:
      "PPD can help document conditions, but it does not make coverage decisions, legal determinations, engineering conclusions, or insurance claim approvals.",
  },
  {
    slug: "emergency-response-support",
    title: "Emergency Response & Thermal Search Support",
    shortTitle: "Emergency Support",
    eyebrow: "Authorized emergency documentation and thermal search support",
    hero: "Drone documentation and thermal search-and-rescue support for authorized response, disaster recovery, incident documentation, and large-area visibility.",
    summary:
      "Emergency response support is positioned carefully as authorized aerial visibility and documentation support. Thermal-equipped drones can assist qualified teams with search-area visibility, heat-signature awareness, disaster documentation, and post-incident records when proper authorization and command coordination are in place. The website chat is not an emergency dispatch system.",
    uses: ["Thermal search-and-rescue support", "Disaster documentation", "Post-incident visibility", "Recovery site records", "Authorized agency or contractor support", "Damage overview imagery", "Large-area documentation", "Night or low-visibility thermal support where allowed"],
    deliverables: ["Aerial photos and video", "Thermal imagery when appropriate", "Site overview media", "Condition documentation", "Location-linked files", "Recovery records", "Organized delivery packages"],
    workflow: ["Confirm this is not an active life-safety emergency through website chat", "Route emergency or safety-sensitive requests for human review", "Confirm authorization, incident command coordination, and site conditions", "Coordinate appropriate pilot, thermal-capable equipment, and safety requirements", "Capture and organize documentation for authorized review"],
    safetyNote:
      "If there is an active emergency, life-safety issue, fire, medical emergency, police matter, rescue situation, missing person, or search-and-rescue event, contact emergency services or the proper public authority immediately. Drone support must be coordinated through authorized response channels.",
  },

  {
    slug: "agriculture-drone-services",
    title: "Agriculture Drone Services",
    shortTitle: "Agriculture",
    eyebrow: "Farm mapping, crop monitoring, and regulated spraying support",
    hero: "Drone support for farms, ranches, fields, irrigation visibility, crop health mapping, livestock-area documentation, storm records, and regulated agricultural spraying intake.",
    summary:
      "Agriculture drone services give growers, ranchers, land managers, and agricultural contractors a clearer view of field conditions from above. PPD supports farm mapping, crop monitoring, irrigation and drainage visibility, plant stand observation, vegetation and weed-pressure documentation, livestock-area and fence-line documentation, storm or drought records, and regulated spraying or spreading intake where authorization allows.",
    uses: ["Farm and field mapping", "Crop health and stress indicators", "Irrigation and drainage visibility", "Plant count or stand assessment support", "Vegetation and weed-pressure visibility", "Fence-line, livestock-area, and access-road documentation", "Storm, drought, and damage records", "Repeat field monitoring", "Targeted drone spraying, spreading, seeding, fertilizer, herbicide, or pesticide application intake where properly authorized"],
    deliverables: ["Aerial field imagery", "Map-ready capture", "Field condition documentation", "Issue-area notes", "Before/after comparison support", "Repeat monitoring records", "Crop, irrigation, and access observations", "Spraying project intake summary for human review", "Weather and drift review checklist for regulated application requests"],
    workflow: ["Collect field boundary, crop type, acreage, access notes, and project goals", "Determine whether the request is mapping, monitoring, documentation, livestock-area visibility, or regulated application", "Review weather, wind, sun angle, temperature, surrounding properties, water, roads, structures, and site safety", "Match pilot, drone, camera, payload, and authorization requirements", "Capture organized field imagery or route regulated application requests for human review", "Deliver files, notes, and follow-up tasks for grower or land-manager review"],
    safetyNote:
      "Farm mapping and crop monitoring are documentation-support services. Agricultural spraying, seeding, spreading, pesticide, herbicide, fertilizer, or chemical dispensing can be regulated and may require FAA Part 137 authority, waivers or exemptions, aircraft registration, chemical-label compliance, state/local licensing, insurance, drift review, weather review, site permission, pilot qualifications, and human approval. Website chat cannot approve agricultural spraying.",
  },
  {
    slug: "real-estate-marketing-media",
    title: "Real Estate & Marketing Media",
    shortTitle: "Real Estate",
    eyebrow: "Aerial media for property and development marketing",
    hero: "Polished aerial photo and video support for listings, land, commercial properties, developments, and marketing packages.",
    summary:
      "Real estate and marketing media use aerial capture to show property scale, access, surrounding features, land context, building layout, and visual impact for sales or promotional needs.",
    uses: ["Residential listings", "Commercial properties", "Land and development sites", "Marketing packages", "Progress marketing", "Website and social media assets"],
    deliverables: ["Aerial photos", "Aerial video", "Edited media options", "Property overview shots", "Delivery links", "Optional recurring media packages"],
    workflow: ["Collect property details, media goals, timing, and access notes", "Review airspace, weather, and site safety", "Plan shot list and flight approach", "Capture media", "Deliver files for marketing use"],
    safetyNote:
      "Some properties may involve people, neighboring structures, restricted areas, or airspace concerns that require review before flight.",
  },
];

export function getService(slug: string) {
  return serviceDefinitions.find((service) => service.slug === slug);
}
