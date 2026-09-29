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

// ------------------------------------------------------ CCK (802.11b, п. 3.4)

/** Фаза в долях π: 0, ½, 1, −½ … приводится к (−1; 1]. */
const norm = (p: number) => {
  let x = ((p % 2) + 2) % 2;
  if (x > 1) x -= 2;
  return x;
};

/** Таблица рис. 6: пара бит → сдвиг фазы, доли π. */
const QPSK: Record<string, number> = { "00": 0, "01": 0.5, "11": 1, "10": -0.5 };
/** DQPSK для φ1: у нечётных символов добавляется π. */
const phi1Step = (pair: string, odd: boolean) => norm(QPSK[pair] + (odd ? 1 : 0));

export interface CckSymbol {
  bits: string;
  /** φ1…φ4, доли π; φ1 — абсолютная (накопленная) фаза. */
  phi: [number, number, number, number];
  /** Сдвиг φ1 относительно предыдущего символа. */
  dphi1: number;
  /** Фазы чипов c0…c7, доли π. */
  chips: number[];
}

/**
 * Комплементарный код CCK: 11 Мбит/с — 8 бит на символ, φ1 по d0d1 (DQPSK,
 * у нечётных символов +π), φ2, φ3, φ4 по парам d2d3, d4d5, d6d7; 5,5 Мбит/с —
 * 4 бита: φ1 по d0d1, φ2 = d2·π + π/2, φ3 = 0, φ4 = d3·π. Чипы:
 * c0 = e^{j(φ1+φ2+φ3+φ4)}, c1 = e^{j(φ1+φ3+φ4)}, c2 = e^{j(φ1+φ2+φ4)}, c3 = −e^{j(φ1+φ4)},
 * c4 = e^{j(φ1+φ2+φ3)}, c5 = e^{j(φ1+φ3)}, c6 = −e^{j(φ1+φ2)}, c7 = e^{jφ1}.
 * Начальная фаза φ1 до первого символа — 0.
 */
export function cck(bits: number[], rate: 11 | 5.5): CckSymbol[] {
  const n = rate === 11 ? 8 : 4;
  const out: CckSymbol[] = [];
  let prev = 0;
  for (let s = 0; s + n <= bits.length; s += n) {
    const b = bits.slice(s, s + n);
    const pair = (i: number) => `${b[i]}${b[i + 1]}`;
    const k = out.length;
    const dphi1 = phi1Step(pair(0), k % 2 === 1);
    const p1 = norm(prev + dphi1);
    prev = p1;
    const [p2, p3, p4] = rate === 11 ? [QPSK[pair(2)], QPSK[pair(4)], QPSK[pair(6)]] : [norm(b[2] + 0.5), 0, b[3] ? 1 : 0];
    const chips = [p1 + p2 + p3 + p4, p1 + p3 + p4, p1 + p2 + p4, p1 + p4 + 1, p1 + p2 + p3, p1 + p3, p1 + p2 + 1, p1].map(norm);
    out.push({ bits: b.join(""), phi: [p1, p2, p3, p4], dphi1, chips });
  }
  return out;
}

/** Фаза в долях π → запись «π/2», «−π/2», «π», «0». */
export const piText = (p: number) => (p === 0 ? "0" : p === 1 ? "π" : p === 0.5 ? "π/2" : p === -0.5 ? "−π/2" : `${p}π`);
/** Чип e^{jπp} при p кратном ½: 1, j, −1, −j. */
export const chipText = (p: number) => (p === 0 ? "1" : p === 0.5 ? "j" : p === 1 ? "−1" : p === -0.5 ? "−j" : "?");
