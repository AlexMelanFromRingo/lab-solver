/**
 * ТІК, ЛР 3 «Дослідження сучасних методів стиснення повідомлень»: величини
 * таблиць 1, 2, 4 (частина після стиснення, кратність), оцінка словникового
 * стиснення LZSS для таблиці 3 і етапи JPEG для п. 5 — перехід RGB → YCbCr,
 * ДКП блоку 8×8, квантування («ступінь огрублення») і зворотне перетворення.
 */

export interface SizeRow {
  name: string;
  before: number;
  after: number;
}

/** Частина після стиснення, % і кратність стиснення, разів. */
export const shareOf = (r: SizeRow) => (r.after / r.before) * 100;
export const ratioOf = (r: SizeRow) => r.before / r.after;

export interface LzssParams {
  /** Розмір вікна (словника), байт. */
  window: number;
  /** Найдовший збіг, байт. */
  maxMatch: number;
  /** Найкоротший збіг, який вигідно кодувати посиланням. */
  minMatch: number;
}

export const LZSS_DEFAULT: LzssParams = { window: 4096, maxMatch: 18, minMatch: 3 };

/**
 * Класичний LZSS (як у LZSS.C Окумури): прапорець на кожну позицію, літерал —
 * 8 біт, посилання — 12 біт зсуву й 4 біти довжини (16 біт). Повертає розмір у
 * байтах і склад потоку.
 */
export function lzss(bytes: number[], p: LzssParams = LZSS_DEFAULT) {
  let i = 0;
  let literals = 0;
  let matches = 0;
  while (i < bytes.length) {
    let best = 0;
    const from = Math.max(0, i - p.window);
    for (let j = from; j < i; j++) {
      let k = 0;
      while (k < p.maxMatch && i + k < bytes.length && bytes[j + k] === bytes[i + k]) k++;
      if (k > best) best = k;
      if (best === p.maxMatch) break;
    }
    if (best >= p.minMatch) {
      matches++;
      i += best;
    } else {
      literals++;
      i++;
    }
  }
  const bits = literals * 9 + matches * 17;
  return { size: Math.ceil(bits / 8), literals, matches };
}

// ------------------------------------------------------------------- JPEG

/** RGB → YCbCr (JFIF): Y = 0,299R + 0,587G + 0,114B, U = Cb, V = Cr зі зсувом 128. */
export function rgbToYuv(r: number, g: number, b: number) {
  const c = (x: number) => Math.min(255, Math.max(0, x));
  return {
    y: c(0.299 * r + 0.587 * g + 0.114 * b),
    u: c(-0.168736 * r - 0.331264 * g + 0.5 * b + 128),
    v: c(0.5 * r - 0.418688 * g - 0.081312 * b + 128),
  };
}

/** Стандартна таблиця квантування яскравості (JPEG, додаток K). */
export const Q_LUMA = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99],
];

/** Таблиця для якості q (1…100) за формулою IJG. */
export function qTable(q: number): number[][] {
  const s = q < 50 ? 5000 / q : 200 - 2 * q;
  return Q_LUMA.map((row) => row.map((v) => Math.min(255, Math.max(1, Math.floor((v * s + 50) / 100)))));
}

const C = (u: number) => (u === 0 ? Math.SQRT1_2 : 1);

export function dct8(block: number[][]): number[][] {
  const out = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let u = 0; u < 8; u++)
    for (let v = 0; v < 8; v++) {
      let s = 0;
      for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) s += (block[x][y] - 128) * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * Math.cos(((2 * y + 1) * v * Math.PI) / 16);
      out[u][v] = 0.25 * C(u) * C(v) * s;
    }
  return out;
}

export function idct8(coef: number[][]): number[][] {
  const out = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 8; y++) {
      let s = 0;
      for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) s += C(u) * C(v) * coef[u][v] * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * Math.cos(((2 * y + 1) * v * Math.PI) / 16);
      out[x][y] = Math.min(255, Math.max(0, Math.round(0.25 * s + 128)));
    }
  return out;
}

/** Повний цикл для блоку: ДКП, квантування, деквантування, зворотне ДКП, похибка. */
export function jpegBlock(block: number[][], q: number) {
  const t = qTable(q);
  const d = dct8(block);
  const quant = d.map((row, u) => row.map((c, v) => Math.round(c / t[u][v])));
  const back = idct8(quant.map((row, u) => row.map((c, v) => c * t[u][v])));
  const err = Math.max(...block.flatMap((row, x) => row.map((p, y) => Math.abs(p - back[x][y]))));
  const zeros = quant.flat().filter((c) => c === 0).length;
  return { table: t, dct: d, quant, back, err, zeros };
}
