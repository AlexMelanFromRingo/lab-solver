import type { Metadata } from "next";
import { categories, modules } from "@/lib/modules";
import { tr } from "@/lib/i18n";

/** Заголовок вкладки страницы модуля: название работы и дисциплина. */
export function moduleMetadata(slug: string): Metadata {
  const m = modules.find((x) => x.slug === slug);
  if (!m) return {};
  return { title: tr(m.title, "uk"), description: `${tr(categories[m.category].title, "uk")}. ${tr(m.description, "uk")}` };
}
