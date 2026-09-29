/**
 * «Алгоритми та методи обчислень» — численные методы по примерам методички
 * (листы Maple в LIDER): СЛАУ обратной матрицей, Гауссом, итерациями и
 * Зейделем; нелинейное уравнение простой итерацией x = x − f(x)/k с
 * k = round(max f′/2); методы Ньютона, хорд и комбинированный; многочлен
 * Лагранжа; метод наименьших квадратов; задача Коши методами Эйлера,
 * Эйлера–Коши с уточнением и Рунге–Кутта; явные разностные схемы для уравнений
 * теплопроводности и колебаний струны.
 */

export type Matrix = number[][];

const copy = (a: Matrix) => a.map((r) => [...r]);

// ------------------------------------------------------------------ СЛАУ

export function det(a: Matrix): number {
  const m = copy(a);
  const n = m.length;
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-14) return 0;
    if (p !== c) {
      [m[p], m[c]] = [m[c], m[p]];
      d = -d;
    }
    d *= m[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = m[r][c] / m[c][c];
      for (let k = c; k < n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return d;
}

export function inverse(a: Matrix): Matrix {
  const n = a.length;
  const m = a.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-14) throw new Error("Матрица вырожденная — обратной нет");
    [m[p], m[c]] = [m[c], m[p]];
    const pv = m[c][c];
    for (let k = 0; k < 2 * n; k++) m[c][k] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c];
      for (let k = 0; k < 2 * n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((r) => r.slice(n));
}

export const mul = (a: Matrix, b: Matrix): Matrix => a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
export const mulVec = (a: Matrix, x: number[]) => a.map((r) => r.reduce((s, v, k) => s + v * x[k], 0));

/** Метод Гаусса: прямой ход (расширенная матрица после каждого шага) и обратный. */
export function gauss(a: Matrix, b: number[]): { steps: Matrix[]; x: number[] } {
  const n = a.length;
  const m = a.map((r, i) => [...r, b[i]]);
  const steps: Matrix[] = [copy(m)];
  for (let c = 0; c < n; c++) {
    if (Math.abs(m[c][c]) < 1e-14) {
      const p = m.findIndex((r, i) => i > c && Math.abs(r[c]) > 1e-14);
      if (p < 0) throw new Error("Система вырожденная");
      [m[p], m[c]] = [m[c], m[p]];
    }
    for (let r = c + 1; r < n; r++) {
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
    steps.push(copy(m));
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = m[i][n];
    for (let k = i + 1; k < n; k++) s -= m[i][k] * x[k];
    x[i] = s / m[i][i];
  }
  return { steps, x };
}

/** Норма матрицы — максимум сумм модулей по строкам (как norm в Maple). */
export const normInf = (a: Matrix) => Math.max(...a.map((r) => r.reduce((s, v) => s + Math.abs(v), 0)));

export function isDiagonallyDominant(a: Matrix): boolean {
  return a.every((r, i) => Math.abs(r[i]) >= r.reduce((s, v, j) => (j === i ? s : s + Math.abs(v)), 0));
}

function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

/**
 * Перестановка уравнений (строк) и неизвестных (столбцов), дающая
 * диагональное преобладание, — достаточное условие сходимости итераций и
 * Зейделя. cols[k] — какая неизвестная стоит k-й.
 */
export function dominantOrder(a: Matrix, b: number[]): { a: Matrix; b: number[]; rows: number[]; cols: number[] } | null {
  const n = a.length;
  if (n > 5) return null;
  const perms = permutations(n);
  for (const cols of perms) {
    for (const rows of perms) {
      const pa = rows.map((r) => cols.map((c) => a[r][c]));
      if (isDiagonallyDominant(pa)) return { a: pa, b: rows.map((r) => b[r]), rows, cols };
    }
  }
  return null;
}

/** Нормальная система AᵀA·x = Aᵀb: симметричная положительно определённая, Зейдель для неё сходится. */
export function normalSystem(a: Matrix, b: number[]): { a: Matrix; b: number[] } {
  const at = a[0].map((_, j) => a.map((r) => r[j]));
  return { a: mul(at, a), b: mulVec(at, b) };
}

export interface IterRow {
  k: number;
  x: number[];
  delta: number;
}

/**
 * Приведение к виду x = Cx + d делением каждой строки на диагональный элемент,
 * затем простые итерации (Якоби) или Зейдель.
 */
export function toIterForm(a: Matrix, b: number[]): { c: Matrix; d: number[] } {
  return {
    c: a.map((r, i) => r.map((v, j) => (i === j ? 0 : -v / r[i]))),
    d: b.map((v, i) => v / a[i][i]),
  };
}

export function iterate(c: Matrix, d: number[], eps: number, seidel: boolean, max = 500): IterRow[] {
  let x = [...d];
  const rows: IterRow[] = [{ k: 0, x: [...x], delta: NaN }];
  for (let k = 1; k <= max; k++) {
    const nx = [...x];
    for (let i = 0; i < x.length; i++) {
      const src = seidel ? nx : x;
      nx[i] = d[i] + c[i].reduce((s, v, j) => s + v * src[j], 0);
    }
    const delta = Math.max(...nx.map((v, i) => Math.abs(v - x[i])));
    rows.push({ k, x: nx, delta });
    x = nx;
    if (delta < eps) break;
    if (!Number.isFinite(delta) || delta > 1e12) break;
  }
  return rows;
}

// ---------------------------------------------- нелинейное уравнение (ЛР2)

export interface Step1 {
  i: number;
  x: number;
  next: number;
  delta: number;
}

/** Максимум производной на отрезке — перебором по сетке. */
export function maxOn(f: (x: number) => number, a: number, b: number, n = 2000): number {
  let best = -Infinity;
  for (let i = 0; i <= n; i++) best = Math.max(best, f(a + ((b - a) * i) / n));
  return best;
}

/**
 * Простая итерация из примера методички: g(x) = x − f(x)/k, k = round(max f′/2),
 * остановка по относительной разности |x₁ − x|/|x| ≤ eps.
 */
export function simpleIteration(f: (x: number) => number, fp: (x: number) => number, a: number, b: number, x0: number, eps: number, max = 1000): { k: number; steps: Step1[]; root: number; converged: boolean } {
  const m = maxOn(fp, a, b);
  const mn = -maxOn((x) => -fp(x), a, b);
  // берётся экстремум производной с её знаком: так в примере получилось k = −6
  const ext = Math.abs(mn) > Math.abs(m) ? mn : m;
  const k = Math.round(ext / 2) || (ext >= 0 ? 1 : -1);
  const steps: Step1[] = [];
  let x = x0;
  for (let i = 1; i <= max; i++) {
    const next = x - f(x) / k;
    const delta = Math.abs(next - x) / Math.abs(x || 1);
    steps.push({ i, x, next, delta });
    x = next;
    if (delta <= eps) return { k, steps, root: x, converged: true };
    if (!Number.isFinite(x) || Math.abs(x) > 1e12) break;
  }
  return { k, steps, root: x, converged: false };
}

// ------------------------------------- Ньютон, хорды, комбинированный (МК1)

/** Метод Ньютона: x₀ — конец отрезка, где F·F″ > 0. */
export function newton(f: (x: number) => number, fp: (x: number) => number, fpp: (x: number) => number, a: number, b: number, eps: number, max = 200): { x0: number; steps: Step1[]; root: number } {
  const x0 = f(a) * fpp(a) > 0 ? a : b;
  const steps: Step1[] = [];
  let x = x0;
  for (let i = 1; i <= max; i++) {
    const next = x - f(x) / fp(x);
    const delta = Math.abs(next - x);
    steps.push({ i, x, next, delta });
    x = next;
    if (delta < eps) break;
  }
  return { x0, steps, root: x };
}

/** Метод хорд: неподвижен конец c, где F·F″ > 0, движется другой. */
export function chords(f: (x: number) => number, fpp: (x: number) => number, a: number, b: number, eps: number, max = 500): { fixed: number; steps: Step1[]; root: number } {
  const [c, start] = f(a) * fpp(a) > 0 ? [a, b] : [b, a];
  const steps: Step1[] = [];
  let x = start;
  for (let i = 1; i <= max; i++) {
    const next = x - (f(x) * (x - c)) / (f(x) - f(c));
    const delta = Math.abs(next - x);
    steps.push({ i, x, next, delta });
    x = next;
    if (delta < eps) break;
  }
  return { fixed: c, steps, root: x };
}

/** Комбинированный: с одного конца Ньютон, с другого хорда, пока отрезок не станет короче 2ε. */
export function combined(f: (x: number) => number, fp: (x: number) => number, fpp: (x: number) => number, a0: number, b0: number, eps: number, max = 200): { steps: { i: number; a: number; b: number; len: number }[]; root: number } {
  // ньютоновский конец — где F·F″ > 0
  let [n, h] = f(a0) * fpp(a0) > 0 ? [a0, b0] : [b0, a0];
  const steps: { i: number; a: number; b: number; len: number }[] = [];
  for (let i = 1; i <= max; i++) {
    const nn = n - f(n) / fp(n);
    const hh = h - (f(h) * (n - h)) / (f(n) - f(h));
    [n, h] = [nn, hh];
    const len = Math.abs(n - h);
    steps.push({ i, a: Math.min(n, h), b: Math.max(n, h), len });
    if (len < 2 * eps) break;
  }
  return { steps, root: (n + h) / 2 };
}

// ------------------------------------------------- Лагранж и МНК (ЛР3–4)

/** Коэффициенты многочлена Лагранжа (от свободного члена) и значение в x0. */
export function lagrange(xs: number[], ys: number[]): { coef: number[]; at: (x: number) => number } {
  const n = xs.length;
  if (new Set(xs).size !== n) throw new Error("Узлы интерполяции должны быть различными");
  const coef = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let basis = [1];
    let denom = 1;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      basis = basis.map((c, k) => -xs[j] * c + (k > 0 ? basis[k - 1] : 0)).concat([basis[basis.length - 1]]);
      denom *= xs[i] - xs[j];
    }
    basis.forEach((c, k) => (coef[k] += (ys[i] * c) / denom));
  }
  const at = (x: number) => {
    // значение считается по базисным многочленам — точнее, чем по развёрнутым коэффициентам
    let s = 0;
    for (let i = 0; i < n; i++) {
      let t = ys[i];
      for (let j = 0; j < n; j++) if (j !== i) t *= (x - xs[j]) / (xs[i] - xs[j]);
      s += t;
    }
    return s;
  };
  return { coef, at };
}

/** МНК: многочлен степени deg через нормальные уравнения. */
export function leastSquares(xs: number[], ys: number[], deg: number): { coef: number[]; residual: number } {
  const n = deg + 1;
  const a: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => xs.reduce((s, x) => s + x ** (i + j), 0)));
  const b = Array.from({ length: n }, (_, i) => xs.reduce((s, x, k) => s + ys[k] * x ** i, 0));
  const { x: coef } = gauss(a, b);
  const residual = xs.reduce((s, x, k) => s + (coef.reduce((p, c, i) => p + c * x ** i, 0) - ys[k]) ** 2, 0);
  return { coef, residual };
}

// ---------------------------------------------------- задача Коши (ЛР5)

export interface OdeRow {
  x: number;
  euler: number;
  eulerCauchy: number;
  rk4: number;
}

/**
 * Эйлер; Эйлер–Коши как в примере: прогноз y10 = y0 + h·f(x0, y0), затем
 * y11 = y0 + h/2·(f(x0, y0) + f(x1, y10)), пока |y11 − y10| > eps; Рунге–Кутта 4.
 */
export function cauchy(f: (x: number, y: number) => number, a: number, b: number, h: number, y0: number, eps: number): OdeRow[] {
  const n = Math.round((b - a) / h);
  const rows: OdeRow[] = [{ x: a, euler: y0, eulerCauchy: y0, rk4: y0 }];
  let [ye, yc, yr] = [y0, y0, y0];
  for (let i = 1; i <= n; i++) {
    const x0 = a + h * (i - 1);
    const x1 = a + h * i;
    ye = ye + h * f(x0, ye);
    let y10 = yc + h * f(x0, yc);
    let y11 = yc + (h / 2) * (f(x0, yc) + f(x1, y10));
    for (let it = 0; it < 100 && Math.abs(y11 - y10) > eps; it++) {
      y10 = y11;
      y11 = yc + (h / 2) * (f(x0, yc) + f(x1, y10));
    }
    yc = y11;
    const k1 = h * f(x0, yr);
    const k2 = h * f(x0 + h / 2, yr + k1 / 2);
    const k3 = h * f(x0 + h / 2, yr + k2 / 2);
    const k4 = h * f(x1, yr + k3);
    yr = yr + (k1 + 2 * k2 + 2 * k3 + k4) / 6;
    rows.push({ x: x1, euler: ye, eulerCauchy: yc, rk4: yr });
  }
  return rows;
}

// ------------------------------------ краевые задачи (индивидуальное задание)

/**
 * Теплопроводность u_t = a²u_xx на [0, 1] — как в примере методички:
 * τ = h²/(2a²) (σ = a²τ/h² = 1/2), начальный слой целиком по φ(x), включая
 * концы; на следующих слоях концы — ψ1(t) и ψ2(t), внутри
 * u(i, j+1) = σ(u(i−1, j) + u(i+1, j)) + (1 − 2σ)u(i, j).
 */
export function heatExplicit(phi: (x: number) => number, psi1: (t: number) => number, psi2: (t: number) => number, a: number, h: number, T: number): { tau: number; sigma: number; x: number[]; t: number[]; u: number[][] } {
  const tau = (h * h) / (2 * a * a);
  const sigma = (a * a * tau) / (h * h);
  const nx = Math.round(1 / h);
  const nt = Math.round(T / tau);
  const x = Array.from({ length: nx + 1 }, (_, i) => +(i * h).toFixed(10));
  const t = Array.from({ length: nt + 1 }, (_, j) => +(j * tau).toFixed(10));
  const u: number[][] = [x.map((xi) => phi(xi))];
  for (let j = 1; j <= nt; j++) {
    const p = u[j - 1];
    u.push(x.map((_, i) => (i === 0 ? psi1(t[j]) : i === nx ? psi2(t[j]) : sigma * (p[i - 1] + p[i + 1]) + (1 - 2 * sigma) * p[i])));
  }
  return { tau, sigma, x, t, u };
}

/**
 * Колебания струны u_tt = a²u_xx — как в примере методички: τ = 0,06, первый
 * слой u(x, τ) = φ1(x) + τ·φ2(x), концы на каждом слое — ψ1(t), ψ2(t), внутри
 * u(i, j+1) = −u(i, j−1) + λ²(u(i−1, j) + u(i+1, j)) + c·u(i, j), λ = aτ/h.
 * Верный коэффициент c = 2(1 − λ²); в методичке напечатано 2 − λ² —
 * `asInMethod` воспроизводит её числа.
 */
export function waveExplicit(phi1: (x: number) => number, phi2: (x: number) => number, psi1: (t: number) => number, psi2: (t: number) => number, a: number, h: number, tau: number, layers: number, asInMethod = false): { lambda2: number; x: number[]; t: number[]; u: number[][] } {
  const nx = Math.round(1 / h);
  const x = Array.from({ length: nx + 1 }, (_, i) => +(i * h).toFixed(10));
  const t = Array.from({ length: layers + 1 }, (_, j) => +(j * tau).toFixed(10));
  const lambda2 = (tau * tau * a * a) / (h * h);
  const c = asInMethod ? 2 - lambda2 : 2 * (1 - lambda2);
  const edge = (row: number[], tj: number) => row.map((v, i) => (i === 0 ? psi1(tj) : i === nx ? psi2(tj) : v));
  const u: number[][] = [edge(x.map((xi) => phi1(xi)), t[0]), edge(x.map((xi) => phi1(xi) + tau * phi2(xi)), t[1])];
  for (let j = 2; j <= layers; j++) {
    const p = u[j - 1];
    const q = u[j - 2];
    u.push(edge(x.map((_, i) => (i === 0 || i === nx ? 0 : -q[i] + lambda2 * (p[i - 1] + p[i + 1]) + c * p[i])), t[j]));
  }
  return { lambda2, x, t, u };
}
