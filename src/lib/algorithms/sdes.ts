/**
 * S-DES — портировано 1:1 с реального решателя студента:
 * Univetsity/3rd_year/2nd_half/Cryptology/Криптология/Лаба 4 S-DES/Optimized3.py
 *
 * Таблицы перестановок и порядок шагов взяты дословно оттуда же. Важно: S-box здесь
 * НЕ канонические учебные (Schaefer) — они отличаются на пару значений от версии из
 * большинства учебников, но именно эти были в реальном решателе, которым сдавали лабу,
 * так что тут воспроизведены именно они, а не "исправленный" общий вариант.
 */

type Bits = number[]; // массив 0/1, старший бит первым

const P10 = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6];
const P8 = [6, 3, 7, 4, 8, 5, 10, 9];
const IP = [2, 6, 3, 1, 4, 8, 5, 7];
const IP_INV = [4, 1, 3, 5, 7, 2, 8, 6];
const EP = [4, 1, 2, 3, 2, 3, 4, 1];
const P4 = [2, 4, 3, 1];

// Именно эти значения — из реального Optimized3.py (не общеучебные Schaefer S-box).
const S0 = [
  [1, 0, 3, 2],
  [3, 2, 1, 0],
  [0, 2, 1, 3],
  [3, 1, 3, 1],
];

const S1 = [
  [1, 1, 2, 3],
  [2, 0, 1, 3],
  [3, 0, 1, 0],
  [2, 1, 0, 3],
];

function permute(bits: Bits, table: number[]): Bits {
  return table.map((i) => bits[i - 1]);
}

function leftShift(bits: Bits, n: number): Bits {
  let left = bits.slice(0, 5);
  let right = bits.slice(5);
  for (let s = 0; s < n; s++) {
    left = [...left.slice(1), left[0]];
    right = [...right.slice(1), right[0]];
  }
  return [...left, ...right];
}

function xorBits(a: Bits, b: Bits): Bits {
  return a.map((v, i) => v ^ b[i]);
}

function bitsToNum(bits: Bits): number {
  return bits.reduce((acc, b) => (acc << 1) | b, 0);
}

export function numToBits(n: number, width: number): Bits {
  const out: Bits = [];
  for (let i = width - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function sBoxLookup(bits4: Bits, table: number[][]): number {
  const row = (bits4[0] << 1) | bits4[3];
  const col = (bits4[1] << 1) | bits4[2];
  return table[row][col];
}

function numToBits2(n: number): Bits {
  return [(n >> 1) & 1, n & 1];
}

export interface KeyGenTrace {
  p10: Bits;
  shifted1: Bits;
  k1: Bits;
  shifted3: Bits; // "double left shifted" — сдвиг ещё на 2 от shifted1, итого на 3 от p10
  k2: Bits;
}

/** Дословно generate_keys() из Optimized3.py — тот же порядок и та же арифметика сдвигов. */
export function generateKeys(key10: Bits): KeyGenTrace {
  const p10 = permute(key10, P10);
  const shifted1 = leftShift(p10, 1);
  const k1 = permute(shifted1, P8);
  const shifted3 = leftShift(shifted1, 2);
  const k2 = permute(shifted3, P8);
  return { p10, shifted1, k1, shifted3, k2 };
}

export interface RoundTrace {
  ep: Bits;
  sum: Bits;
  s0Out: Bits;
  s1Out: Bits;
  p4Out: Bits;
  li: Bits;
  ri: Bits;
  output: Bits;
}

/** Дословно round_function() из Optimized3.py. */
export function roundFunction(data: Bits, key: Bits): RoundTrace {
  const left = data.slice(0, 4);
  const right = data.slice(4);
  const ep = permute(right, EP);
  const sum = xorBits(ep, key);
  const s0Out = numToBits2(sBoxLookup(sum.slice(0, 4), S0));
  const s1Out = numToBits2(sBoxLookup(sum.slice(4), S1));
  const p4Out = permute([...s0Out, ...s1Out], P4);
  const li = xorBits(left, p4Out);
  const ri = right;
  return { ep, sum, s0Out, s1Out, p4Out, li, ri, output: [...li, ...ri] };
}

export interface SdesFullTrace {
  keys: KeyGenTrace;
  ip: Bits;
  round1: RoundTrace;
  swapped: Bits;
  round2: RoundTrace;
  output: Bits;
}

/** Дословно encrypt()/decrypt() из Optimized3.py — при decrypt меняются местами key1/key2. */
function run(data: Bits, key10: Bits, order: "encrypt" | "decrypt"): SdesFullTrace {
  const keys = generateKeys(key10);
  const [first, second] = order === "encrypt" ? [keys.k1, keys.k2] : [keys.k2, keys.k1];

  const ip = permute(data, IP);
  const round1 = roundFunction(ip, first);
  const swapped = [...round1.output.slice(4), ...round1.output.slice(0, 4)];
  const round2 = roundFunction(swapped, second);
  const output = permute(round2.output, IP_INV);

  return { keys, ip, round1, swapped, round2, output };
}

export function encryptByte(byte: number, key10: number): SdesFullTrace {
  return run(numToBits(byte, 8), numToBits(key10, 10), "encrypt");
}

export function decryptByte(byte: number, key10: number): SdesFullTrace {
  return run(numToBits(byte, 8), numToBits(key10, 10), "decrypt");
}

export function bitsToString(bits: Bits): string {
  return bits.join("");
}

export { bitsToNum };
