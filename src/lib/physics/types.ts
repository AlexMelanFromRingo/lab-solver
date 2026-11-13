import type { Lang, Loc } from "@/lib/i18n";
import type { PlotFigure } from "@/lib/figures";

/**
 * Лабораторні з фізики: вимірювання дає студент (на дистанційці — викладач у
 * слайдах і відео), сторінка рахує все, що вимагає таблиця методички.
 * Специфікація роботи: сталі установки, таблиця вимірювань (редагується) і
 * розрахунок, що повертає готові таблиці, підстановку у формули, графіки й висновок.
 */

export interface PhysParam {
  key: string;
  label: Loc;
  value: number;
}

export interface PhysColumn {
  key: string;
  label: Loc;
}

export interface PhysTableOut {
  title: Loc;
  columns: Loc[];
  rows: (string | number)[][];
  note?: Loc;
}

export interface PhysOut {
  tables: PhysTableOut[];
  /** Підстановка у формули — для звіту («розрахунок для досліду 1»). */
  steps?: { title: Loc; lines: string[] }[];
  plots?: { title: Loc; fig: PlotFigure }[];
  conclusion?: Loc[];
}

export interface PhysVariants {
  label: Loc;
  min: number;
  max: number;
  hint: Loc;
  /** Дані варіанта: значення сталих і рядки таблиці вимірювань. */
  pick: (v: number) => { params?: Record<string, number>; rows?: number[][] };
}

export interface PhysLab {
  slug: string;
  /** Звідки дані за замовчуванням (слайди викладача, відео, приклад звіту). */
  dataNote?: Loc;
  params: PhysParam[];
  columns?: PhysColumn[];
  rows?: number[][];
  variants?: PhysVariants;
  compute: (p: Record<string, number>, rows: number[][], lang: Lang) => PhysOut;
}
