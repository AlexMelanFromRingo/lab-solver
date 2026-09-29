/**
 * ПК, 2-й семестр, ЛР 1 — генератори псевдовипадкових чисел за лекцією 22:
 * метод серединних квадратів (фон Нейман: R0 — n-значне, R0² доповнюється
 * нулями до 2n цифр, середина — нове R0 і число 0.ghij), серединних добутків,
 * перемішування (циклічні зсуви на 1/4 комірки й сума без переносу за межі
 * комірки) і лінійний конгруентний; окремо — двійковий варіант серединних
 * квадратів на 32 бітах (середні 32 біти 64-бітного квадрата). Для кожного —
 * передперіод і період послідовності або виродження в нуль.
 */

export interface PrngStep {
  /** Стан, з якого зроблено крок. */
  from: string;
  /** Проміжний результат (квадрат, добуток, зсуви). */
  work: string;
  /** Нове значення стану. */
  next: number;
  /** Випадкове число на виході. */
  out: string;
}

export interface PrngRun {
  steps: PrngStep[];
  /** Номер кроку, з якого послідовність повторюється, і довжина циклу. */
  prePeriod?: number;
  period?: number;
  degenerate: boolean;
}

/** Шукає повтор стану; state — ключ стану (для середини добутків — пара). */
function finish(steps: PrngStep[], keys: string[]): PrngRun {
  const seen = new Map<string, number>();
  let prePeriod: number | undefined;
  let period: number | undefined;
  keys.forEach((k, i) => {
    if (period !== undefined) return;
    const j = seen.get(k);
    if (j !== undefined) {
      prePeriod = j;
      period = i - j;
    } else seen.set(k, i);
  });
  return { steps, prePeriod, period, degenerate: steps.some((s) => s.next === 0) };
}

const pad = (v: number | bigint, n: number) => v.toString().padStart(n, "0");

/** Середина 2n-значного числа: цифри з n/2 по 3n/2. */
const middle = (s: string, n: number) => Number(s.slice(Math.floor(n / 2), Math.floor(n / 2) + n));

export function middleSquare(r0: number, n: number, count: number): PrngRun {
  const steps: PrngStep[] = [];
  const keys = [String(r0)];
  let r = r0;
  for (let i = 0; i < count; i++) {
    const sq = pad(BigInt(r) * BigInt(r), 2 * n);
    const next = middle(sq, n);
    steps.push({ from: pad(r, n), work: sq, next, out: `0.${pad(next, n)}` });
    r = next;
    keys.push(String(r));
    if (r === 0) break;
  }
  return finish(steps, keys);
}

/** R_{k+1} = середина(R_k · R_{k−1}). */
export function middleProduct(r0: number, r1: number, n: number, count: number): PrngRun {
  const steps: PrngStep[] = [];
  let [a, b] = [r0, r1];
  const keys = [`${a},${b}`];
  for (let i = 0; i < count; i++) {
    const pr = pad(BigInt(a) * BigInt(b), 2 * n);
    const next = middle(pr, n);
    steps.push({ from: `${pad(a, n)} · ${pad(b, n)}`, work: pr, next, out: `0.${pad(next, n)}` });
    [a, b] = [b, next];
    keys.push(`${a},${b}`);
    if (next === 0) break;
  }
  return finish(steps, keys);
}

/** Перемішування в комірці з bits розрядів: R* = rotl(R, bits/4), R** = rotr(R, bits/4), R = (R* + R**) mod 2^bits. */
export function shuffle(r0: number, bits: number, count: number): PrngRun {
  const mask = (1 << bits) - 1;
  const k = Math.max(1, Math.floor(bits / 4));
  const rotl = (x: number) => ((x << k) | (x >>> (bits - k))) & mask;
  const rotr = (x: number) => ((x >>> k) | (x << (bits - k))) & mask;
  const bin = (x: number) => x.toString(2).padStart(bits, "0");
  const steps: PrngStep[] = [];
  let r = r0 & mask;
  const keys = [String(r)];
  for (let i = 0; i < count; i++) {
    const a = rotl(r);
    const b = rotr(r);
    const next = (a + b) & mask;
    steps.push({ from: `${bin(r)} (${r})`, work: `${bin(a)} + ${bin(b)} = ${(a + b).toString(2)}`, next, out: `${bin(next)} = ${next}` });
    r = next;
    keys.push(String(r));
    if (r === 0) break;
  }
  return finish(steps, keys);
}

export function lcg(a: number, c: number, m: number, x0: number, count: number): PrngRun {
  const steps: PrngStep[] = [];
  let x = x0 % m;
  const keys = [String(x)];
  for (let i = 0; i < count; i++) {
    const next = Number((BigInt(a) * BigInt(x) + BigInt(c)) % BigInt(m));
    steps.push({ from: String(x), work: `(${a}·${x} + ${c}) mod ${m}`, next, out: (next / m).toFixed(6) });
    x = next;
    keys.push(String(x));
  }
  return finish(steps, keys);
}

/** Двійковий варіант: seed³² → квадрат 64 біти → біти 16…47. */
export function middleSquare32(seed: number, count: number, max = 100): PrngRun {
  const steps: PrngStep[] = [];
  let s = BigInt(seed >>> 0);
  const keys = [s.toString()];
  for (let i = 0; i < count; i++) {
    const sq = s * s;
    const next = (sq >> 16n) & 0xffffffffn;
    steps.push({ from: s.toString(), work: `0x${sq.toString(16).toUpperCase().padStart(16, "0")}`, next: Number(next), out: String(Number(next % BigInt(max))) });
    s = next;
    keys.push(s.toString());
    if (s === 0n) break;
  }
  return finish(steps, keys);
}
