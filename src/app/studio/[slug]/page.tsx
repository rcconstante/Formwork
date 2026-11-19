import { notFound } from "next/navigation";
import Studio from "@/components/studio";
import { features } from "@/lib/features";

const studioPages = features.filter((feature) => "slug" in feature);

export function generateStaticParams() {
  return studioPages.map(({ slug }) => ({ slug }));
}

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = studioPages.find((item) => item.slug === slug);
  if (!feature) notFound();
  return <Studio key={slug} section={feature.slug} />;
}

