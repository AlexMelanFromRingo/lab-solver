/**
 * Blum-Blum-Shub (BBS) и LFSR — генераторы гаммы, Лаба 5 "Прикладной криптологии".
 * Источник: Univetsity/3rd_year/1st_half/Прикладная криптология/LR5/LR5!BBS_LFSR.docx —
 * там же приведён числовой пример (p=383, q=503 — оба ≡3 (mod 4), n=192649, seed=101355),
 * который используется здесь как встроенный тест на правильность реализации.
 */

function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (let d = 2n; d * d <= n; d++) if (n % d === 0n) return false;
  return true;
}

export interface BbsStep {
  i: number;
  x: bigint;
  bit: number;
}

export interface BbsResult {
  n: bigint;
  x0: bigint;
  steps: BbsStep[];
  keystream: number[];
}

/** X0=s² mod n; Xi=X(i-1)² mod n; Bi=Xi mod 2 — классический генератор BBS. */
export function generateBBS(p: bigint, q: bigint, seed: bigint, bitsCount: number): BbsResult {
  if (p % 4n !== 3n || q % 4n !== 3n) {
    throw new Error("p и q должны быть ≡ 3 (mod 4) — иначе BBS не гарантирует свои криптографические свойства");
  }
  const n = p * q;
  if (gcdBig(seed, n) !== 1n) throw new Error("seed должен быть взаимно прост с n");

  let x = (seed * seed) % n;
  const x0 = x;
  const steps: BbsStep[] = [];
  const keystream: number[] = [];
  for (let i = 1; i <= bitsCount; i++) {
    x = (x * x) % n;
    const bit = Number(x % 2n);
    steps.push({ i, x, bit });
    keystream.push(bit);
  }
  return { n, x0, steps, keystream };
}

function gcdBig(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function xorWithKeystream(bits: number[], keystream: number[]): number[] {
  return bits.map((b, i) => b ^ keystream[i % keystream.length]);
}

export function bitsToHexString(bits: number[]): string {
  let out = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4);
    while (nibble.length < 4) nibble.push(0);
    out += parseInt(nibble.join(""), 2).toString(16);
  }
  return out;
}

/** Встроенный проверочный пример из LR5!BBS_LFSR.docx. */
export function bbsWorkedExample(): { p: bigint; q: bigint; seed: bigint } {
  return { p: 383n, q: 503n, seed: 101355n };
}

// ── LFSR (регистр сдвига с линейной обратной связью, тот же документ) ──────────
export interface LfsrStep {
  i: number;
  state: number[];
  outputBit: number;
}

export interface LfsrResult {
  steps: LfsrStep[];
  keystream: number[];
}

/** Фибоначчиева LFSR: taps — индексы битов состояния (0 = самый левый), XOR которых
 *  подаётся обратно на вход; выходной бит на каждом шаге — крайний правый бит состояния. */
export function generateLFSR(initialState: number[], taps: number[], stepsCount: number): LfsrResult {
  let state = [...initialState];
  const steps: LfsrStep[] = [];
  const keystream: number[] = [];
  for (let i = 1; i <= stepsCount; i++) {
    const feedback = taps.reduce((acc, t) => acc ^ state[t], 0);
    const outputBit = state[state.length - 1];
    state = [feedback, ...state.slice(0, -1)];
    steps.push({ i, state: [...state], outputBit });
    keystream.push(outputBit);
  }
  return { steps, keystream };
}

export { isProbablePrime };
