import Image from "next/image";
import Link from "next/link";

export default function PortalCard({
  eyebrow,
  title,
  text,
  image,
  href,
  cta,
  highlights,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  href: string;
  cta: string;
  highlights: string[];
}) {
  return (
    <article className="portal-card panel-card">
      <div className="portal-copy">
        <span className="section-kicker">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{text}</p>
        <ul className="mini-list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link className="primary-btn" href={href}>
          {cta}
        </Link>
      </div>
      <div className="screenshot-shell compact-shot">
        <div className="screenshot-track compact-shot-track">
          <Image src={image} alt={title} width={1055} height={1491} className="portal-shot" />
        </div>
      </div>
    </article>
  );
}
