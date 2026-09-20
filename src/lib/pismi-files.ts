"use client";

import { useEffect, useState } from "react";
import type { LabFile } from "@/components/ui/file-set";

/**
 * Опис готових файлів робіт, викладених у public/pismi.
 *
 * Сайт нічого не складає заново: він роздає рівно ті файли, які перевірені
 * запуском. Кожна робота самодостатня – поруч із файлами лежить і архів з
 * усім каталогом.
 */

export interface LabArchive {
  /** Шлях до архіву відносно каталогу роботи. */
  path: string;
  size: number;
}

export interface LabBundle {
  name: string;
  files: LabFile[];
  archive?: LabArchive;
  port?: number;
  admin?: number;
  variant?: number;
}

export interface PismiIndex {
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
