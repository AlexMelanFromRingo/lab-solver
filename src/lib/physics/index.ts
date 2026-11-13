import type { PhysLab } from "./types";
import { MECH_LABS } from "./mech";
import { EM_LABS } from "./em";

export const PHYS_LABS: PhysLab[] = [...MECH_LABS, ...EM_LABS];

export function physLab(slug: string): PhysLab | undefined {
  return PHYS_LABS.find((l) => l.slug === slug);
}
