import { notFound } from "next/navigation";
import { getService } from "@/lib/services";
import { ServicePageTemplate } from "@/components/ServicePageTemplate";

export function generateMetadata() {
  const service = getService("insurance-disaster-documentation");
  if (!service) return { title: "Service | Phoenix Precision Drones" };
  return {
    title: `${service.title} | Phoenix Precision Drones`,
    description: service.hero,
  };
}

export default function ServicePage() {
  const service = getService("insurance-disaster-documentation");
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
