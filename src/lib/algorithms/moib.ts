/**
 * «Математичні основи інформаційної безпеки» — Пахомова В.М., методичні
 * рекомендації до лабораторних робіт (МОІБ_лаб_2024) і курсового завдання
 * (МОІБ_курс_2024). Все таблицы строятся так же, как в контрольных примерах:
 * НСД(1234, 54) = 2, НСК = 33318, 1234/54 = [22; 1, 5, 1, 3]; 60 = 2²·3·5,
 * τ = 12, σ = 168; 45 = 9·5 по Ферма; 7x ≡ 3 (mod 15) → x ≡ 9; тест Миллера для
 * 561 по основанию 2: 263, 166, 67, 1; Соловей–Штрассен 2023, a = 792 → 932 ≠ +1.
 */

// ------------------------------------------------------------ общие функции

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export const mod = (a: number, m: number) => ((a % m) + m) % m;

export function modPow(base: number, exp: number, m: number): number {
  let r = 1n;
  let b = BigInt(mod(base, m));
  let e = BigInt(exp);
  const M = BigInt(m);
  while (e > 0n) {
    if (e & 1n) r = (r * b) % M;
    b = (b * b) % M;
    e >>= 1n;
  }
  return Number(r);
}

function sup(n: number): string {
  const d = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return String(n)
    .split("")
    .map((c) => d[Number(c)])
    .join("");
}

// ---------------------------------------------------------- ЛР 1_1: Евклид

export interface EuclidRow {
  a: number;
  b: number;
  q: number;
  r: number;
}

export interface EuclidResult {
  rows: EuclidRow[];
  gcd: number;
  lcm: number;
  /** Элементы цепной дроби a/b: [a0; a1, …, an]. */
  cf: number[];
}

export function euclid(a: number, b: number): EuclidResult {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) throw new Error("a и b — натуральные числа");
  const rows: EuclidRow[] = [];
  let [x, y] = [a, b];
  while (y !== 0) {
    const q = Math.floor(x / y);
    const r = x % y;
    rows.push({ a: x, b: y, q, r });
    [x, y] = [y, r];
  }
  return { rows, gcd: x, lcm: (a / x) * b, cf: rows.map((r) => r.q) };
}

/** Короткая форма цепной дроби: [a0; a1, a2, …]. */
export function cfShort(cf: number[]): string {
  return cf.length === 1 ? `[${cf[0]}]` : `[${cf[0]}; ${cf.slice(1).join(", ")}]`;
}

/** Полная форма одной строкой: a0 + 1/(a1 + 1/(a2 + …)). */
export function cfFull(cf: number[]): string {
  const tail = cf.slice(1);
  if (tail.length === 0) return String(cf[0]);
  let s = String(tail[tail.length - 1]);
  for (let i = tail.length - 2; i >= 0; i--) s = `${tail[i]} + 1/(${s})`;
  return `${cf[0]} + 1/(${s})`;
}

/** Подходящие дроби p_k/q_k (таблица из контрольных вопросов). */
export function convergents(cf: number[]): { k: number; a: number; p: number; q: number }[] {
  const out: { k: number; a: number; p: number; q: number }[] = [];
  let [p2, p1, q2, q1] = [0, 1, 1, 0];
  cf.forEach((a, k) => {
    const p = a * p1 + p2;
    const q = a * q1 + q2;
    out.push({ k, a, p, q });
    [p2, p1, q2, q1] = [p1, p, q1, q];
  });
  return out;
}

// ---------------------------------------------- ЛР 1_2: расширенный Евклид

export interface ExtRow {
  r: number;
  q: number | null;
  x: number;
  y: number;
  /** Как получены x и y — запись, как в таблице 1.3. */
  xExpr: string;
  yExpr: string;
}

export interface ExtResult {
  rows: ExtRow[];
  gcd: number;
  x: number;
  y: number;
}

/** Таблица «Залишки — Часткові — x — y»: r_i = a·x_i + b·y_i. */
export function extendedEuclid(a: number, b: number): ExtResult {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) throw new Error("a и b — натуральные числа");
  const rows: ExtRow[] = [
    { r: a, q: null, x: 1, y: 0, xExpr: "1", yExpr: "0" },
    { r: b, q: null, x: 0, y: 1, xExpr: "0", yExpr: "1" },
  ];
  const par = (n: number) => (n < 0 ? `(${n})` : String(n));
  while (rows[rows.length - 1].r !== 0) {
    const [p, c] = [rows[rows.length - 2], rows[rows.length - 1]];
    const q = Math.floor(p.r / c.r);
    const r = p.r - q * c.r;
    if (r === 0) {
      rows.push({ r: 0, q, x: NaN, y: NaN, xExpr: "", yExpr: "" });
      break;
    }
    rows.push({
      r,
      q,
      x: p.x - q * c.x,
      y: p.y - q * c.y,
      xExpr: `${par(p.x)} − ${q}·${par(c.x)} = ${p.x - q * c.x}`,
      yExpr: `${par(p.y)} − ${q}·${par(c.y)} = ${p.y - q * c.y}`,
    });
  }
  const last = rows[rows.length - 2];
  return { rows, gcd: last.r, x: last.x, y: last.y };
}

// ------------------------------------------------ ЛР 2_1: метод проб

export interface Factorization {
  n: number;
  factors: [number, number][];
  /** Простые делители в порядке нахождения: F, n/F. */
  steps: { n: number; f: number; tried: number }[];
}

/** Деление методом проб: наименьший простой делитель, затем то же для частного. */
export function trialFactor(n: number): Factorization {
  if (!Number.isInteger(n) || n < 2) throw new Error("n — натуральное число больше 1");
  const steps: { n: number; f: number; tried: number }[] = [];
  const counts = new Map<number, number>();
  let m = n;
  while (m > 1) {
    let f = 2;
    let tried = 1;
    while (f * f <= m && m % f !== 0) {
      f++;
      tried++;
    }
    if (f * f > m) f = m;
    steps.push({ n: m, f, tried });
    counts.set(f, (counts.get(f) ?? 0) + 1);
    m /= f;
  }
  return { n, factors: [...counts.entries()].sort((x, y) => x[0] - y[0]), steps };
}

export const canonical = (f: [number, number][]) => f.map(([p, k]) => (k === 1 ? `${p}` : `${p}${sup(k)}`)).join("·");

/** τ(n) и σ(n) с записью формулы, как в контрольном примере для 60. */
export function divisorFunctions(f: [number, number][]): { tau: number; sigma: number; tauExpr: string; sigmaExpr: string } {
  const tau = f.reduce((a, [, k]) => a * (k + 1), 1);
  const sigma = f.reduce((a, [p, k]) => a * ((p ** (k + 1) - 1) / (p - 1)), 1);
  return {
    tau,
    sigma,
    tauExpr: f.map(([, k]) => `(${k}+1)`).join("·") + ` = ${tau}`,
    sigmaExpr: f.map(([p, k]) => `(${p}${sup(k + 1)}−1)/(${p}−1)`).join("·") + ` = ${sigma}`,
  };
}

/** НСД и НСК по каноническим разложениям (формулы 6 и 7). */
export function gcdLcmByFactors(a: number, b: number): { primes: number[]; ka: number[]; kb: number[]; gcd: number; lcm: number; gcdExpr: string; lcmExpr: string } {
  const fa = new Map(trialFactor(a).factors);
  const fb = new Map(trialFactor(b).factors);
  const primes = [...new Set([...fa.keys(), ...fb.keys()])].sort((x, y) => x - y);
  const ka = primes.map((p) => fa.get(p) ?? 0);
  const kb = primes.map((p) => fb.get(p) ?? 0);
  const t = primes.map((_, i) => Math.min(ka[i], kb[i]));
  const s = primes.map((_, i) => Math.max(ka[i], kb[i]));
  const val = (e: number[]) => primes.reduce((acc, p, i) => acc * p ** e[i], 1);
  const expr = (e: number[]) => primes.map((p, i) => `${p}${sup(e[i])}`).join("·");
  return { primes, ka, kb, gcd: val(t), lcm: val(s), gcdExpr: `${expr(t)} = ${val(t)}`, lcmExpr: `${expr(s)} = ${val(s)}` };
}

// ------------------------------------------------------- ЛР 2_2: Ферма

export interface FermatStep {
  x: bigint;
  diff: bigint;
  y: bigint | null;
}

export interface FermatResult {
  n: bigint;
  start: bigint;
  steps: FermatStep[];
  x: bigint;
  y: bigint;
  /** n — простое: дошли до x = (n + 1)/2. */
  prime: boolean;
  exactSquare: boolean;
}

function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}

/** Алгоритм Ферма для нечётного n: x = ⌈√n⌉, ищем x² − n = y². */
export function fermatFactor(nIn: number | bigint, limit = 100000): FermatResult {
  const n = BigInt(nIn);
  if (n < 3n || n % 2n === 0n) throw new Error("Алгоритм Ферма — для нечётного n > 1");
  const s = isqrt(n);
  if (s * s === n) return { n, start: s, steps: [], x: s, y: 0n, prime: false, exactSquare: true };
  let x = s + 1n;
  const steps: FermatStep[] = [];
  const stop = (n + 1n) / 2n;
  for (let i = 0; i < limit; i++) {
    const diff = x * x - n;
    const y = isqrt(diff);
    const ok = y * y === diff;
    steps.push({ x, diff, y: ok ? y : null });
    if (ok) return { n, start: s, steps, x, y, prime: x === stop, exactSquare: false };
    if (x >= stop) break;
    x++;
  }
  return { n, start: s, steps, x, y: 0n, prime: true, exactSquare: false };
}

// ------------------------------------------ ЛР 3_1: решето Эратосфена

/** Вектор по нечётным числам, как в алгоритме методички: ячейка j — число 2j+1. */
export function sieveSteps(n: number): { primes: number[]; crossed: { p: number; removed: number[] }[] } {
  const size = Math.floor((n - 1) / 2);
  const v = new Array(size + 1).fill(1);
  v[0] = 0;
  const crossed: { p: number; removed: number[] }[] = [];
  for (let p = 3; p * p <= n; p += 2) {
    if (!v[(p - 1) / 2]) continue;
    const removed: number[] = [];
    for (let t = p * p; t <= n; t += 2 * p) {
      if (v[(t - 1) / 2]) removed.push(t);
      v[(t - 1) / 2] = 0;
    }
    crossed.push({ p, removed });
  }
  const primes = n >= 2 ? [2] : [];
  for (let j = 1; j <= size; j++) if (v[j]) primes.push(2 * j + 1);
  return { primes, crossed };
}

/** Простые числа интервала по десяткам: «40–49: 41, 43, 47». */
export function primesByDecade(lo: number, hi: number): { decade: string; primes: number[] }[] {
  const { primes } = sieveSteps(hi);
  const out: { decade: string; primes: number[] }[] = [];
  for (let d = Math.floor(lo / 10) * 10; d < hi; d += 10) {
    const a = Math.max(d, lo);
    const b = Math.min(d + 9, hi);
    out.push({ decade: `${a}–${b}`, primes: primes.filter((p) => p >= a && p <= b) });
  }
  return out;
}

// ------------------------------------------ ЛР 3_2: линейное сравнение

export interface CongruenceSolution {
  a: number;
  b: number;
  m: number;
  d: number;
  /** Решений нет: b не делится на d. */
  none: boolean;
  /** Сравнение после деления на d. */
  reduced: { a: number; b: number; m: number };
  ext: ExtResult;
  inverse: number;
  x0: number;
  all: number[];
}

/** ax ≡ b (mod m) через расширенный алгоритм Евклида (для m и a/d). */
export function solveCongruence(a: number, b: number, m: number): CongruenceSolution {
  if (m < 2) throw new Error("Модуль m — не меньше 2");
  const d = gcd(a, m);
  const none = mod(b, d) !== 0;
  const ra = mod(a / (none ? 1 : d), m / (none ? 1 : d));
  const rb = mod(b / (none ? 1 : d), m / (none ? 1 : d));
  const rm = m / (none ? 1 : d);
  const ext = extendedEuclid(rm, ra === 0 ? rm : ra);
  const inverse = mod(ext.y, rm);
  const x0 = none ? NaN : mod(rb * inverse, rm);
  const all = none ? [] : Array.from({ length: d }, (_, i) => x0 + i * rm);
  return { a, b, m, d, none, reduced: { a: ra, b: rb, m: rm }, ext, inverse, x0, all };
}

// ------------------------------------------------ ЛР 4_1: тест Миллера

export interface MillerResult {
  n: number;
  b: number;
  k: number;
  q: number;
  /** b^(2^i·q) mod n, i = 0…k. */
  residues: { power: string; value: number }[];
  verdict: "composite" | "inconclusive";
}

export function millerTest(n: number, b: number): MillerResult {
  if (n < 3 || n % 2 === 0) throw new Error("n — нечётное число больше 2");
  let q = n - 1;
  let k = 0;
  while (q % 2 === 0) {
    q /= 2;
    k++;
  }
  const residues: { power: string; value: number }[] = [];
  let r = modPow(b, q, n);
  residues.push({ power: `${q}`, value: r });
  let verdict: MillerResult["verdict"] = "composite";
  if (r === 1 || r === n - 1) verdict = "inconclusive";
  // таблица 4.1: степени q, 2q, …, 2^(k−1)·q — каждое вычисление квадрат предыдущего
  for (let i = 1; i < k; i++) {
    r = modPow(r, 2, n);
    residues.push({ power: `${i === 1 ? "2" : `2${sup(i)}`}·${q}`, value: r });
    if (verdict === "composite" && r === n - 1) verdict = "inconclusive";
  }
  return { n, b, k, q, residues, verdict };
}

// -------------------------------------- ЛР 4_2: тест Соловея–Штрассена

/** Символ Якоби с шагами вычисления. */
export function jacobi(aIn: number, nIn: number): { value: number; steps: string[] } {
  if (nIn <= 0 || nIn % 2 === 0) throw new Error("n — нечётное положительное");
  let a = mod(aIn, nIn);
  let n = nIn;
  let s = 1;
  const steps: string[] = [`J(${aIn}; ${nIn})`];
  if (a !== aIn) steps.push(`= J(${a}; ${n})  — a по модулю n`);
  while (a !== 0) {
    while (a % 2 === 0) {
      a /= 2;
      const r = n % 8;
      if (r === 3 || r === 5) s = -s;
      steps.push(`= ${s < 0 ? "−" : ""}J(${a}; ${n})  — вынесли J(2; ${n}) = ${r === 3 || r === 5 ? "−1" : "+1"} (n mod 8 = ${r})`);
    }
    if (a === 1) break;
    [a, n] = [n, a];
    const flip = a % 4 === 3 && n % 4 === 3;
    if (flip) s = -s;
    a = a % n;
    steps.push(`= ${s < 0 ? "−" : ""}J(${a}; ${n})  — взаимность${flip ? ", оба ≡ 3 (mod 4): знак меняется" : ""}, затем по модулю`);
  }
  const value = n === 1 || a === 1 ? s : 0;
  steps.push(`= ${value > 0 ? "+1" : value}`);
  return { value, steps };
}

export interface SolovayRow {
  a: number;
  gcd: number;
  j: number;
  /** j в записи ±1, как в таблице 4.3. */
  jSigned: string;
  jacobi: number;
  passed: boolean;
}

export function solovayRow(n: number, a: number): SolovayRow {
  const g = gcd(a, n);
  const j = modPow(a, (n - 1) / 2, n);
  const J = g === 1 ? jacobi(a, n).value : 0;
  const jSigned = j === 1 ? "1" : j === n - 1 ? "−1" : String(j);
  return { a, gcd: g, j, jSigned, jacobi: J, passed: g === 1 && mod(J, n) === j };
}

/** Число повторов k: (1/2)^k < ε. */
export const roundsFor = (eps: number) => Math.ceil(Math.log2(1 / eps) + 1e-12);

// ---------------------------------------------------- курсовое, часть 1

export function phi(m: number): { value: number; expr: string } {
  const f = trialFactor(m).factors;
  const value = f.reduce((acc, [p, k]) => acc * (p - 1) * p ** (k - 1), 1);
  return { value, expr: `φ(${m}) = ${m}·${f.map(([p]) => `(1 − 1/${p})`).join("·")} = ${value}` };
}

/** Метод Эйлера для приведённого сравнения: x ≡ b·a^(φ(m)−1) (mod m). */
export function eulerMethod(a: number, b: number, m: number): { phi: string; power: number; x: number; expr: string } {
  const f = phi(m);
  const power = f.value - 1;
  const x = mod(b * modPow(a, power, m), m);
  return { phi: f.expr, power, x, expr: `x ≡ ${b}·${a}${sup(power)} (mod ${m}) ≡ ${x} (mod ${m})` };
}

/** Метод цепных дробей: m/a = [a0; …; ak], x ≡ (−1)^k·b·p_(k−1) (mod m). */
export function continuedFractionMethod(aIn: number, b: number, m: number): { cf: number[]; table: { k: number; a: number; p: number }[]; k: number; pk1: number; x: number; expr: string } {
  const a = mod(aIn, m);
  const { cf } = euclid(m, a);
  const conv = convergents(cf);
  const k = cf.length - 1;
  const pk1 = k === 0 ? 1 : conv[k - 1].p;
  const x = mod((k % 2 === 0 ? 1 : -1) * b * pk1, m);
  return {
    cf,
    table: conv.map((c) => ({ k: c.k, a: c.a, p: c.p })),
    k,
    pk1,
    x,
    expr: `x ≡ (−1)${sup(k)}·${b}·${pk1} (mod ${m}) ≡ ${x} (mod ${m})`,
  };
}

/** Перебор полной системы вычетов: a·x mod m для x = 0…m−1. */
export function residueTrial(a: number, b: number, m: number): { x: number; ax: number; hit: boolean }[] {
  return Array.from({ length: m }, (_, x) => ({ x, ax: mod(a * x, m), hit: mod(a * x, m) === mod(b, m) }));
}

// ---------------------------------------------------- курсовое, часть 2

export interface SystemItem {
  a: number;
  b: number;
  m: number;
}

export interface Reduced {
  c: number;
  m: number;
  from: SystemItem;
  sol: CongruenceSolution;
}

export interface SubstitutionStep {
  c1: number;
  m1: number;
  c2: number;
  m2: number;
  /** x = c1 + m1·t подставляется во второе: m1·t ≡ c2 − c1 (mod m2). */
  t: CongruenceSolution;
  c: number;
  m: number;
}

export interface SystemResult {
  reduced: Reduced[];
  inconsistent: string | null;
  substitution: SubstitutionStep[];
  x: number;
  M: number;
  crt: null | { M: number; rows: { c: number; m: number; Mi: number; y: number; term: number }[]; x0: number };
  pairwiseCoprime: boolean;
}

/** Каждое a·x ≡ b (mod m) → x ≡ c (mod m'), затем подстановка и КТО. */
export function solveSystem(items: SystemItem[]): SystemResult {
  const reduced: Reduced[] = [];
  for (const it of items) {
    const sol = solveCongruence(it.a, it.b, it.m);
    if (sol.none) {
      return { reduced, inconsistent: `${it.a}x ≡ ${it.b} (mod ${it.m}) не имеет решений: НСД(${it.a}, ${it.m}) = ${sol.d} не делит ${it.b}`, substitution: [], x: NaN, M: NaN, crt: null, pairwiseCoprime: false };
    }
    reduced.push({ c: sol.x0, m: sol.reduced.m, from: it, sol });
  }
  // подстановка — как в примере методички: сначала последние два сравнения,
  // затем результат с предыдущим; x выражается через сравнение с меньшим модулем
  const substitution: SubstitutionStep[] = [];
  let [c, m] = [reduced[reduced.length - 1].c, reduced[reduced.length - 1].m];
  for (let i = reduced.length - 2; i >= 0; i--) {
    const other = reduced[i];
    const [b1, b2] = other.m < m ? [{ c: other.c, m: other.m }, { c, m }] : [{ c, m }, { c: other.c, m: other.m }];
    const t = solveCongruence(b1.m, b2.c - b1.c, b2.m);
    if (t.none) {
      return {
        reduced,
        inconsistent: `x ≡ ${b1.c} (mod ${b1.m}) и x ≡ ${b2.c} (mod ${b2.m}) несовместны: ${b2.c} ≢ ${b1.c} (mod ${gcd(b1.m, b2.m)})`,
        substitution,
        x: NaN,
        M: NaN,
        crt: null,
        pairwiseCoprime: false,
      };
    }
    const newM = (b1.m / gcd(b1.m, b2.m)) * b2.m;
    const newC = mod(b1.c + b1.m * t.x0, newM);
    substitution.push({ c1: b1.c, m1: b1.m, c2: b2.c, m2: b2.m, t, c: newC, m: newM });
    [c, m] = [newC, newM];
  }
  const ms = reduced.map((r) => r.m);
  const pairwiseCoprime = ms.every((a, i) => ms.every((b, j) => i === j || gcd(a, b) === 1));
  let crt: SystemResult["crt"] = null;
  if (pairwiseCoprime) {
    const M = ms.reduce((a, b) => a * b, 1);
    const rows = reduced.map((r) => {
      const Mi = M / r.m;
      const y = solveCongruence(Mi, 1, r.m).x0;
      return { c: r.c, m: r.m, Mi, y, term: Mi * y * r.c };
    });
    crt = { M, rows, x0: mod(rows.reduce((a, r) => a + r.term, 0), M) };
  }
  return { reduced, inconsistent: null, substitution, x: c, M: m, crt, pairwiseCoprime };
}
