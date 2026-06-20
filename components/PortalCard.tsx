import Image from "next/image";
import Link from "next/link";

export default function PortalCard({
  title,
  text,
  image,
  href,
  cta,
}: {
  title: string;
  text: string;
  image: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="preview-card">
      <div className="preview-top">
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
        <Link className="btn btn-primary" href={href}>{cta}</Link>
      </div>
      <div className="preview-shot">
        <Image src={image} alt={title} width={1448} height={1086} />
      </div>
    </article>
  );
}
