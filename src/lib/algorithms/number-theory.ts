/**
 * Алгоритм Евклида (НСД/НСК) и линейное сравнение ax≡b(mod n) — Лабы 1_1 и 4_1,
 * курс "Математичні основи інфобезпеки" (2 курс). Портировано с реального C++ кода
 * из отчётов (variant 14: НСД(1634,104)=2, НСК=84968 — проверено и совпадает).
 *
 * Важная деталь из реального кода Лабы 4_1: get_gcd печатает таблицу коэффициентов
 * расширенного Евклида (x,y — коэффициенты Безу), но сама linear_congruence их не
 * использует — обратный элемент ищется отдельным перебором i=1..n-1, пока
 * (a·i) mod n == 1. Это соответствует реальному коду, а не более быстрой "книжной"
 * версии через x из расширенного Евклида — оставлено как есть, потому что численно
 * даёт тот же результат, а перебор пригоден при небольших n (как в вариантах лабы).
 */

export function gcd(a: number, b: number): number {
  let r: number;
  do {
    r = a % b;
    a = b;
    b = r;
  } while (r !== 0);
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export interface EuclidStep {
  remainder: number;
  quotient: number | null;
  x: number;
  y: number;
}

export interface EuclidTrace {
  steps: EuclidStep[];
  gcd: number;
}

/** Таблица расширенного Евклида — те же переменные (x,y,u,v) и тот же порядок шагов, что в get_gcd(). */
export function extendedEuclidTrace(aIn: number, bIn: number): EuclidTrace {
  let a = aIn;
  let b = bIn;
  let x = 0,
    y = 1,
    u = 1,
    v = 0;
  const steps: EuclidStep[] = [{ remainder: a, quotient: null, x: 1, y: 0 }];

  while (a !== 0) {
    const q = Math.floor(b / a);
    const r = b % a;
    const m = x - u * q;
    const nn = y - v * q;
    b = a;
    a = r;
    x = u;
    y = v;
    u = m;
    v = nn;
    if (r !== 0) steps.push({ remainder: r, quotient: q, x: u, y: v });
  }

  return { steps, gcd: b };
}

export interface LinearCongruenceStep {
  i: number;
  value: number;
}

export interface LinearCongruenceResult {
  solvable: boolean;
  gcdTrace: EuclidTrace;
  searchSteps: LinearCongruenceStep[];
  alpha: number | null;
  x: number | null;
}

/** Решает a·x ≡ b (mod n): проверяет НОД(a,n)=1 через таблицу расширенного Евклида,
 *  затем ищет обратный элемент α перебором (i·a mod n == 1), x = (α·b) mod n. */
export function solveLinearCongruence(a: number, b: number, n: number): LinearCongruenceResult {
  const gcdTrace = extendedEuclidTrace(a, n);
  if (gcdTrace.gcd !== 1) {
    return { solvable: false, gcdTrace, searchSteps: [], alpha: null, x: null };
  }

  const searchSteps: LinearCongruenceStep[] = [];
  let alpha: number | null = null;
  for (let i = 1; i < n; i++) {
    const value = (a * i) % n;
    searchSteps.push({ i, value });
    if (value === 1) {
      alpha = i;
      break;
    }
  }

  const x = alpha !== null ? (((alpha * b) % n) + n) % n : null;
  return { solvable: true, gcdTrace, searchSteps, alpha, x };
}
