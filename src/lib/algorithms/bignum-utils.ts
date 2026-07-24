/**
 * Общие примитивы длинной арифметики на BigInt, используются модулями RSA,
 * тестов на простоту и Китайской теоремы об остатках.
 */

export function absBig(a: bigint): bigint {
  return a < 0n ? -a : a;
}

export function gcd(a: bigint, b: bigint): bigint {
  a = absBig(a);
  b = absBig(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Расширенный алгоритм Евклида: возвращает [g, x, y] такие, что a*x + b*y = g = gcd(a,b). */
export function extGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

export function modInverse(a: bigint, m: bigint): bigint | null {
  const [g, x] = extGcd(((a % m) + m) % m, m);
  if (g !== 1n) return null;
  return ((x % m) + m) % m;
}

export function modExp(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/** Простой LCG (линейный конгруэнтный генератор) — учебный ГПСЧ для воспроизводимого поиска
 *  кандидатов в простые числа, как в курсовых работах (свой ГПСЧ вместо crypto.getRandomValues). */
export class LCG {
  private state: bigint;
  private readonly a = 6364136223846793005n;
  private readonly c = 1442695040888963407n;
  private readonly m = 1n << 64n;

  constructor(seed: bigint) {
    this.state = seed & (this.m - 1n);
  }

  next(): bigint {
    this.state = (this.a * this.state + this.c) & (this.m - 1n);
    return this.state;
  }

  nextBits(bits: number): bigint {
    let out = 0n;
    let got = 0;
    while (got < bits) {
      out = (out << 64n) | this.next();
      got += 64;
    }
    const excess = got - bits;
    return out >> BigInt(excess);
  }

  /** Случайное нечётное число с заданной битностью (старший и младший биты выставлены в 1). */
  randomOdd(bits: number): bigint {
    let v = this.nextBits(bits);
    v |= 1n; // нечётное
    v |= 1n << BigInt(bits - 1); // старший бит — гарантирует нужную битность
    return v;
  }
}

export function jacobiSymbol(aIn: bigint, nIn: bigint): number {
  let a = ((aIn % nIn) + nIn) % nIn;
  let n = nIn;
  let result = 1;
  while (a !== 0n) {
    while (a % 2n === 0n) {
      a /= 2n;
      const r = n % 8n;
      if (r === 3n || r === 5n) result = -result;
    }
    [a, n] = [n, a];
    if (a % 4n === 3n && n % 4n === 3n) result = -result;
    a %= n;
  }
  return n === 1n ? result : 0;
}

export function randomBigIntBits(bits: number): bigint {
  const bytes = Math.ceil(bits / 8);
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let v = 0n;
  for (const b of arr) v = (v << 8n) | BigInt(b);
  const excess = bytes * 8 - bits;
  v >>= BigInt(excess);
  v |= 1n << BigInt(bits - 1);
  v |= 1n;
  return v;
}
