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
  }
}

export function parseBitString(s: string): number[] {
  return s
    .trim()
    .split("")
    .filter((c) => c === "0" || c === "1")
    .map(Number);
}
