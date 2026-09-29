import type { GuideModule } from "./types";
import { KM_GUIDES } from "./km";

/** Все работы-инструкции; страница /modules/<slug> строится по этим данным. */
export const GUIDES: GuideModule[] = [...KM_GUIDES];

export function guideBySlug(slug: string): GuideModule | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
