import { RadioTower, Building2, Camera, Flame, Map, ShieldCheck } from "lucide-react";

const items = [
  ["Construction Progress", "Recurring aerial progress documentation, jobsite visibility, stakeholder updates, and timeline capture.", Building2],
  ["Cell Tower Inspections", "Inspection support for telecom towers, rooftop communication assets, and cellular infrastructure projects.", RadioTower],
  ["Aerial Mapping Support", "Orthomosaic capture support, route overlays, acreage visibility, and planning intelligence.", Map],
  ["Roof & Property Inspections", "Safer aerial review for roofs, structures, insurance support, and difficult-access property conditions.", ShieldCheck],
  ["Thermal & Solar Support", "Thermal-ready workflows for solar arrays, infrastructure, roofs, and specialty inspection projects.", Flame],
  ["Real Estate Photo & Video", "Aerial media for residential, commercial, land, and development marketing.", Camera],
];

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill">Services</span>
          <h1><span className="gradient">Commercial drone services</span> with contract-ready positioning.</h1>
          <p className="lead">Phoenix Precision Drones is structured around repeatable service lines that support construction, telecom, property inspection, mapping, thermal capture, and media workflows.</p>
        </div>
      </section>
      <section className="section">
        <div className="container cards">
          {items.map(([title, text, Icon]: any) => (
            <article className="card" key={title}>
              <div className="iconbox"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
