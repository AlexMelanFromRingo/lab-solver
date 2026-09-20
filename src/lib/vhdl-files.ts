"use client";

import { useEffect, useState } from "react";
import type { LabFile } from "@/components/ui/file-set";

/**
 * Опис файлів схеми, викладених у public/vhdl.
 *
 * Джерела взяті зі сховища vhdl-rc4: там п'ять шифрів, кожен із перевіркою
 * за опублікованими контрольними векторами. Сюди покладено ті два, про які
 * цей модуль, і спільний пакет, без якого вони не збираються.
 */

export interface VhdlIndex {
  files: LabFile[];
  archive?: { path: string; size: number };
}

export function useVhdlIndex(): VhdlIndex | null {
  const [index, setIndex] = useState<VhdlIndex | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("../../vhdl/index.json")
      .then((r) => r.json())
      .then((data: VhdlIndex) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}
