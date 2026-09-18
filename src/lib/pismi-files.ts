"use client";

import { useEffect, useState } from "react";
import type { LabFile } from "@/components/ui/file-set";

/**
 * Опис готових файлів робіт, викладених у public/pismi.
 *
 * Файли туди кладе скрипт solver/export_to_site.py з робочого сховища курсу:
 * сайт роздає рівно ті файли, які там зібрані генератором і перевірені
 * запуском, а не складає їх заново за іншим кодом.
 */

export interface LabBundle {
  name: string;
  files: LabFile[];
  port?: number;
  admin?: number;
  variant?: number;
}

export interface PismiIndex {
  shared: LabFile[];
  lab1: LabBundle;
  lab2: LabBundle[];
  lab3: LabBundle;
  lab4: LabBundle;
  lab5: LabBundle;
}

/**
 * Читає опис складу. Адреса відносна: сайт живе під /lab-solver на GitHub
 * Pages і в корені під час локальної збірки, а відносний шлях правильний в
 * обох випадках.
 */
export function usePismiIndex(): PismiIndex | null {
  const [index, setIndex] = useState<PismiIndex | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("../../pismi/index.json")
      .then((r) => r.json())
      .then((data: PismiIndex) => {
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
