/**
 * «Теорія електричних та магнітних кіл» — обработка измерений лабораторных
 * работ и задачи РГР. Формулы — из описаний работ в LIDER и образцов отчётов.
 * Расхождение γ = |обчислено − виміряно| / обчислено · 100 % (так посчитаны
 * 3,85 % и 6,18 % в образце отчёта ЛР2).
 */

export const gamma = (calc: number, meas: number) => (calc === 0 ? NaN : (Math.abs(calc - meas) / Math.abs(calc)) * 100);

// ----------------------------------------------------- ЛР1: закони Кірхгофа

export interface Lab1Input {
  r1: number;
  r2: number;
  r3: number;
  u: number;
}

/** R1 последовательно с R2‖R3 (рис. 1, а): Rе = R1 + R23, I1 = U/Rе, … */
export function lab1(inp: Lab1Input) {
  const r23 = (inp.r2 * inp.r3) / (inp.r2 + inp.r3);
  const re = inp.r1 + r23;
  const i1 = inp.u / re;
  const ubv = i1 * r23;
  const uab = i1 * inp.r1;
  const i2 = ubv / inp.r2;
  const i3 = ubv / inp.r3;
  const pSource = inp.u * i1;
  const pLoad = inp.r1 * i1 ** 2 + inp.r2 * i2 ** 2 + inp.r3 * i3 ** 2;
  return { r23, re, i1, i2, i3, uab, ubv, sumU: uab + ubv, sumI: i2 + i3, pSource, pLoad };
}

// ---------------------------------------------- ЛР2: активний двополюсник

export interface Lab2Input {
  u1: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
}

/**
 * Мост рис. 1: «+» источника — к вершине между R3 и R4, «−» — между R1 и R2;
 * зажим 1 — между R4 и R2, зажим 2 — между R3 и R1.
 * Uxx = U1·(R2/(R2+R4) − R1/(R1+R3)), Rвх = R3‖R1 + R4‖R2; в согласованном
 * режиме Rн = Rвх: I = Uxx/(2Rвх), P = I²·Rвх, η = 50 %.
 */
export function lab2(inp: Lab2Input) {
  const uxx = inp.u1 * (inp.r2 / (inp.r2 + inp.r4) - inp.r1 / (inp.r1 + inp.r3));
  const rin = (inp.r3 * inp.r1) / (inp.r3 + inp.r1) + (inp.r4 * inp.r2) / (inp.r4 + inp.r2);
  const ikz = Math.abs(uxx) / rin;
  const i = Math.abs(uxx) / (2 * rin);
  const p = i * i * rin;
  return { uxx, rin, ikz, i, p, eta: 50 };
}

/** Измеренная строка табл. 2: Rвх = Uxx/Iкз, η = P/(Uxx·I). */
export function lab2Measured(uxx: number, ikz: number, i: number, p: number) {
  return { rin: uxx / ikz, eta: (p / (uxx * i)) * 100 };
}

// -------------------------------------------- ЛР3: послідовне коло RLC

export interface Lab3Row {
  u: number;
  i: number;
  phiDeg: number;
  ur: number;
  uk: number;
  uc: number;
}

/** Табл. 2 по измерениям табл. 1 (формулы из описания работы). */
export function lab3(r: Lab3Row) {
  const phi = (r.phiDeg * Math.PI) / 180;
  const p = r.u * r.i * Math.cos(phi);
  const R = p / r.i ** 2;
  const rp = r.ur / r.i;
  const zk = r.uk / r.i;
  const rk = R - rp;
  const xl = Math.sqrt(Math.max(zk ** 2 - rk ** 2, 0));
  const xc = r.uc / r.i;
  const z = r.u / r.i;
  return { R, rp, rk, zk, xl, xc, z, urk: r.i * rk, ul: r.i * xl, p, q: r.u * r.i * Math.sin(phi), s: r.u * r.i };
}

// ------------------------------------------- ЛР5: магнітне коло

export const MU0 = 4 * Math.PI * 1e-7;

export interface MagnetInput {
  wn: number;
  wv: number;
  c: number;
  /** Длина средней линии в стали, м: ℓст = 2(a + b − 2c). */
  l: number;
  s: number;
  /** Зазор, м (0 — без зазора). */
  delta: number;
}

/**
 * Φ = N·C·10⁻³/Wв, B = Φ/S, H0 = B/μ0, Hст = (Wн·Iн − H0·δ)/ℓст, μa = B/Hст,
 * μr = μa/μ0, Rмст = ℓст/(μa·S), Rм0 = δ/(μ0·S), Rм = Rмст + Rм0.
 */
export function magnet(inp: MagnetInput, iN: number, n: number) {
  const phi = (n * inp.c * 1e-3) / inp.wv;
  const b = phi / inp.s;
  const h0 = inp.delta > 0 ? b / MU0 : 0;
  const hst = (inp.wn * iN - h0 * inp.delta) / inp.l;
  const mua = b / hst;
  const rst = inp.l / (mua * inp.s);
  const r0 = inp.delta / (MU0 * inp.s);
  return { phi, b, h0, hst, mua, mur: mua / MU0, rst, r0, r: rst + r0 };
}

// ------------------------------------------------------------ комплекс

export interface C {
  re: number;
  im: number;
}

export const cx = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => cx(a.re + b.re, a.im + b.im);
export const mul = (a: C, b: C): C => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const div = (a: C, b: C): C => {
  const d = b.re ** 2 + b.im ** 2;
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const abs = (a: C) => Math.hypot(a.re, a.im);
export const argDeg = (a: C) => (Math.atan2(a.im, a.re) * 180) / Math.PI;

export interface Branch {
  r: number;
  xl: number;
  xc: number;
}

export const zOf = (b: Branch): C => cx(b.r, b.xl - b.xc);

/** Две параллельные ветви под напряжением U (фаза 0), при необходимости — общий последовательный участок Z0. */
export function twoBranches(u: number, b1: Branch, b2: Branch, b0?: Branch) {
  const z1 = zOf(b1);
  const z2 = zOf(b2);
  const zp = div(mul(z1, z2), add(z1, z2));
  const z0 = b0 ? zOf(b0) : cx(0);
  const z = add(z0, zp);
  const U = cx(u);
  const I = div(U, z);
  const Up = mul(I, zp);
  const I1 = div(Up, z1);
  const I2 = div(Up, z2);
  const S = mul(U, cx(I.re, -I.im));
  return { z1, z2, zp, z0, z, I, I1, I2, Up, S };
}
