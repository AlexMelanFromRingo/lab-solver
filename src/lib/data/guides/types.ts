import type { Loc } from "@/lib/i18n";
import type { LabGuide } from "@/lib/data/pismi-labs";
import type { RegScheme } from "@/lib/algorithms/aks-schemes";
import type { FlowChart } from "@/lib/algorithms/flowchart";
import type { PhasorFigure, PlotFigure, TimingFigure } from "@/lib/figures";
import type { Drawing } from "@/lib/drawing";

/**
 * Работа-инструкция: лабораторная, которая делается в программе (Packet Tracer,
 * СУБД, среда разработки), а не сводится к одной формуле. Страница строится из
 * этих данных: что посчитать по варианту, порядок по методичке, что снять,
 * состав отчёта и что должно получиться.
 */

export interface GuideTable {
  title: Loc;
  columns: Loc[];
  rows: (Loc | number)[][];
  note?: Loc;
  /** Записи таблиці: не переносити значення в клітинках (телефони, суми), таблиця прокручується. */
  nowrap?: boolean;
}

export interface GuideCode {
  title: Loc;
  /** Команды или текст для копирования как есть. */
  code: string;
  note?: Loc;
}

/** Рисунок, який вимагає звіт (структурна схема, блок-схема тощо), — будується під варіант. */
export type GuideFigure =
  | { kind: "regs"; title: Loc; scheme: RegScheme; note?: Loc }
  | { kind: "flow"; title: Loc; chart: FlowChart; note?: Loc }
  | { kind: "plot"; title: Loc; plot: PlotFigure; note?: Loc }
  | { kind: "phasor"; title: Loc; phasor: PhasorFigure; note?: Loc }
  | { kind: "drawing"; title: Loc; drawing: Drawing; note?: Loc }
  | { kind: "timing"; title: Loc; timing: TimingFigure; note?: Loc };

export interface GuideComputed {
  tables?: GuideTable[];
  figures?: GuideFigure[];
  code?: GuideCode[];
  notes?: Loc[];
  /** Готовый текст программы важнее таблиц — показать блоки кода сразу после данных варианта. */
  codeFirst?: boolean;
}

/** Дополнительное число, которое методичка оставляет на выбор студента (первый член, число элементов…). */
export interface GuideParam {
  key: string;
  label: Loc;
  min: number;
  max: number;
  value: number;
}

export interface GuideVariant {
  /** Как называется номер в методичке: «варіант», «x», «v». */
  label: Loc;
  min: number;
  max: number;
  /** Откуда берётся номер — пересказ методички. */
  hint: Loc;
  params?: GuideParam[];
  compute: (v: number, p: Record<string, number>) => GuideComputed;
}

/** Ответ на «поясніть» из методички — то, что должно получиться. */
export interface GuideFinding {
  title: Loc;
  body: Loc;
}

export interface GuideModule {
  slug: string;
  /** Короткое вступление: что это за работа и что даёт страница. */
  intro: Loc;
  guide: LabGuide;
  variant?: GuideVariant;
  /** Расчёт без варианта: задание одно на всех (как в ЛР 4_1 и 4_2 МОІБ). */
  computed?: () => GuideComputed;
  findings?: GuideFinding[];
  /** Опечатки и противоречия методички — с тем, как поступить. */
  errata?: Loc[];
  /** Интерактивный расчёт сверх таблиц варианта (см. components/guide-view). */
  widget?: "acl" | "eth10" | "fast" | "slae" | "iter" | "roots" | "approx" | "cauchy" | "quad" | "graph" | "c-lab1" | "c-lab2" | "c-lab3" | "c-magnet" | "c-rgr" | "oop-light" | "ppi" | "biometrics" | "db-l3" | "db-l4" | "db-l5" | "db-l6" | "db-norm" | "mps-kr" | "kfs-l1" | "kfs-l2" | "kfs-l3" | "kfs-l4" | "kfs-l5" | "kfs-l6" | "kfs-l7";
}
