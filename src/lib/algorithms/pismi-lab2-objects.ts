/**
 * Вторая программа лабораторной 2 «Проектування інформаційних систем в
 * мережах Інтернет» (УДУНТ, кафедра ЕОМ; укладачі Косолапов А. А.,
 * Дзюба В. В., 2025, с. 14–15).
 *
 * Тринадцать заданий, по одному на вариант. Методичка требует, чтобы задание
 * выполнял созданный объект, поэтому в самой лабораторной каждый вариант —
 * отдельный класс. Здесь то же самое: вариант описывает, какие параметры он
 * читает и что из них строит, а страница только отображает результат и не
 * знает, какое именно задание ей досталось.
 *
 * Задания перенесены как есть. Там, где формулировка методички допускает
 * разночтение, это помечено в поле note, а не решено молча.
 */

export type TaskOutput =
  /** Побитовый разбор адресов: десятичная и двоичная записи построчно. */
  | {
      kind: "binary";
      rows: { label: string; decimal: string; binary: string; accent?: boolean }[];
    }
  /** Сетка ячеек: календарь, координаты, шахматы, таблица по цифрам. */
  | {
      kind: "grid";
      rows: string[][];
      rowHeaders?: string[];
      colHeaders?: string[];
      marked?: { row: number; col: number };
      checker?: boolean;
    }
  /** Набор «подпись — значение». */
  | { kind: "readout"; items: { label: string; value: string }[] }
  /** Текст построчно, с выравниванием. */
  | { kind: "lines"; lines: string[]; align: "left" | "center" | "right" | "justify" }
  /** Пирамида: сколько блоков в каждом ряду и чем блок заполнен. */
  | { kind: "pyramid"; rows: number[]; cell: string }
  /** Обычная таблица. */
  | { kind: "table"; head: string[]; rows: string[][]; accentRow?: number };

export interface TaskParam {
  name: string;
  label: string;
  default: string;
}

export interface ObjectTask {
  variant: number;
  title: string;
  /** Что именно требует условие варианта. */
  statement: string;
  params: TaskParam[];
  note?: string;
  build: (values: Record<string, string>) => TaskOutput;
  /** Чем это задание интересно с точки зрения программирования. */
  conclusion: string;
}

// --- вспомогательное ---------------------------------------------------------

function int(values: Record<string, string>, name: string, fallback: number, min: number, max: number): number {
  const raw = values[name];
  const parsed = raw !== undefined && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : fallback;

  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function text(values: Record<string, string>, name: string, fallback: string): string {
  const raw = (values[name] ?? "").trim();

  return raw === "" ? fallback : raw;
}

/** Октеты маски по длине префикса. */
function maskOctets(prefix: number): number[] {
  return [0, 1, 2, 3].map((i) => {
    const bits = Math.max(0, Math.min(8, prefix - i * 8));
    return bits === 0 ? 0 : (0xff << (8 - bits)) & 0xff;
  });
}

const toBinary = (octets: number[]) =>
  octets.map((o) => o.toString(2).padStart(8, "0")).join(" . ");

const toDecimal = (octets: number[]) => octets.join(".");

// --- задания -----------------------------------------------------------------

export const OBJECT_TASKS: ObjectTask[] = [
  {
    variant: 1,
    title: "Адрес узла",
    statement:
      "Отобразить в таблице в двоичной форме расчёт адреса узла логическим «и»-«не». " +
      "Исходные данные — адрес сети пятью параметрами: четыре байта и префикс.",
    params: [
      { name: "o1", label: "Байт 1", default: "192" },
      { name: "o2", label: "Байт 2", default: "168" },
      { name: "o3", label: "Байт 3", default: "17" },
      { name: "o4", label: "Байт 4", default: "43" },
      { name: "prefix", label: "Префикс", default: "16" },
    ],
    build: (v) => {
      const address = ["o1", "o2", "o3", "o4"].map((k) => int(v, k, 0, 0, 255));
      const prefix = int(v, "prefix", 16, 0, 32);
      const mask = maskOctets(prefix);
      const inverted = mask.map((o) => ~o & 0xff);
      const host = address.map((o, i) => o & inverted[i]);

      return {
        kind: "binary",
        rows: [
          { label: "Адрес", decimal: toDecimal(address), binary: toBinary(address) },
          { label: `Маска /${prefix}`, decimal: toDecimal(mask), binary: toBinary(mask) },
          { label: "НЕ маска", decimal: toDecimal(inverted), binary: toBinary(inverted) },
          { label: "Адрес узла", decimal: toDecimal(host), binary: toBinary(host), accent: true },
        ],
      };
    },
    conclusion:
      "Сетевая и узловая части адреса разделяются не арифметически, а поразрядно: маска " +
      "оставляет сеть, её инверсия — узел. В двоичной записи это видно как точная граница " +
      "между единицами и нулями маски.",
  },
  {
    variant: 2,
    title: "Адрес сети",
    statement:
      "Отобразить в таблице в двоичной форме расчёт адреса сети логическим «и». " +
      "Исходные данные — восемь параметров: IP-адрес и маска локального узла.",
    params: [
      { name: "a1", label: "IP байт 1", default: "192" },
      { name: "a2", label: "IP байт 2", default: "168" },
      { name: "a3", label: "IP байт 3", default: "17" },
      { name: "a4", label: "IP байт 4", default: "43" },
      { name: "m1", label: "Маска байт 1", default: "255" },
      { name: "m2", label: "Маска байт 2", default: "255" },
      { name: "m3", label: "Маска байт 3", default: "240" },
      { name: "m4", label: "Маска байт 4", default: "0" },
    ],
    build: (v) => {
      const address = ["a1", "a2", "a3", "a4"].map((k) => int(v, k, 0, 0, 255));
      const mask = ["m1", "m2", "m3", "m4"].map((k) => int(v, k, 0, 0, 255));
      const network = address.map((o, i) => o & mask[i]);

      return {
        kind: "binary",
        rows: [
          { label: "Адрес узла", decimal: toDecimal(address), binary: toBinary(address) },
          { label: "Маска подсети", decimal: toDecimal(mask), binary: toBinary(mask) },
          { label: "Адрес сети", decimal: toDecimal(network), binary: toBinary(network), accent: true },
        ],
      };
    },
    conclusion:
      "Логическое «и» с маской обнуляет те разряды, где у маски нули, поэтому адрес сети — " +
      "это адрес узла с отброшенным «хвостом». Операция идёт побайтово, но смысл имеет на " +
      "всём адресе: граница сети не обязана совпадать с границей байта.",
  },
  {
    variant: 3,
    title: "Система счисления",
    statement:
      "Отобразить число, заданное первым параметром, в системе счисления, заданной " +
      "вторым. Предусмотреть десятичную, двоичную и шестнадцатеричную системы.",
    params: [
      { name: "value", label: "Число", default: "2026" },
      { name: "base", label: "Основание (2, 10 или 16)", default: "16" },
    ],
    build: (v) => {
      const value = int(v, "value", 0, 0, Number.MAX_SAFE_INTEGER);
      const base = int(v, "base", 10, 2, 16);
      const supported: [number, string][] = [
        [2, "двоичная"],
        [10, "десятичная"],
        [16, "шестнадцатеричная"],
      ];
      const index = supported.findIndex(([b]) => b === base);

      return {
        kind: "table",
        head: ["Система", "Основание", "Запись"],
        rows: supported.map(([b, name]) => [name, String(b), value.toString(b).toUpperCase()]),
        accentRow: index < 0 ? undefined : index,
      };
    },
    note: "Основания, кроме 2, 10 и 16, условием не предусмотрены — выделения строки не будет.",
    conclusion:
      "Число не меняется от того, в какой системе его записали: меняется только форма " +
      "записи. Основание задаёт, сколько разных цифр доступно и каков вес разряда.",
  },
  {
    variant: 4,
    title: "Календарь",
    statement:
      "Построить месячный календарь таблицей 5 строк на 7 столбцов. Исходные данные — " +
      "каким днём недели будет первое число месяца (от 1 до 7).",
    params: [
      { name: "first", label: "День недели 1-го числа (1–7)", default: "4" },
      { name: "days", label: "Дней в месяце", default: "30" },
    ],
    build: (v) => {
      const first = int(v, "first", 1, 1, 7);
      const days = int(v, "days", 30, 28, 31);
      const cells = Array.from({ length: 35 }, () => "");

      for (let day = 1; day <= days; day++) {
        const index = first - 2 + day;
        if (index >= 0 && index < 35) cells[index] = String(day);
      }

      return {
        kind: "grid",
        colHeaders: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
        rows: Array.from({ length: 5 }, (_, r) => cells.slice(r * 7, r * 7 + 7)),
      };
    },
    conclusion:
      "Календарю не нужны ни дата, ни название месяца: достаточно знать, на какой день " +
      "недели приходится первое число и сколько дней в месяце. Остальное — сдвиг: номер " +
      "дня превращается в номер ячейки прибавлением константы.",
  },
  {
    variant: 5,
    title: "Таблица по цифрам числа",
    statement:
      "Выполнить динамическое построение таблицы. Число строк задать нечётными цифрами, " +
      "число столбцов — чётными цифрами десятичного числа из строки браузера.",
    params: [{ name: "value", label: "Десятичное число", default: "385617" }],
    note:
      "Методичка не уточняет, что значит «задать цифрами»: взять их количество или " +
      "составить из них число. Здесь берётся количество — иначе таблица из числа вроде " +
      "385617 вышла бы 35 на 86 ячеек.",
    build: (v) => {
      const digits = text(v, "value", "385617").replace(/\D/g, "") || "385617";
      const odd = [...digits].filter((d) => Number(d) % 2 === 1);
      const even = [...digits].filter((d) => Number(d) % 2 === 0);
      const rows = Math.max(1, Math.min(12, odd.length));
      const cols = Math.max(1, Math.min(12, even.length));

      return {
        kind: "grid",
        rows: Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => `${r + 1}·${c + 1}`)
        ),
      };
    },
    conclusion:
      "Размер таблицы не задан явно — его приходится извлекать из числа, разобрав его на " +
      "цифры и рассортировав по чётности. Типичная для веба задача: данные приходят " +
      "строкой, и программа сперва должна превратить их во что-то пригодное для разметки.",
  },
  {
    variant: 6,
    title: "Текстовое число",
    statement:
      "Отобразить число, заданное параметром, в пределах от 0.0 до 9.9 в текстовом виде. " +
      "Например 3.3 = «три целых три десятых».",
    params: [{ name: "value", label: "Число от 0,0 до 9,9", default: "3.3" }],
    build: (v) => {
      const raw = text(v, "value", "3.3").replace(",", ".");
      const parsed = Number.isFinite(Number(raw)) ? Number(raw) : 3.3;
      const value = Math.max(0, Math.min(9.9, parsed));
      const whole = Math.floor(value);
      const tenth = Math.round((value - whole) * 10);

      const units = ["ноль", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
      const plural = (n: number, one: string, few: string, many: string) =>
        n === 1 ? one : n >= 2 && n <= 4 ? few : many;

      const words = [
        units[whole],
        plural(whole, "целая", "целых", "целых"),
        units[tenth],
        plural(tenth, "десятая", "десятых", "десятых"),
      ].join(" ");

      return {
        kind: "readout",
        items: [
          { label: "Прописью", value: words },
          { label: "Целая часть", value: String(whole) },
          { label: "Десятых", value: String(tenth) },
        ],
      };
    },
    conclusion:
      "Перевод числа в текст опирается не на само число, а на его разряды: целая часть и " +
      "десятые озвучиваются отдельно, а форма слова зависит от последней цифры.",
  },
  {
    variant: 7,
    title: "Координаты ячейки",
    statement:
      "Выполнить динамическое построение таблицы. Число строк и столбцов задать первым и " +
      "вторым параметром, буквой X пометить ячейку с координатами из третьего и четвёртого.",
    params: [
      { name: "rows", label: "Строк", default: "6" },
      { name: "cols", label: "Столбцов", default: "9" },
      { name: "row", label: "Строка ячейки", default: "3" },
      { name: "col", label: "Столбец ячейки", default: "7" },
    ],
    build: (v) => {
      const rows = int(v, "rows", 6, 1, 20);
      const cols = int(v, "cols", 9, 1, 20);
      // Координаты зажимаются уже по известным размерам: иначе параметр мог
      // бы указать на ячейку, которой в таблице нет.
      const row = int(v, "row", 3, 1, rows);
      const col = int(v, "col", 7, 1, cols);

      return {
        kind: "grid",
        colHeaders: Array.from({ length: cols }, (_, i) => String(i + 1)),
        rowHeaders: Array.from({ length: rows }, (_, i) => String(i + 1)),
        rows: Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (r + 1 === row && c + 1 === col ? "X" : ""))
        ),
        marked: { row, col },
      };
    },
    conclusion:
      "Помеченная ячейка определяется не отдельной веткой разметки, а совпадением " +
      "счётчиков с заданными координатами. Порядок проверки важен: сначала зажимаются " +
      "размеры таблицы, и лишь потом координаты в её пределах.",
  },
  {
    variant: 8,
    title: "Площадь картинки",
    statement:
      "Отобразить картинку с размерами из первого и второго параметра (высота и ширина) " +
      "и выполнить расчёт её площади.",
    params: [
      { name: "height", label: "Высота, пикселей", default: "180" },
      { name: "width", label: "Ширина, пикселей", default: "320" },
    ],
    build: (v) => {
      const height = int(v, "height", 180, 1, 4000);
      const width = int(v, "width", 320, 1, 4000);

      return {
        kind: "readout",
        items: [
          { label: "Высота", value: `${height} px` },
          { label: "Ширина", value: `${width} px` },
          { label: "Площадь", value: `${(height * width).toLocaleString("ru-RU")} px²` },
          { label: "Соотношение сторон", value: (width / height).toFixed(3) },
        ],
      };
    },
    conclusion:
      "Расчёт тривиален, а вот проверка границ — нет: без неё параметр из строки браузера " +
      "способен нарисовать изображение размером с экран или вовсе нулевое.",
  },
  {
    variant: 9,
    title: "Текстовая пирамида",
    statement:
      "Построить таблицу в виде пирамиды, высоту которой и размер одного блока (ширину) " +
      "задать в строке браузера. В качестве заполнителя можно использовать слово «камінь».",
    params: [
      { name: "height", label: "Высота, рядов", default: "6" },
      { name: "block", label: "Ширина блока, символов", default: "8" },
      { name: "word", label: "Слово-заполнитель", default: "камінь" },
    ],
    build: (v) => {
      const height = int(v, "height", 6, 1, 14);
      const block = int(v, "block", 8, 3, 16);
      const word = text(v, "word", "камінь");
      const cell = word.repeat(Math.ceil(block / word.length)).slice(0, block);

      return { kind: "pyramid", rows: Array.from({ length: height }, (_, i) => i + 1), cell };
    },
    conclusion:
      "Пирамида строится вложенными циклами, где внутренний выполняется столько раз, каков " +
      "текущий уровень. Слово-заполнитель подрезается до заданной ширины, поэтому блоки " +
      "остаются одинаковыми независимо от длины слова.",
  },
  {
    variant: 10,
    title: "Пирамида рисунков",
    statement:
      "Построить пирамиду из рисунков, высоту которой и размер одного блока (высоту и " +
      "ширину) задать в строке браузера.",
    params: [
      { name: "height", label: "Высота, рядов", default: "5" },
      { name: "size", label: "Сторона блока, пикселей", default: "48" },
    ],
    build: (v) => {
      const height = int(v, "height", 5, 1, 10);
      const size = int(v, "size", 48, 12, 96);

      return {
        kind: "pyramid",
        rows: Array.from({ length: height }, (_, i) => i + 1),
        cell: `▦ ${size}px`,
      };
    },
    conclusion:
      "Общее количество блоков равно сумме арифметической прогрессии, поэтому его можно не " +
      "считать циклом: при высоте n получается n·(n+1)/2 рисунков.",
  },
  {
    variant: 11,
    title: "Шахматы",
    statement:
      "Построить на базе таблицы 8×8 чёрно-белую доску для игры в шахматы. Поставить " +
      "короля, помеченного буквой K, в координаты ячейки, заданные параметрами.",
    params: [
      { name: "col", label: "Вертикаль короля (1–8)", default: "5" },
      { name: "row", label: "Горизонталь короля (1–8)", default: "1" },
    ],
    build: (v) => {
      const col = int(v, "col", 5, 1, 8);
      const row = int(v, "row", 1, 1, 8);

      // Восьмая горизонталь сверху, как на настоящей доске.
      return {
        kind: "grid",
        checker: true,
        colHeaders: ["a", "b", "c", "d", "e", "f", "g", "h"],
        rowHeaders: [8, 7, 6, 5, 4, 3, 2, 1].map(String),
        rows: [8, 7, 6, 5, 4, 3, 2, 1].map((r) =>
          Array.from({ length: 8 }, (_, c) => (r === row && c + 1 === col ? "K" : ""))
        ),
        marked: { row: 9 - row, col },
      };
    },
    conclusion:
      "Цвет поля определяется чётностью суммы координат — одно условие вместо шестидесяти " +
      "четырёх отдельных ячеек. Нумерация горизонталей идёт сверху вниз, поэтому внешний " +
      "цикл считает в обратную сторону: иначе доска вышла бы перевёрнутой.",
  },
  {
    variant: 12,
    title: "Дом, который построил Джек",
    statement:
      "Использовав с первого по пятое звено произведения С. Маршака, построить первые " +
      "куплеты. Текст выровнять согласно последнему параметру строки браузера.",
    params: [
      { name: "verses", label: "Сколько куплетов (1–5)", default: "3" },
      { name: "align", label: "Выравнивание", default: "justify" },
    ],
    note:
      "Строки текста методичка разрешает задать «по желанию — в теле программы или в " +
      "параметрах». Здесь они в теле: хранятся не куплеты, а звенья, и каждый следующий " +
      "куплет дописывает к себе все предыдущие.",
    build: (v) => {
      const links: [string, string][] = [
        ["дом", "который построил Джек"],
        ["пшеница", "которая в тёмном чулане хранится в доме"],
        ["весёлая птица-синица", "которая часто ворует пшеницу"],
        ["кот", "который пугает и ловит синицу"],
        ["пёс без хвоста", "который за шиворот треплет кота"],
      ];
      const verses = int(v, "verses", 3, 1, links.length);
      const allowed = ["left", "center", "right", "justify"] as const;
      const asked = text(v, "align", "justify");
      const align = (allowed as readonly string[]).includes(asked)
        ? (asked as (typeof allowed)[number])
        : "justify";

      const lines = Array.from({ length: verses }, (_, k) => {
        const parts = [`${links[k][0]}, ${links[k][1]}`];
        for (let j = k - 1; j >= 0; j--) parts.push(links[j][1]);
        return `Вот ${parts.join(", ")}.`;
      });

      return { kind: "lines", lines, align };
    },
    conclusion:
      "Текст считалки хранится не куплетами, а звеньями. Каждый следующий куплет дописывает " +
      "к себе все предыдущие в обратном порядке, поэтому добавить шестое звено — это дописать " +
      "одну строку данных, а не новый абзац.",
  },
  {
    variant: 13,
    title: "Зодиак",
    statement:
      "В зависимости от месяца, года и имени выдать информацию о знаке зодиака и звере " +
      "года рождения.",
    params: [
      { name: "name", label: "Имя", default: "Олександр" },
      { name: "month", label: "Месяц рождения", default: "4" },
      { name: "day", label: "День рождения", default: "15" },
      { name: "year", label: "Год рождения", default: "2002" },
    ],
    note:
      "Методичка называет три параметра — месяц, год и имя. Добавлен день: без него знак " +
      "зодиака на границе месяца определить нельзя, потому что границы знаков не совпадают " +
      "с границами месяцев.",
    build: (v) => {
      const signs: [number, string][] = [
        [20, "Козерог"], [19, "Водолей"], [21, "Рыбы"], [20, "Овен"],
        [21, "Телец"], [21, "Близнецы"], [23, "Рак"], [23, "Лев"],
        [23, "Дева"], [23, "Весы"], [22, "Скорпион"], [22, "Стрелец"],
      ];
      const animals = ["Обезьяна", "Петух", "Собака", "Свинья", "Крыса", "Бык",
                       "Тигр", "Кролик", "Дракон", "Змея", "Лошадь", "Коза"];

      const name = text(v, "name", "Олександр");
      const month = int(v, "month", 4, 1, 12);
      const day = int(v, "day", 15, 1, 31);
      const year = int(v, "year", 2002, 1900, 2100);

      const [edge, sign] = signs[month - 1];
      const actual = day < edge ? signs[(month + 10) % 12][1] : sign;

      return {
        kind: "readout",
        items: [
          { label: "Имя", value: name },
          { label: "Дата", value: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}` },
          { label: "Знак зодиака", value: actual },
          { label: "Зверь года", value: animals[year % 12] },
        ],
      };
    },
    conclusion:
      "Знак зодиака зависит от дня и месяца, зверь года — от остатка года при делении на " +
      "двенадцать. Обе зависимости хранятся таблицами, а не цепочками условий: таблица " +
      "короче, читается как данные и не требует правок в логике.",
  },
];

export function taskByVariant(variant: number): ObjectTask {
  const found = OBJECT_TASKS.find((t) => t.variant === variant);
  if (!found) throw new Error(`нет варианта ${variant}`);

  return found;
}

/** Значения параметров по умолчанию для задания. */
export function defaultValues(task: ObjectTask): Record<string, string> {
  return Object.fromEntries(task.params.map((p) => [p.name, p.default]));
}
