import type { GuideModule } from "./types";
import { KM_GUIDES } from "./km";
import { ZIKM_GUIDES } from "./zikm";
import { LM_GUIDES } from "./lm";
import { MOIB_GUIDES } from "./moib";
import { AMO_GUIDES } from "./amo";

/** Все работы-инструкции; страница /modules/<slug> строится по этим данным. */
export const GUIDES: GuideModule[] = [...KM_GUIDES, ...ZIKM_GUIDES, ...LM_GUIDES, ...MOIB_GUIDES, ...AMO_GUIDES];

export function guideBySlug(slug: string): GuideModule | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
