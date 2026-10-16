import type { Metadata } from "next";
import { categories, modules } from "@/lib/modules";

/** Заголовок вкладки страницы модуля: название работы и дисциплина. */
export function moduleMetadata(slug: string): Metadata {
  const m = modules.find((x) => x.slug === slug);
  if (!m) return {};
  return { title: m.title, description: `${categories[m.category].title}. ${m.description}` };
}
