/**
 * Код Хэмминга (7,4) с расширением до (8,4) SEC-DED — портировано с сохранением
 * логики из error-codes-explorer/src/app/pages/hamming/hamming.ts (Angular-сигналы
 * превращены в чистые функции).
 */

export interface HammingEncoded {
  codeword: number[]; // 7 бит, либо 8 с расширенным битом чётности в начале
  extended: boolean;
}

export function encode(dataBits: number[], extended: boolean): HammingEncoded {
  const d = dataBits;
  const p1 = d[0] ^ d[1] ^ d[3];
  const p2 = d[0] ^ d[2] ^ d[3];
  const p4 = d[1] ^ d[2] ^ d[3];
  const core = [p1, p2, d[0], p4, d[1], d[2], d[3]];
  if (extended) {
    const p0 = core.reduce((a, b) => a ^ b, 0);
    return { codeword: [p0, ...core], extended: true };
  }
  return { codeword: core, extended: false };
}

export function injectError(codeword: number[], position: number | null): number[] {
  const out = [...codeword];
  if (position !== null && position >= 0 && position < out.length) out[position] ^= 1;
  return out;
}

export interface Syndrome {
  s1: number;
  s2: number;
  s4: number;
  value: number;
}

export function computeSyndrome(received: number[], extended: boolean): Syndrome {
  const word = extended ? received.slice(1) : received;
  const s1 = word[0] ^ word[2] ^ word[4] ^ word[6];
  const s2 = word[1] ^ word[2] ^ word[5] ^ word[6];
  const s4 = word[3] ^ word[4] ^ word[5] ^ word[6];
  return { s1, s2, s4, value: s1 * 1 + s2 * 2 + s4 * 4 };
}

export interface CorrectionResult {
  word: number[];
  errorAt: number;
  message: string;
}

export function correct(received: number[], extended: boolean): CorrectionResult {
  const r = [...received];
  const syn = computeSyndrome(received, extended);

  if (syn.value === 0) {
    if (extended) {
      const overallParity = r.reduce((a, b) => a ^ b, 0);
      if (overallParity !== 0) {
        return { word: r, errorAt: 0, message: "Ошибка в самом бите общей чётности (p0) — исправлена" };
      }
    }
    return { word: r, errorAt: -1, message: "Ошибок не обнаружено" };
  }

  const errorIdx = extended ? syn.value : syn.value - 1;
  if (errorIdx >= 0 && errorIdx < r.length) {
    r[errorIdx] ^= 1;
    return { word: r, errorAt: errorIdx, message: `Ошибка в позиции ${syn.value} — исправлена` };
  }
  return { word: r, errorAt: -1, message: "Синдром указывает за пределы слова" };
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function extractData(codeword: number[], extended: boolean): number[] {
  const core = extended ? codeword.slice(1) : codeword;
  // позиции 3,5,6,7 (1-индексация) содержат данные d1..d4
  return [core[2], core[4], core[5], core[6]];
}
