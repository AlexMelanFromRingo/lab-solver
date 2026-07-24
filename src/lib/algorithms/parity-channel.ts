/**
 * Двумерный код с проверкой на чётность + пропускная способность дискретного канала
 * с шумом — Лаба 4 "Теории информации". Источники: Parity code (error correction).xlsx,
 * Noisy channel 1-3.xlsx, CalcParity.py (sum(bits) % 2).
 */

export interface ParityMatrix {
  rows: number;
  cols: number;
  bits: number[][]; // rows x cols, данные без учёта служебных бит
  rowParity: number[]; // по одному на строку
  colParity: number[]; // по одному на столбец
  cornerParity: number; // чётность по всей матрице (для отличения 1 от 2 ошибок)
}

export function buildParityMatrix(bitString: string, cols: number): ParityMatrix {
  const flat = bitString.split("").map(Number);
  const rows = Math.ceil(flat.length / cols);
  const bits: number[][] = [];
  for (let r = 0; r < rows; r++) {
    bits.push(flat.slice(r * cols, r * cols + cols).map((v) => v ?? 0));
    while (bits[r].length < cols) bits[r].push(0);
  }
  const rowParity = bits.map((row) => row.reduce((a, b) => a ^ b, 0));
  const colParity: number[] = [];
  for (let c = 0; c < cols; c++) {
    colParity.push(bits.reduce((acc, row) => acc ^ row[c], 0));
  }
  const cornerParity = rowParity.reduce((a, b) => a ^ b, 0);
  return { rows, cols, bits, rowParity, colParity, cornerParity };
}

export function flipBit(m: ParityMatrix, row: number, col: number): ParityMatrix {
  const bits = m.bits.map((r) => [...r]);
  bits[row][col] ^= 1;
  return { ...m, bits };
}

export interface ParityCheckResult {
  badRow: number | null;
  badCol: number | null;
  errorCount: "0" | "1" | "≥2";
  corrected: ParityMatrix | null;
}

export function checkAndCorrect(received: ParityMatrix): ParityCheckResult {
  const recomputedRowParity = received.bits.map((row) => row.reduce((a, b) => a ^ b, 0));
  const recomputedColParity: number[] = [];
  for (let c = 0; c < received.cols; c++) {
    recomputedColParity.push(received.bits.reduce((acc, row) => acc ^ row[c], 0));
  }

  const badRows = recomputedRowParity
    .map((p, i) => (p !== received.rowParity[i] ? i : -1))
    .filter((i) => i >= 0);
  const badCols = recomputedColParity
    .map((p, i) => (p !== received.colParity[i] ? i : -1))
    .filter((i) => i >= 0);

  if (badRows.length === 0 && badCols.length === 0) {
    return { badRow: null, badCol: null, errorCount: "0", corrected: received };
  }
  if (badRows.length === 1 && badCols.length === 1) {
    const corrected = flipBit(received, badRows[0], badCols[0]);
    return { badRow: badRows[0], badCol: badCols[0], errorCount: "1", corrected };
  }
  return { badRow: null, badCol: null, errorCount: "≥2", corrected: null };
}

export function matrixToBitString(m: ParityMatrix): string {
  return m.bits.map((row) => row.join("")).join("");
}

/** Двоичная энтропия вероятности ошибки — H(p) = -p·log2(p) - (1-p)·log2(1-p). */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export interface ChannelScenario {
  p: number;
  Hp: number;
  capacityFraction: number; // C = 1 − H(p), бит/симв (доля от технической скорости)
  capacityBitsPerSec: number;
  durationSec: number;
  vsBaseline: number; // во сколько раз дольше, чем в безошибочном канале (p=0)
}

export interface ChannelReport {
  dataBits: number;
  baseline: ChannelScenario;
  scenarios: ChannelScenario[]; // по одному на p1, p2, p3
}

/**
 * Пропускная способность двоичного симметричного канала — Лаба 4 "Теории информации".
 * Источник: Универ/Теория информации/Лаба 4/Noisy channel 1-3.xlsx — там p1/p2/p3 из таблицы
 * вариантов считаются как ТРИ ОТДЕЛЬНЫХ сценария (не усредняются!), плюс базовая строка
 * "помилки в каналі відсутні" (p=0). Формула на строку: C = 1 − H(p) (бит/симв, доля от
 * технической скорости v), G = v·C (бит/с), длительность = объём/G; сравнение — во сколько
 * раз длительность больше, чем в безошибочном канале.
 */
function buildScenario(dataBits: number, speedSymPerSec: number, p: number): ChannelScenario {
  const Hp = binaryEntropy(p);
  const capacityFraction = 1 - Hp;
  const capacityBitsPerSec = speedSymPerSec * capacityFraction;
  const durationSec = dataBits / capacityBitsPerSec;
  return { p, Hp, capacityFraction, capacityBitsPerSec, durationSec, vsBaseline: 1 };
}

export function analyzeChannel(lengthMB: number, speedSymPerSec: number, p1: number, p2: number, p3: number): ChannelReport {
  const dataBits = lengthMB * 1024 * 1024 * 8;
  const baseline = buildScenario(dataBits, speedSymPerSec, 0);
  const scenarios = [p1, p2, p3].map((p) => {
    const s = buildScenario(dataBits, speedSymPerSec, p);
    return { ...s, vsBaseline: s.durationSec / baseline.durationSec };
  });
  return { dataBits, baseline, scenarios };
}
