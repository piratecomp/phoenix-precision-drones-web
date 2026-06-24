import { notFound } from "next/navigation";
import { serviceDefinitions, getService } from "@/lib/services";
import { ServicePageTemplate } from "@/components/ServicePageTemplate";

type ServicePageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export function generateStaticParams() {
  return serviceDefinitions.map((service) => ({ slug: service.slug }));
}

export const dynamicParams = false;

async function resolveSlug(params: ServicePageProps["params"]) {
  const resolved = await params;
  return resolved.slug;
}

export async function generateMetadata({ params }: ServicePageProps) {
  const slug = await resolveSlug(params);
  const service = getService(slug);
  if (!service) return { title: "Service | Phoenix Precision Drones" };
  return {
    title: `${service.title} | Phoenix Precision Drones`,
    description: service.hero,
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const slug = await resolveSlug(params);
  const service = getService(slug);
  if (!service) notFound();

  return <ServicePageTemplate service={service} />;
}
