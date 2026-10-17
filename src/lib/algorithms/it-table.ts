/**
 * Таблица данных первой лабораторной: десять строк, три столбца.
 *
 * Задание разрешает любые данные, поэтому здесь ничего не навязано: таблица
 * читается из текста, который правится прямо на странице. Готовые наборы —
 * только отправная точка, чтобы не заполнять тридцать клеток с нуля.
 *
 * Проверяется при этом не «правильность» чисел, а то, от чего зависят сами
 * диаграммы: столбцов должно быть три, строк десять, значения числовые.
 */

export interface Table {
  headers: [string, string, string];
  rows: number[][];
  /** Что помешало разобрать текст; пусто, если всё в порядке. */
  problems: string[];
}

export interface Preset {
  id: string;
  name: string;
  /** Чем связаны столбцы: без связи диаграммы ничего не покажут. */
  relation: string;
  text: string;
}

const line = (...cells: (string | number)[]) => cells.join("\t");

/** Столбцы, посчитанные по формуле, — так книга остаётся пересчитываемой. */
function build(
  headers: [string, string, string],
  xs: number[],
  second: (x: number) => number,
  third: (x: number, second: number) => number,
  digits: [number, number] = [1, 3]
): string {
  const rows = xs.map((x) => {
    const b = second(x);
    return line(x, b.toFixed(digits[0]), third(x, b).toFixed(digits[1]));
  });

  return [line(...headers), ...rows].join("\n");
}

const tens = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);
const months = Array.from({ length: 10 }, (_, i) => i + 1);

export const PRESETS: Preset[] = [
  {
    id: "resistor",
    name: "Опір і потужність",
    relation:
      "Опір металу зростає з температурою лінійно, потужність при постійній напрузі обернено пропорційна опору.",
    text: build(
      ["Температура, °C", "Опір, Ом", "Потужність, Вт"],
      tens,
      (t) => 100 * (1 + 0.0039 * t),
      (_t, r) => (12 * 12) / r
    ),
  },
  {
    id: "channel",
    name: "Завантаження каналу і затримка",
    relation:
      "Зі зростанням числа запитів зростає завантаження каналу, а разом з ним — затримка відповіді.",
    text: build(
      ["Запитів за секунду", "Завантаження, %", "Затримка, мс"],
      tens.map((v) => v * 5),
      (n) => Math.min(99, n / 6),
      (_n, load) => 12 + 0.8 * load * load * 0.01 * 100
    ),
  },
  {
    id: "sales",
    name: "Виручка і середній чек",
    relation: "Виручка зростає з числом замовлень, середній чек — частка від їх ділення.",
    text: build(
      ["Місяць", "Замовлень, шт", "Виручка, тис. грн"],
      months,
      (m) => 120 + 18 * m - m * m,
      (_m, orders) => orders * 0.85,
      [0, 1]
    ),
  },
];

/** Разбирает таблицу из текста: разделитель — табуляция, точка с запятой или пробелы. */
export function parseTable(text: string): Table {
  const problems: string[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: ["", "", ""], rows: [], problems: ["Таблиця порожня."] };
  }

  const split = (l: string) => l.split(/\t|;|\s{2,}|,(?=\D)/).map((c) => c.trim()).filter(Boolean);

  const head = split(lines[0]);
  const headers: [string, string, string] = [
    head[0] ?? "Стовпець A",
    head[1] ?? "Стовпець B",
    head[2] ?? "Стовпець C",
  ];

  const rows: number[][] = [];
  for (const [i, raw] of lines.slice(1).entries()) {
    const cells = split(raw).map((c) => Number(c.replace(",", ".")));
    if (cells.length < 3) {
      problems.push(`Строка ${i + 1}: меньше трёх столбцов.`);
      continue;
    }
    if (cells.slice(0, 3).some((v) => !Number.isFinite(v))) {
      problems.push(`Строка ${i + 1}: не все значения числовые.`);
      continue;
    }
    rows.push(cells.slice(0, 3));
  }

  if (rows.length && rows.length !== 10) {
    problems.push(`Строк с данными ${rows.length}, а задание требует десять.`);
  }

  return { headers, rows, problems };
}

/** Сумма третьего столбца: по ней строится круговая диаграмма. */
export function totalOf(table: Table, column = 2): number {
  return table.rows.reduce((sum, row) => sum + row[column], 0);
}

/** Число с запятой в дробной части и настоящим минусом. */
export function ru(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits).replace(".", ",").replace("-", "−");
}
