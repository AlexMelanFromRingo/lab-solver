import type { LabGuide } from "@/lib/data/pismi-labs";

/**
 * Работа-инструкция: лабораторная, которая делается в программе (Packet Tracer,
 * СУБД, среда разработки), а не сводится к одной формуле. Страница строится из
 * этих данных: что посчитать по варианту, порядок по методичке, что снять,
 * состав отчёта и что должно получиться.
 */

export interface GuideTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface GuideCode {
  title: string;
  /** Команды или текст для копирования как есть. */
  code: string;
  note?: string;
}

export interface GuideComputed {
  tables?: GuideTable[];
  code?: GuideCode[];
  notes?: string[];
}

export interface GuideVariant {
  /** Как называется номер в методичке: «варіант», «x», «v». */
  label: string;
  min: number;
  max: number;
  /** Откуда берётся номер — пересказ методички. */
  hint: string;
  compute: (v: number) => GuideComputed;
}

/** Ответ на «поясніть» из методички — то, что должно получиться. */
export interface GuideFinding {
  title: string;
  body: string;
}

export interface GuideModule {
  slug: string;
  /** Короткое вступление: что это за работа и что даёт страница. */
  intro: string;
  guide: LabGuide;
  variant?: GuideVariant;
  /** Расчёт без варианта: задание одно на всех (как в ЛР 4_1 и 4_2 МОІБ). */
  computed?: () => GuideComputed;
  findings?: GuideFinding[];
  /** Опечатки и противоречия методички — с тем, как поступить. */
  errata?: string[];
  /** Интерактивный расчёт сверх таблиц варианта (см. components/guide-view). */
  widget?: "acl" | "eth10" | "fast" | "slae" | "iter" | "roots" | "approx" | "cauchy" | "graph";
}
