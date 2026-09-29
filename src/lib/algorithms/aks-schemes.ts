/**
 * Структурні схеми пристроїв практичних робіт «Архітектура комп'ютерів» —
 * як рис. 2.4, 3.1–3.7, 5.1–5.2, 6.1 методички, але з номерами розрядів
 * варіанта й тими самими регістрами, що в мікропрограмі (aks.ts).
 * Координати — в клітинках сітки (1 = 20 px).
 */

import { lab2Variant, lab3Variant, lab4Variant, lab5Variant, lab6Variant } from "./aks";

export interface SchemeReg {
  x: number;
  y: number;
  /** Назва всередині регістра. */
  name: string;
  /** Додаткові клітинки зліва (знакові, переповнення): підпис і номер розряду. */
  cells?: { label?: string; bit: number; mark?: boolean }[];
  /** Поле розрядів hi…lo і його ширина на схемі. */
  hi: number;
  lo: number;
  w: number;
  /** Окремо виділена клітинка поля справа (аналізований молодший розряд) або зліва (старший). */
  markLo?: boolean;
  markHi?: boolean;
  shift?: "left" | "right";
  shiftLabel?: string;
  caption?: string;
}

export interface SchemeWire {
  points: [number, number][];
  arrow?: boolean;
  /** Кружок інверсії на початку лінії. */
  invert?: boolean;
  label?: string;
  labelAt?: [number, number];
}

export interface SchemeBox {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

export interface SchemeText {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  bold?: boolean;
}

export interface RegScheme {
  w: number;
  h: number;
  regs: SchemeReg[];
  wires: SchemeWire[];
  boxes: SchemeBox[];
  texts: SchemeText[];
  /** Двонапрямлена шина (рис. 2.4). */
  bus?: { x1: number; x2: number; y: number };
}

export const REG_H = 1.6;
export const CELL = 1;

/** Ширина регістра разом з додатковими клітинками. */
export const regWidth = (r: SchemeReg) => (r.cells?.length ?? 0) * CELL + r.w;
/** x початку поля hi…lo. */
const fieldX = (r: SchemeReg) => r.x + (r.cells?.length ?? 0) * CELL;
/** x центру клітинки розряду bit поля (лінійно). */
function bitX(r: SchemeReg, bit: number) {
  const span = r.hi - r.lo + 1;
  return fieldX(r) + ((r.hi - bit + 0.5) / span) * r.w;
}

// ─────────────────────────────────────────────────────────────── ЛЧТ і «&»

function counter(x: number, y: number, n: number): { boxes: SchemeBox[]; wires: SchemeWire[]; texts: SchemeText[] } {
  return {
    boxes: [{ x, y, w: 3, h: REG_H, text: "ЛчТ" }],
    wires: [
      { points: [[x + 1.5, y - 1.4], [x + 1.5, y]], arrow: true },
      { points: [[x + 5, y + 0.8], [x + 3, y + 0.8]], arrow: true },
      { points: [[x + 1.5, y + REG_H], [x + 1.5, y + REG_H + 1.2]], arrow: true },
    ],
    texts: [
      { x: x + 1.9, y: y - 0.6, text: String(n), bold: true },
      { x: x + 4.2, y: y + 0.4, text: "−1", bold: true },
      { x: x + 1.9, y: y + REG_H + 1.2, text: "0", bold: true },
    ],
  };
}

// ─────────────────────────────────────────────────────────────── ПР 2

/** Рис. 2.4: шина, Рг1 і Рг2 (модифікований код — два знакові розряди), накопичувальний См, РгР. */
export function lab2Scheme(v: number): RegScheme {
  const { n } = lab2Variant(v);
  const sign = [
    { label: "зн′", bit: n },
    { label: "зн", bit: n - 1 },
  ];
  const r1: SchemeReg = { x: 1, y: 2.5, name: "Рг1", cells: sign, hi: n - 2, lo: 0, w: 9 };
  const r2: SchemeReg = { x: 18, y: 2.5, name: "Рг2", cells: sign, hi: n - 2, lo: 0, w: 9 };
  const sm: SchemeReg = { x: 9.5, y: 7, name: "См", cells: sign, hi: n - 2, lo: 0, w: 9 };
  const rr: SchemeReg = { x: 10.5, y: 11.5, name: "РгР", cells: [{ label: "зн", bit: n - 1 }], hi: n - 2, lo: 0, w: 9 };
  return {
    w: 30,
    h: 14.5,
    bus: { x1: 1, x2: 29, y: 0.8 },
    regs: [r1, r2, sm, rr],
    wires: [
      { points: [[7, 1.3], [7, r1.y]], arrow: true },
      { points: [[24, 1.3], [24, r2.y]], arrow: true },
      { points: [[7, r1.y + REG_H], [7, 5.6], [13.5, 5.6], [13.5, sm.y]], arrow: true },
      { points: [[24, r2.y + REG_H], [24, 5.6], [16.5, 5.6], [16.5, sm.y]], arrow: true },
      { points: [[15.5, sm.y + REG_H], [15.5, rr.y]], arrow: true },
    ],
    boxes: [],
    texts: [],
  };
}

// ─────────────────────────────────────────────────────────────── ПР 3

/** Рис. 3.1, 3.3, 3.5, 3.7 — за способом множення. */
export function lab3Scheme(v: number): RegScheme {
  const { n, method } = lab3Variant(v);
  const lsb = method <= 2;
  const wideMd = method === 2 || method === 4;
  const rg1: SchemeReg = {
    x: 5,
    y: 1.5,
    name: "Рг1",
    hi: n - 1,
    lo: 0,
    w: 8,
    markLo: lsb,
    markHi: !lsb,
    shift: lsb ? "right" : "left",
    caption: "множник",
  };
  const sch: SchemeReg = {
    x: 4,
    y: 5.5,
    name: "СЧД",
    cells: [{ bit: 2 * n }],
    hi: 2 * n - 1,
    lo: 0,
    w: 18,
    shift: method === 1 ? "right" : method === 3 ? "left" : undefined,
  };
  const rg2: SchemeReg = wideMd
    ? { x: 5, y: 9.5, name: "Рг2", hi: 2 * n - 1, lo: 0, w: 18, shift: method === 2 ? "left" : "right", caption: "множене" }
    : method === 1
      ? { x: 5, y: 9.5, name: "Рг2", hi: n - 1, lo: 0, w: 8, caption: "множене" }
      : { x: 15, y: 9.5, name: "Рг2", hi: n - 1, lo: 0, w: 8, caption: "множене" };
  // куди множене заходить у СЧД: спосіб 1 — старша частина, 3 — молодша, 2 і 4 — весь регістр
  const inX = method === 1 ? bitX(sch, Math.round(1.5 * n)) : method === 3 ? bitX(sch, Math.floor(n / 2)) : bitX(sch, n);
  const tapX = lsb ? bitX(rg1, 0) : bitX(rg1, n - 1);
  const c = counter(26, 1.5, n);
  return {
    w: 32,
    h: 12.5,
    regs: [rg1, sch, rg2],
    boxes: [{ x: 1.4, y: 7.6, w: 1.4, h: 2, text: "&" }, ...c.boxes],
    wires: [
      { points: [[tapX, rg1.y + REG_H], [tapX, 3.9], [0.8, 3.9], [0.8, 8.1], [1.4, 8.1]] },
      { points: [[-0.2, 9.1], [1.4, 9.1]] },
      { points: [[inX, rg2.y], [inX, sch.y + REG_H]], arrow: true },
      { points: [[2.8, 8.6], [inX, 8.6]] },
      ...c.wires,
    ],
    texts: [{ x: -0.2, y: 10.3, text: "ТИ", bold: true }, ...c.texts],
  };
}

// ─────────────────────────────────────────────────────────────── ПР 4

/** Аналог рис. 3.x для множення з аналізом двох розрядів — регістри, як у програмі. */
export function lab4Scheme(v: number): RegScheme {
  const { n, method } = lab4Variant(v);
  const T = n / 2;
  const lsb = method <= 2;
  const W = method === 2 ? 2 * n + 2 : 2 * n + 3;
  const extra = W - 2 * n;
  const schCells = Array.from({ length: extra }, (_, i) => ({ bit: W - 1 - i }));
  const sch: SchemeReg = {
    x: 4,
    y: 6,
    name: "СЧД (sch)",
    cells: schCells,
    hi: 2 * n - 1,
    lo: 0,
    w: 18,
    shift: method === 1 ? "right" : method === 3 ? "left" : undefined,
    shiftLabel: method === 1 || method === 3 ? "2" : undefined,
  };
  const regs: SchemeReg[] = [sch];
  const boxes: SchemeBox[] = [];
  const wires: SchemeWire[] = [];
  const texts: SchemeText[] = [];
  let tapX: number;
  if (lsb) {
    const rg1: SchemeReg = { x: 5, y: 1.5, name: "Рг1 (rg1)", hi: n - 1, lo: 0, w: 9, shift: "right", shiftLabel: "2", caption: "множник" };
    regs.push(rg1);
    tapX = bitX(rg1, 0) - 0.3;
    boxes.push({ x: 1, y: 1.5, w: 2.4, h: REG_H, text: "c" });
    texts.push({ x: 2.2, y: 0.9, text: "ознака корекції", anchor: "middle" });
  } else {
    const mr: SchemeReg = {
      x: 4,
      y: 1.5,
      name: "mr",
      cells: [
        { label: "0", bit: n + 2 },
        { label: "0", bit: n + 1 },
      ],
      hi: n,
      lo: 0,
      w: 9,
      shift: "left",
      shiftLabel: "2",
      caption: `множник у розрядах ${n}…1`,
    };
    regs.push(mr);
    tapX = mr.x + 1.4;
    texts.push({ x: mr.x + 1, y: 0.9, text: "фіктивна пара «00»", anchor: "middle" });
  }
  const mdWide = method === 2 || method === 4;
  const md: SchemeReg = mdWide
    ? {
        x: 5,
        y: 11,
        name: method === 2 ? "Рг2 (rg2)" : "md",
        cells: Array.from({ length: (method === 2 ? 2 * n + 2 : 2 * n + 3) - 2 * n }, (_, i) => ({ bit: (method === 2 ? 2 * n + 2 : 2 * n + 3) - 1 - i })),
        hi: 2 * n - 1,
        lo: 0,
        w: 16,
        shift: method === 2 ? "left" : "right",
        shiftLabel: "2",
        caption: "множене",
      }
    : { x: method === 1 ? 5 : 14, y: 11, name: "Рг2 (rg2)", hi: n - 1, lo: 0, w: 8, caption: "множене" };
  regs.push(md);
  const dsh: SchemeBox = { x: 11, y: 8.6, w: 7, h: 1.4, text: lsb ? "0, A, 2A, −A" : "0, ±A, ±2A" };
  boxes.push(dsh);
  const inX = method === 1 ? bitX(sch, Math.round(1.5 * n)) : method === 3 ? bitX(sch, Math.floor(n / 2)) : bitX(sch, n);
  wires.push({ points: [[dsh.x + 1, md.y], [dsh.x + 1, dsh.y + dsh.h]], arrow: true });
  wires.push({ points: [[inX, dsh.y], [inX, sch.y + REG_H]], arrow: true });
  wires.push({ points: [[tapX, 3.1], [tapX, 4.3], [0.6, 4.3], [0.6, 9.3], [dsh.x, 9.3]], arrow: true, label: lsb ? "пара + c" : "пара й наступний", labelAt: [0.9, 5] });
  if (lsb) wires.push({ points: [[2.2, 3.1], [2.2, 4.3]] });
  const c = counter(27, 1.5, lsb ? T : T + 1);
  return { w: 33, h: 13.5, regs, boxes: [...boxes, ...c.boxes], wires: [...wires, ...c.wires], texts: [...texts, ...c.texts] };
}

// ─────────────────────────────────────────────────────────────── ПР 5

/** Рис. 5.1 (зсув залишку) і 5.2 (зсув дільника). */
export function lab5Scheme(v: number): RegScheme {
  const { n, shift } = lab5Variant(v);
  const rem = shift === "залишку";
  const hi = rem ? n - 1 : 2 * n - 1;
  const top = rem ? n + 1 : 2 * n + 1;
  const sign2 = [
    { label: "зн", bit: top },
    { bit: top - 1 },
  ];
  const w = rem ? 9 : 18;
  const rg1: SchemeReg = { x: 3, y: 1.5, name: "Рг1", cells: [{ label: "зн", bit: n }], hi: n - 1, lo: 0, w: 9, markLo: true, shift: "left", caption: "частка" };
  const sm: SchemeReg = { x: 2, y: 5.5, name: "См", cells: sign2, hi, lo: 0, w, shift: rem ? "left" : undefined, caption: "залишок" };
  const rg2: SchemeReg = { x: 2, y: 10, name: "Рг2", cells: sign2, hi, lo: 0, w, shift: rem ? undefined : "right", caption: "дільник" };
  const a1 = sm.x + 2 + w * 0.45;
  const a2 = sm.x + 2 + w * 0.7;
  const c = counter(rem ? 24 : 28, 1.5, n);
  return {
    w: rem ? 30 : 34,
    h: 13,
    regs: [rg1, sm, rg2],
    boxes: c.boxes,
    wires: [
      // інверсний знак залишку — у молодший розряд частки
      { points: [[sm.x + 0.5, sm.y], [sm.x + 0.5, 4.3], [bitX(rg1, 0), 4.3], [bitX(rg1, 0), rg1.y + REG_H]], invert: true, arrow: true },
      { points: [[a1, rg2.y], [a1, sm.y + REG_H]], arrow: true },
      { points: [[a2, rg2.y], [a2, sm.y + REG_H]], arrow: true },
      { points: [[a1 - 3.2, 8.5], [a1, 8.5]], arrow: true, label: "ДК", labelAt: [a1 - 4.8, 8.2] },
      { points: [[a2 + 3, 8.5], [a2, 8.5]], arrow: true, label: "ПК", labelAt: [a2 + 3.2, 8.2] },
      ...c.wires,
    ],
    texts: c.texts,
  };
}

// ─────────────────────────────────────────────────────────────── ПР 6

/** Рис. 6.1: СмМ, РгМ, T, Рг1, СмП, РгП — розряди варіанта, регістри програми. */
export function lab6Scheme(v: number): RegScheme {
  const { m, p: n } = lab6Variant(v);
  const smm: SchemeReg = {
    x: 1,
    y: 5,
    name: "СмМ (smm)",
    cells: [
      { label: "ЗН", bit: m },
      { label: "П", bit: m - 1 },
    ],
    hi: m - 2,
    lo: 0,
    w: 11,
  };
  const rgm: SchemeReg = {
    x: 2,
    y: 9,
    name: "РгМ (rgm)",
    cells: [
      { label: "ЗН", bit: m },
      { label: "зн′", bit: m - 1 },
    ],
    hi: m - 2,
    lo: 0,
    w: 10,
  };
  const rg1: SchemeReg = { x: 20, y: 1, name: "Рг1 (rg1)", cells: [{ label: "ЗН", bit: n - 1 }], hi: n - 2, lo: 0, w: 9 };
  const smp: SchemeReg = {
    x: 19,
    y: 5,
    name: "СмП (smp)",
    cells: [
      { label: "ЗН", bit: n },
      { label: "П", bit: n - 1 },
    ],
    hi: n - 2,
    lo: 0,
    w: 9,
  };
  const rgp: SchemeReg = {
    x: 19,
    y: 9,
    name: "РгП (rgp)",
    cells: [
      { label: "ЗН", bit: n },
      { label: "зн′", bit: n - 1 },
    ],
    hi: n - 2,
    lo: 0,
    w: 9,
  };
  return {
    w: 31,
    h: 11.5,
    regs: [smm, rgm, rg1, smp, rgp],
    boxes: [{ x: 15.2, y: 5, w: 2, h: REG_H, text: "T" }],
    wires: [
      { points: [[8, smm.y + REG_H], [8, rgm.y]] },
      { points: [[25, rg1.y + REG_H], [25, smp.y]] },
      { points: [[25, smp.y + REG_H], [25, rgp.y]] },
      { points: [[17.2, 5.8], [19, 5.8]] },
    ],
    texts: [],
  };
}
