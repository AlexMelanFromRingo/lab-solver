import type { GuideModule } from "./types";
import { KM_GUIDES } from "./km";
import { ZIKM_GUIDES } from "./zikm";
import { LM_GUIDES } from "./lm";
import { MOIB_GUIDES } from "./moib";
import { AMO_GUIDES } from "./amo";
import { KDM_GUIDES } from "./kdm";
import { TEMK_GUIDES } from "./temk";
import { OOP_GUIDES } from "./oop";
import { SPZ_GUIDES } from "./spz";
import { KS_GUIDES } from "./ks";
import { PZZK_GUIDES } from "./pzzk";
import { PP_GUIDES } from "./pp";
import { PLIS_GUIDES } from "./plis";
import { MPS_GUIDES } from "./mps";
import { DB_GUIDES } from "./db";
import { AKS_GUIDES } from "./aks";
import { KFS_GUIDES } from "./kfs";
import { CISCO_M1 } from "./cisco-m1";
import { CISCO_M3 } from "./cisco-m3";
import { CISCO_M4 } from "./cisco-m4";
import { CISCO_M5 } from "./cisco-m5";

/** Все работы-инструкции; страница /modules/<slug> строится по этим данным. */
export const GUIDES: GuideModule[] = [...KM_GUIDES, ...ZIKM_GUIDES, ...LM_GUIDES, ...MOIB_GUIDES, ...AMO_GUIDES, ...KDM_GUIDES, ...TEMK_GUIDES, ...OOP_GUIDES, ...SPZ_GUIDES, ...KS_GUIDES, ...PZZK_GUIDES, ...PP_GUIDES, ...PLIS_GUIDES, ...MPS_GUIDES, ...DB_GUIDES, ...AKS_GUIDES, ...KFS_GUIDES, ...CISCO_M1, ...CISCO_M3, ...CISCO_M4, ...CISCO_M5];

export function guideBySlug(slug: string): GuideModule | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
