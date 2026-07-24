/**
 * Циклический код (CRC) — Лаба 5 "Теории информации".
 * Источник: Универ/Теория информации/Лаба 5, Encoding.xlsx (кодирование, внесение ошибки,
 * синдром через деление многочленов по модулю 2, исправление однократной ошибки по таблице
 * синдромов, двукратная — только обнаруживается).
 */

export type GeneratorPoly = "x3+x+1" | "x3+x2+1";

/** g(x)=x³+x+1 -> 1011; g(x)=x³+x²+1 -> 1101 (степень 3, старший бит первым). */
export function generatorBits(poly: GeneratorPoly): number[] {
  return poly === "x3+x+1" ? [1, 0, 1, 1] : [1, 1, 0, 1];
}

export function hexToBits(hex: string, width: number): number[] {
  const v = parseInt(hex, 16);
  const bits: number[] = [];
  for (let i = width - 1; i >= 0; i--) bits.push((v >> i) & 1);
  return bits;
}

export function bitsToString(bits: number[]): string {
  return bits.join("");
}

/** Деление многочлена (представленного битами) на генератор по модулю 2 — возвращает остаток. */
export function polyRemainder(dividendIn: number[], divisor: number[]): number[] {
  const rem = [...dividendIn];
  const dLen = divisor.length;
  for (let i = 0; i <= rem.length - dLen; i++) {
    if (rem[i] === 1) {
      for (let j = 0; j < dLen; j++) rem[i + j] ^= divisor[j];
    }
  }
  return rem.slice(rem.length - (dLen - 1));
}

export interface CrcEncoded {
  data: number[];
  crc: number[];
  codeword: number[];
}

export function encode(data: number[], gen: number[]): CrcEncoded {
  const r = gen.length - 1;
  const padded = [...data, ...new Array(r).fill(0)];
  const crc = polyRemainder(padded, gen);
  return { data, crc, codeword: [...data, ...crc] };
}

function buildSyndromeTable(n: number, gen: number[]): Map<string, number> {
  const table = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const e = new Array(n).fill(0);
    e[i] = 1;
    const syn = polyRemainder(e, gen);
    const key = syn.join("");
    if (!table.has(key)) table.set(key, i);
  }
  return table;
}

export interface CrcCheck {
  syndrome: number[];
  errorPos: number | null;
  corrected: number[] | null;
  status: "ok" | "corrected" | "uncorrectable";
}

/** Проверяет принятое кодовое слово: делит на генератор, при ненулевом остатке ищет
 *  однократную ошибку по таблице синдромов (действует безошибочно, пока длина слова
 *  не превышает 2^r − 1; при коллизии синдромов — только обнаружение, без исправления). */
export function checkAndCorrect(received: number[], gen: number[]): CrcCheck {
  const syndrome = polyRemainder(received, gen);
  if (syndrome.every((b) => b === 0)) {
    return { syndrome, errorPos: null, corrected: received, status: "ok" };
  }
  const table = buildSyndromeTable(received.length, gen);
  const pos = table.get(syndrome.join(""));
  if (pos === undefined) {
    return { syndrome, errorPos: null, corrected: null, status: "uncorrectable" };
  }
  const corrected = [...received];
  corrected[pos] ^= 1;
  return { syndrome, errorPos: pos, corrected, status: "corrected" };
}

export function flipBits(bits: number[], positions: number[]): number[] {
  const out = [...bits];
  for (const p of positions) if (p >= 0 && p < out.length) out[p] ^= 1;
  return out;
}
