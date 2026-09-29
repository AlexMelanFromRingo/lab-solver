/**
 * Линейное (потенциальное) кодирование сигналов — Лаба 7 "Теории информации".
 * NRZ/RZ/Манчестер/NRZI/MLT-3 — однозначные, повсеместно стандартизированные схемы,
 * без разночтений между методичками. B2Q1 (2B1Q) и PAM5 — многоуровневые построчные
 * коды; для них взято стандартное учебное отображение пары бит на уровень, но
 * отдельного отчёта с проверочным примером по этой лабе не нашлось (только сырая
 * таблица вариантов), так что для этих двух — сверьте результат со своей методичкой.
 */

export type LineCode = "NRZ" | "RZ" | "Manchester" | "NRZI" | "MLT3" | "B2Q1" | "PAM5";

export interface LineSample {
  level: number; // условные единицы амплитуды
  bitIndex: number; // индекс исходного бита (для группового кодирования — индекс первого бита группы)
}

export const LINE_CODE_VERIFIED: Record<LineCode, boolean> = {
  NRZ: true,
  RZ: true,
  Manchester: true,
  NRZI: true,
  MLT3: true,
  B2Q1: false,
  PAM5: false,
};

/**
 * Название кода в таблице вариантов → код для encodeLine. В таблице коды
 * записаны так, как в методичке: «Манчестер» по-русски, MLT3 без дефиса, 2B1Q
 * как B2Q1, поэтому название нельзя просто привести к LineCode.
 */
const LINE_CODE_NAMES: Record<string, LineCode> = {
  nrz: "NRZ",
  rz: "RZ",
  manchester: "Manchester",
  "манчестер": "Manchester",
  "манчестерский": "Manchester",
  nrzi: "NRZI",
  mlt3: "MLT3",
  "mlt-3": "MLT3",
  b2q1: "B2Q1",
  "2b1q": "B2Q1",
  pam5: "PAM5",
  "pam-5": "PAM5",
};

export function lineCodeFromName(name: string): LineCode {
  const code = LINE_CODE_NAMES[name.trim().toLowerCase()];
  if (!code) throw new Error(`Неизвестный линейный код: «${name}»`);
  return code;
}

export function encodeLine(bits: number[], code: LineCode): LineSample[] {
  switch (code) {
    case "NRZ":
      return bits.map((b, i) => ({ level: b ? 1 : -1, bitIndex: i }));

    case "RZ":
      return bits.flatMap((b, i) => [
        { level: b ? 1 : -1, bitIndex: i },
        { level: 0, bitIndex: i },
      ]);

    case "Manchester":
      // IEEE 802.3: 1 = переход низкий→высокий (первая половина -1, вторая +1); 0 — наоборот.
      return bits.flatMap((b, i) =>
        b
          ? [
              { level: -1, bitIndex: i },
              { level: 1, bitIndex: i },
            ]
          : [
              { level: 1, bitIndex: i },
              { level: -1, bitIndex: i },
            ]
      );

    case "NRZI": {
      let level = -1;
      return bits.map((b, i) => {
        if (b) level = -level; // переход на "1", на "0" уровень не меняется
        return { level, bitIndex: i };
      });
    }

    case "MLT3": {
      // Цикл уровней -1 → 0 → 1 → 0 → -1 ...; шаг цикла — только на "1", "0" держит уровень.
      const cycle = [-1, 0, 1, 0];
      let idx = 1; // старт с уровня 0
      let level = cycle[idx];
      return bits.map((b, i) => {
        if (b) {
          idx = (idx + 1) % cycle.length;
          level = cycle[idx];
        }
        return { level, bitIndex: i };
      });
    }

    case "B2Q1": {
      // 2B1Q, стандартное Грей-кодирование пары бит в один из 4 уровней.
      const map: Record<string, number> = { "00": -3, "01": -1, "11": 1, "10": 3 };
      const out: LineSample[] = [];
      for (let i = 0; i + 1 < bits.length; i += 2) {
        const key = `${bits[i]}${bits[i + 1]}`;
        out.push({ level: map[key] ?? 0, bitIndex: i });
      }
      return out;
    }

    case "PAM5": {
      // Упрощённо: пара бит -> один из 4 задействованных уровней (реальный 4D-PAM5 в
      // 1000BASE-T использует 5-й уровень и решётчатое кодирование — здесь не моделируется).
      const map: Record<string, number> = { "00": -2, "01": -1, "10": 1, "11": 2 };
      const out: LineSample[] = [];
      for (let i = 0; i + 1 < bits.length; i += 2) {
        const key = `${bits[i]}${bits[i + 1]}`;
        out.push({ level: map[key] ?? 0, bitIndex: i });
      }
      return out;
    }

    default:
      throw new Error(`Неизвестный линейный код: «${code satisfies never}»`);
  }
}

export function parseBitString(s: string): number[] {
  return s
    .trim()
    .split("")
    .filter((c) => c === "0" || c === "1")
    .map(Number);
}

// ---------------------------------------------------------------------------
// ЛР 7, пп. 2.3, 2.4, 3.2: логічне кодування 4B/5B, скремблювання і код Баркера

/** Таблиця 4B/5B (100BASE-TX/FDDI): тетрада даних → 5-бітний символ. */
export const FOUR_B_FIVE_B = ["11110", "01001", "10100", "10101", "01010", "01011", "01110", "01111", "10010", "10011", "10110", "10111", "11010", "11011", "11100", "11101"];
/** Керуючі символи кадру: Idle, початок (J, K), кінець (T, R). */
export const FIVE_B_CONTROL = { I: "11111", J: "11000", K: "10001", T: "01101", R: "00111" };

export function encode4b5b(bits: number[]): { nibble: string; code: string }[] {
  const out: { nibble: string; code: string }[] = [];
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4).join("");
    out.push({ nibble, code: FOUR_B_FIVE_B[parseInt(nibble, 2)] });
  }
  return out;
}

/** Скремблер bi = ai ⊕ bi−3 ⊕ bi−5 (до початку — нулі) і дескремблер ci = bi ⊕ bi−3 ⊕ bi−5. */
export function scramble(a: number[]): { b: number[]; c: number[] } {
  const b: number[] = [];
  a.forEach((ai, i) => b.push(ai ^ (b[i - 3] ?? 0) ^ (b[i - 5] ?? 0)));
  const c = b.map((bi, i) => bi ^ (b[i - 3] ?? 0) ^ (b[i - 5] ?? 0));
  return { b, c };
}

/** 11-чіпова послідовність Баркера (802.11 DSSS). */
export const BARKER11 = [1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1];

/** Циклічна автокореляція: R(k) = Σ s(i)·s((i+k) mod N). */
export const barkerAcf = (k: number) => BARKER11.reduce((s, x, i) => s + x * BARKER11[(i + k) % 11], 0);
