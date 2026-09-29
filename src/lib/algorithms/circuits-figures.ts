/**
 * Рисунки к работам ТЕМК из рассчитанных величин: векторные диаграммы,
 * треугольники сопротивлений и мощностей (ЛР3, п. «Побудувати векторні
 * діаграми, трикутники опорів та потужностей для трьох вимірів»), векторные
 * диаграммы задач РГР и графики B(Hст), μa(Hст), Rм(Hст) ЛР5 (п. 6).
 */

import { fmtNum, type PhasorFigure, type PlotFigure } from "@/lib/figures";
import { abs, argDeg, type C } from "./circuits";

const deg = (y: number, x: number) => (Math.atan2(y, x) * 180) / Math.PI;

/** Режим измерения ЛР3 по углу φ, как в методичке: резонанс добиваются по φ = 0. */
export function lab3Mode(phiDeg: number): string {
  if (Math.abs(phiDeg) < 1) return "XL = XC";
  return phiDeg > 0 ? "XL > XC" : "XL < XC";
}

/** Прямоугольный треугольник: катет a по оси +1, катет b вертикально, гипотенуза — c. При b ≈ 0 вырождается в отрезок «c = a». */
function triangle(key: string, name: string, unit: string, a: number, b: number, [la, lb, lc]: [string, string, string]): PhasorFigure {
  const scales = [{ key, name, unit }];
  if (Math.abs(b) < Math.abs(a) * 0.02) return { scales, phasors: [{ to: [a, 0], label: `${lc} = ${la}`, scale: key, arrow: false, side: "r" }] };
  return {
    scales,
    phasors: [
      { to: [a, 0], label: la, scale: key, arrow: false, side: b >= 0 ? "r" : "l" },
      { from: [a, 0], to: [a, b], label: lb, scale: key, arrow: false, side: b >= 0 ? "r" : "l" },
      { to: [a, b], label: lc, scale: key, arrow: false, side: b >= 0 ? "l" : "r" },
    ],
    arcs: [{ from: 0, to: deg(b, a), label: "φ" }],
  };
}

/**
 * ЛР3: топографическая диаграмма по току (ток — по оси +1): UR на реостате,
 * URк и UL катушки, UC конденсатора; U замыкает цепочку, Uк — от начала URк
 * к концу UL. Треугольники — из R = Rр + Rк, X = XL − XC и P, Q; при
 * резонансе (φ = 0) X и Q равны нулю и треугольники вырождаются в отрезки.
 */
export function lab3Figures(resonance: boolean, x: { i: number; ur: number; urk: number; ul: number; uc: number; rp: number; rk: number; xl: number; xc: number; p: number; q: number }) {
  const a: [number, number] = [x.ur, 0];
  const b: [number, number] = [x.ur + x.urk, 0];
  const c: [number, number] = [b[0], x.ul];
  const d: [number, number] = [b[0], x.ul - x.uc];
  // Подписи векторов вдоль оси — с той стороны, куда не уходит U (там дуга φ).
  const below = d[1] >= 0 ? "r" : "l";
  const vector: PhasorFigure = {
    complex: true,
    scales: [
      { key: "u", name: "m_U", unit: "В", cells: 12 },
      { key: "i", name: "m_I", unit: "А", cells: 5 },
    ],
    phasors: [
      { to: [x.i, 0], label: "I", scale: "i", at: 0.9, side: below },
      { to: a, label: "U_R", scale: "u", side: below, at: 0.5 },
      { from: a, to: b, label: "U_Rк", scale: "u", side: below },
      { from: b, to: c, label: "U_L", scale: "u", side: "r", at: 0.85 },
      { from: c, to: d, label: "U_C", scale: "u", side: "l", at: 0.8 },
      { from: a, to: c, label: "U_к", scale: "u", at: 0.45 },
      { to: d, label: "U", scale: "u", at: 0.4, side: d[1] >= 0 ? "l" : "r" },
    ],
    arcs: [{ from: 0, to: deg(d[1], d[0]), label: "φ" }],
  };
  const R = x.rp + x.rk;
  const X = resonance ? 0 : x.xl - x.xc;
  const z = triangle("z", "m_Z", "Ом", R, X, ["R", "X", "Z"]);
  const s = triangle("s", "m_S", "В·А", x.p, resonance ? 0 : x.q, ["P", "Q", "S"]);
  return { vector, z, s };
}

/** РГР, задача 1: последовательная цепь R, L, C, диаграмма по току. */
export function rgr1Figure(i: number, ur: number, ul: number, uc: number): PhasorFigure {
  const d: [number, number] = [ur, ul - uc];
  const below = d[1] >= 0 ? "r" : "l";
  return {
    complex: true,
    scales: [
      { key: "u", name: "m_U", unit: "В" },
      { key: "i", name: "m_I", unit: "А", cells: 4 },
    ],
    phasors: [
      { to: [i, 0], label: "I", scale: "i", at: 0.9, side: below },
      { to: [ur, 0], label: "U_R", scale: "u", side: below, at: 0.5 },
      { from: [ur, 0], to: [ur, ul], label: "U_L", scale: "u", side: "r", at: 0.8 },
      { from: [ur, ul], to: d, label: "U_C", scale: "u", side: "l", at: 0.7 },
      { to: d, label: "U", scale: "u", at: 0.4, side: d[1] >= 0 ? "l" : "r" },
    ],
    arcs: [{ from: 0, to: deg(d[1], d[0]), label: "φ" }],
  };
}

/** РГР, задача 2: U по оси +1 (φu = 0), İ = İ1 + İ2 — İ2 откладывается от конца İ1. */
export function rgr2Figure(u: number, I: C, I1: C, I2: C): PhasorFigure {
  const p = (c: C): [number, number] => [c.re, c.im];
  return {
    axes: true,
    complex: true,
    scales: [
      { key: "u", name: "m_U", unit: "В", cells: 6 },
      { key: "i", name: "m_I", unit: "А" },
    ],
    phasors: [
      { to: [u, 0], label: "U", scale: "u", at: 0.85 },
      { to: p(I1), label: "I_1", scale: "i", at: 0.75 },
      { from: p(I1), to: [I1.re + I2.re, I1.im + I2.im], label: "I_2", scale: "i" },
      { to: p(I), label: "I", scale: "i", at: 0.75 },
    ],
    arcs: [
      { from: 0, to: argDeg(I1), label: "φ_1" },
      { from: 0, to: argDeg(I), label: "φ" },
    ].filter((a) => abs(I) > 0 && Number.isFinite(a.to)),
  };
}

export interface MagnetRow {
  b: number;
  hst: number;
  mua: number;
  r: number;
}

/**
 * ЛР5, п. 6: B(Hст), μa(Hст) и Rм(Hст) без промежутка и с промежутком.
 * Строки с Hст ≤ 0 (H0·δ больше Wн·Iн — зазор задан не тот, что был в опыте)
 * на графики не попадают: μa и Rм у них теряют смысл; их номера — в dropped.
 */
export function magnetPlots(noGap: MagnetRow[], gap: MagnetRow[], delta: number) {
  const ok = (r: MagnetRow) => r.hst > 0 && [r.b, r.mua, r.r].every(Number.isFinite);
  const series = (f: (r: MagnetRow) => number) => [
    { label: "без проміжку", points: noGap.filter(ok).map((r) => [r.hst, f(r)] as [number, number]) },
    { label: `із проміжком δ = ${fmtNum(delta)} мм`, points: gap.filter(ok).map((r) => [r.hst, f(r)] as [number, number]), dashed: true },
  ];
  const x = { label: "H_ст", unit: "А/м" };
  const plots: { b: PlotFigure; mu: PlotFigure; r: PlotFigure } = {
    b: { x, y: { label: "B", unit: "Тл" }, series: series((r) => r.b), smooth: true },
    mu: { x, y: { label: "μ_a", unit: "Гн/м" }, series: series((r) => r.mua), smooth: true },
    r: { x, y: { label: "R_м", unit: "1/Гн" }, series: series((r) => r.r), smooth: true },
  };
  const dropped = { noGap: noGap.flatMap((r, i) => (ok(r) ? [] : [i + 1])), gap: gap.flatMap((r, i) => (ok(r) ? [] : [i + 1])) };
  return { ...plots, dropped };
}
