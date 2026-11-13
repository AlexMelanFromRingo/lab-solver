import type { Lang } from "@/lib/i18n";

export const G = 9.81;
export const MU0 = 4 * Math.PI * 1e-7;
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** Середньоквадратична похибка середнього S = √(Σ(Δx)² / (n(n−1))). */
export function sMean(xs: number[]): number {
  const m = mean(xs);
  const n = xs.length;
  return n > 1 ? Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n * (n - 1))) : NaN;
}

/** Коефіцієнти Стьюдента для p = 0,95 за кількістю вимірів n (додаток методички 824). */
const T95: Record<number, number> = { 2: 12.7, 3: 4.3, 4: 3.18, 5: 2.78, 6: 2.57, 7: 2.45, 8: 2.36, 9: 2.31, 10: 2.26, 11: 2.23, 12: 2.2, 15: 2.14, 20: 2.09 };
export function student95(n: number): number {
  if (T95[n]) return T95[n];
  const keys = Object.keys(T95).map(Number).sort((a, b) => a - b);
  const k = keys.find((x) => x >= n);
  return k ? T95[k] : 1.96;
}

/** Число з комою, d значущих знаків після коми (без хвостових нулів). */
export function fx(v: number, d = 3): string {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return sci(v, d);
  return Number(v.toFixed(d)).toString().replace(".", ",").replace("-", "−");
}

/** Експоненційний запис: 4,12·10⁻³. */
export function sci(v: number, d = 3): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / 10 ** e;
  return `${Number(m.toFixed(d)).toString().replace(".", ",").replace("-", "−")}·10${sup(e)}`;
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const sup = (e: number) => String(e).split("").map((c) => SUP[c] ?? c).join("");

/** Відсоток з двома знаками. */
export const pct = (v: number) => (Number.isFinite(v) ? `${fx(v, 2)} %` : "—");

/** Помилка відносно відомого значення (табличного) у відсотках. */
export const relErr = (x: number, ref: number) => (Math.abs(x - ref) / Math.abs(ref)) * 100;

export const L = (lang: Lang) => (uk: string, ru: string) => (lang === "uk" ? uk : ru);

/** Лінійна апроксимація y = a + b·x методом найменших квадратів. */
export function linfit(xs: number[], ys: number[]): { a: number; b: number } {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const b = sxx ? sxy / sxx : NaN;
  return { a: my - b * mx, b };
}

/** Рядок «Середнє» для таблиці: значення під потрібними стовпцями, решта — «—». */
export function avgRow(label: string, width: number, cells: Record<number, string>): string[] {
  return Array.from({ length: width }, (_, i) => (i === 0 ? label : cells[i] ?? "—"));
}
