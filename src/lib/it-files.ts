"use client";

import { useEffect, useState } from "react";
import type { LabFile } from "@/components/ui/file-set";

/**
 * Описание готовых файлов работ по ИТ, выложенных в public/it.
 *
 * Файлы кладёт скрипт tools/export_to_site.py из рабочего репозитория курса:
 * имена в них заменены, отчёт собран заново с вымышленным студентом,
 * результаты PyTorch и TensorFlow взяты из results.json, которые пишут сами
 * скрипты после прогона. Скрипт заменяет только каталог lab3 и одноимённый
 * ключ в index.json — у первых двух работ файлов нет, они считаются на месте.
 */

export interface StageResult {
  correct: number;
  total: number;
  per_class: Record<string, string>;
  errors: string[];
}

export interface CodeStage {
  stage: string;
  train_images: number;
  seconds: number;
  train: StageResult;
  validation: StageResult;
  extra_before_adding?: StageResult;
}

export interface CodeRun {
  framework: string;
  device: string;
  epochs: number;
  seed: number;
  stages: CodeStage[];
}

export interface LobeStage {
  stage: string;
  mode: string;
  train: string;
  validation: string;
}

export interface ItIndex {
  lab3: {
    files: LabFile[];
    report: { path: string; pages: number; size: number };
    results: {
      lobe: LobeStage[];
      /** «доповнення» как новые картинки для модели Lobe в режиме точности */
      lobe_extra_before_adding: { correct: number; total: number };
      pytorch: CodeRun;
      tensorflow: CodeRun;
    };
  };
}

/** Адрес относительный: сайт живёт под /lab-solver на GitHub Pages и в корне локально. */
export function useItIndex(): ItIndex | null {
  const [index, setIndex] = useState<ItIndex | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("../../it/index.json")
      .then((r) => r.json())
      .then((data: ItIndex) => {
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
