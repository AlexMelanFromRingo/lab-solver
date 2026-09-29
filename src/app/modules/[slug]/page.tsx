import { notFound } from "next/navigation";
import { GuideView } from "@/components/guide-view";
import { GUIDES } from "@/lib/data/guides";

// Статический экспорт: страницы есть только у работ из перечня.
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GUIDES.some((g) => g.slug === slug)) notFound();
  return <GuideView slug={slug} />;
}
