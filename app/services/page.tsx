import { Building2, Camera, Flame, Map, ShieldCheck, RadioTower } from "lucide-react";

const items = [
  ["Construction Progress", "Recurring drone capture for construction documentation, owner updates, progress comparisons, and project visibility.", Building2],
  ["Aerial Mapping Support", "Mission planning and aerial capture workflows for site maps, routes, acreage, stockpile views, and planning support.", Map],
  ["Roof & Property Inspections", "Safer aerial inspection support for roofs, structures, insurance documentation, property conditions, and hard-to-access areas.", ShieldCheck],
  ["Thermal & Solar Support", "Thermal-ready drone workflows for solar panel review, building envelope checks, and infrastructure inspection support.", Flame],
  ["Real Estate Photo & Video", "Aerial imagery for listings, land, commercial property, developments, and marketing campaigns.", Camera],
  ["Emergency Response Support", "Rapid aerial situational awareness support for public safety, incidents, storm response, and damage documentation.", RadioTower],
];

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Services</span>
        <h1><span className="gradient-text">Commercial drone services</span> with a platform-first approach.</h1>
        <p className="lead">Phoenix Precision Drones is built to provide professional aerial data and inspection services while scaling into a full AI-assisted mission operations platform.</p>
      </section>
      <section className="section">
        <div className="cards">
          {items.map(([title, body, Icon]: any) => (
            <article className="card" key={title}>
              <div className="icon"><Icon /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
