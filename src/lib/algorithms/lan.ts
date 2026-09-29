/**
 * «Локальні мережі» — методичні вказівки до лабораторних робіт E1–E4, M1–M3.
 *
 * Вариант 1–80 даёт тип инфраструктуры (таблица 1.2) и тип трафика (таблица
 * 1.3). Оценка конфигурации: для Ethernet 10 Мбит/с — PDV ≤ 575 bt и PVV ≤ 49 bt
 * (пример варианта 43: 15,3 + 11·0,113 + 2·(33,5 + 200·0,1) + 165 + 11·0,113 =
 * 289,786 bt; PVV 10,5 + 8 + 8 = 26,5 bt), для Fast Ethernet — диаметр зоны
 * конфликта и PDV ≤ 512 bt (22·1,112 + 100 + 140 = 264,464 bt).
 */

export interface Infrastructure {
  type: number;
  buildings: number;
  distance: number;
  floors: number;
  rooms: number;
}

export interface Traffic {
  type: number;
  file: number;
  http: number;
  ftp: number;
  db: number;
}

const INFRA: Omit<Infrastructure, "type">[] = [
  { buildings: 2, distance: 300, floors: 4, rooms: 4 },
  { buildings: 2, distance: 250, floors: 3, rooms: 3 },
  { buildings: 3, distance: 200, floors: 3, rooms: 3 },
  { buildings: 3, distance: 150, floors: 2, rooms: 4 },
  { buildings: 4, distance: 150, floors: 2, rooms: 3 },
  { buildings: 4, distance: 200, floors: 3, rooms: 2 },
  { buildings: 5, distance: 100, floors: 3, rooms: 2 },
  { buildings: 5, distance: 150, floors: 2, rooms: 3 },
];

const TRAFFIC: Omit<Traffic, "type">[] = [
  { file: 3, http: 1, ftp: 2, db: 4 },
  { file: 3, http: 2, ftp: 1, db: 3 },
  { file: 3, http: 1, ftp: 2, db: 2 },
  { file: 2, http: 2, ftp: 1, db: 1 },
  { file: 2, http: 1, ftp: 2, db: 4 },
  { file: 2, http: 2, ftp: 1, db: 3 },
  { file: 4, http: 1, ftp: 2, db: 2 },
  { file: 4, http: 2, ftp: 1, db: 1 },
  { file: 4, http: 1, ftp: 2, db: 4 },
  { file: 2, http: 2, ftp: 1, db: 3 },
];

/** Таблица 1.1: варианты идут по 8 типов инфраструктуры на каждый тип трафика. */
export function lanVariant(n: number): { infra: Infrastructure; traffic: Traffic } {
  if (!Number.isInteger(n) || n < 1 || n > 80) throw new Error("Вариант — от 1 до 80");
  const it = ((n - 1) % 8) + 1;
  const tt = Math.floor((n - 1) / 8) + 1;
  return { infra: { type: it, ...INFRA[it - 1] }, traffic: { type: tt, ...TRAFFIC[tt - 1] } };
}

// ---------------------------------------------------------------- Ethernet 10

export type Seg10 = "10Base-5" | "10Base-2" | "10Base-T" | "10Base-FL" | "FOIRL" | "10Base-FB";

/** Базы PDV (левый, промежуточный, правый сегмент), задержка на метр, длина. */
export const SEG10: Record<Seg10, { left: number | null; mid: number; right: number | null; perM: number; max: number; pvvTx: number | null; pvvMid: number }> = {
  "10Base-5": { left: 11.8, mid: 46.5, right: 169.5, perM: 0.0866, max: 500, pvvTx: 16, pvvMid: 11 },
  "10Base-2": { left: 11.8, mid: 46.5, right: 169.5, perM: 0.1026, max: 185, pvvTx: 16, pvvMid: 11 },
  "10Base-T": { left: 15.3, mid: 42.0, right: 165.0, perM: 0.113, max: 100, pvvTx: 10.5, pvvMid: 8 },
  "10Base-FL": { left: 12.3, mid: 33.5, right: 156.5, perM: 0.1, max: 2000, pvvTx: 10.5, pvvMid: 8 },
  FOIRL: { left: 7.8, mid: 29.0, right: 152.0, perM: 0.1, max: 1000, pvvTx: 10.5, pvvMid: 8 },
  "10Base-FB": { left: null, mid: 24.0, right: null, perM: 0.1, max: 2000, pvvTx: null, pvvMid: 2 },
};

export interface Segment10 {
  type: Seg10;
  length: number;
}

export interface PathTerm {
  segment: number;
  role: "левый" | "промежуточный" | "правый" | "передающий";
  expr: string;
  value: number;
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

function pdvOneWay(path: Segment10[]): { terms: PathTerm[]; total: number } {
  const terms = path.map((s, i): PathTerm => {
    const t = SEG10[s.type];
    const role = i === 0 ? "левый" : i === path.length - 1 ? "правый" : "промежуточный";
    const base = role === "левый" ? t.left : role === "правый" ? t.right : t.mid;
    if (base === null) throw new Error(`${s.type} может быть только промежуточным сегментом`);
    const value = r3(base + s.length * t.perM);
    return { segment: i + 1, role, expr: `${base} + ${s.length}·${t.perM}`, value };
  });
  return { terms, total: r3(terms.reduce((a, t) => a + t.value, 0)) };
}

function pvvOneWay(path: Segment10[]): { terms: PathTerm[]; total: number } {
  // приёмный (последний) сегмент в PVV не входит
  const terms = path.slice(0, -1).map((s, i): PathTerm => {
    const t = SEG10[s.type];
    const role = i === 0 ? "передающий" : "промежуточный";
    const value = role === "передающий" ? t.pvvTx : t.pvvMid;
    if (value === null) throw new Error(`${s.type} не может быть передающим сегментом`);
    return { segment: i + 1, role, expr: String(value), value };
  });
  return { terms, total: r3(terms.reduce((a, t) => a + t.value, 0)) };
}

export interface Ethernet10Check {
  pdv: { terms: PathTerm[]; total: number; reverse?: number; ok: boolean };
  pvv: { terms: PathTerm[]; total: number; reverse?: number; ok: boolean };
  lengthProblems: string[];
  repeaters: number;
}

/**
 * Путь между двумя самыми удалёнными станциями — сегменты слева направо.
 * Если крайние сегменты разного типа, считается в обе стороны и берётся большее.
 */
export function checkEthernet10(path: Segment10[]): Ethernet10Check {
  if (path.length < 2) throw new Error("В пути хотя бы два сегмента: левый и правый");
  const lengthProblems = path
    .filter((s) => s.length > SEG10[s.type].max)
    .map((s) => `${s.type}: ${s.length} м больше предельных ${SEG10[s.type].max} м`);
  const f = pdvOneWay(path);
  const pv = pvvOneWay(path);
  const symmetric = path[0].type === path[path.length - 1].type;
  const reversed = [...path].reverse();
  const fr = symmetric ? undefined : pdvOneWay(reversed).total;
  const pvr = symmetric ? undefined : pvvOneWay(reversed).total;
  const pdvMax = Math.max(f.total, fr ?? 0);
  const pvvMax = Math.max(pv.total, pvr ?? 0);
  return {
    pdv: { ...f, reverse: fr, ok: pdvMax <= 575 },
    pvv: { ...pv, reverse: pvr, ok: pvvMax <= 49 },
    lengthProblems,
    repeaters: path.length - 1,
  };
}

// ------------------------------------------------------------- Fast Ethernet

export type FeCable = "UTP Cat 3" | "UTP Cat 4" | "UTP Cat 5" | "STP" | "Оптоволокно";
export const FE_CABLE: Record<FeCable, number> = {
  "UTP Cat 3": 1.14,
  "UTP Cat 4": 1.14,
  "UTP Cat 5": 1.112,
  STP: 1.112,
  Оптоволокно: 1.0,
};

export type FeRule = "none" | "class1" | "class2" | "class2x2";
export type FeMedia = "copper" | "fiber" | "mixed";

/** Максимальный диаметр зоны конфликта, м (TX — медь, FX — оптика, смешанная — TX и FX). */
export const FE_DIAMETER: Record<FeRule, Record<FeMedia, number | null>> = {
  none: { copper: 100, fiber: 412, mixed: null },
  class1: { copper: 200, fiber: 272, mixed: 260.8 },
  class2: { copper: 200, fiber: 320, mixed: 308.8 },
  class2x2: { copper: 205, fiber: 228, mixed: 216.2 },
};

export const FE_RULE_LABEL: Record<FeRule, string> = {
  none: "без повторителя (станция — станция)",
  class1: "один повторитель I класса",
  class2: "один повторитель II класса",
  class2x2: "два повторителя II класса",
};

export interface FeSegment {
  cable: FeCable;
  length: number;
}

/** PDV Fast Ethernet: кабели + пара станций TX/FX (100 bt) + повторители (I — 140, II — 92). */
export function fastEthernetPdv(segments: FeSegment[], rule: FeRule): { expr: string; total: number; ok: boolean } {
  const reps = rule === "class1" ? [140] : rule === "class2" ? [92] : rule === "class2x2" ? [92, 92] : [];
  const parts = [...segments.map((s) => `${s.length}·${FE_CABLE[s.cable]}`), "100", ...reps.map(String)];
  const total = r3(segments.reduce((a, s) => a + s.length * FE_CABLE[s.cable], 0) + 100 + reps.reduce((a, b) => a + b, 0));
  return { expr: parts.join(" + "), total, ok: total <= 512 };
}
