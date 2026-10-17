/**
 * Вторая программа лабораторной 2 «Проектування інформаційних систем в
 * мережах Інтернет» (методичні вказівки,
 * 2025, с. 14–15).
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
    title: "Адреса вузла",
    statement:
      "Відобразити в таблиці у двійковій формі розрахунок адреси вузла логічним «і»-«не». " +
      "Початкові дані — адреса мережі п’ятьма параметрами: чотири байти і префікс.",
    params: [
      { name: "o1", label: "Байт 1", default: "192" },
      { name: "o2", label: "Байт 2", default: "168" },
      { name: "o3", label: "Байт 3", default: "17" },
      { name: "o4", label: "Байт 4", default: "43" },
      { name: "prefix", label: "Префікс", default: "16" },
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
          { label: "Адреса", decimal: toDecimal(address), binary: toBinary(address) },
          { label: `Маска /${prefix}`, decimal: toDecimal(mask), binary: toBinary(mask) },
          { label: "НЕ маска", decimal: toDecimal(inverted), binary: toBinary(inverted) },
          { label: "Адреса вузла", decimal: toDecimal(host), binary: toBinary(host), accent: true },
        ],
      };
    },
    conclusion:
      "Мережева і вузлова частини адреси розділяються не арифметично, а порозрядно: маска " +
      "залишає мережу, її інверсія — вузол. У двійковому записі це видно як точна межа " +
      "між одиницями і нулями маски.",
  },
  {
    variant: 2,
    title: "Адреса мережі",
    statement:
      "Відобразити в таблиці у двійковій формі розрахунок адреси мережі логічним «і». " +
      "Початкові дані — вісім параметрів: IP-адреса і маска локального вузла.",
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
          { label: "Адреса вузла", decimal: toDecimal(address), binary: toBinary(address) },
          { label: "Маска підмережі", decimal: toDecimal(mask), binary: toBinary(mask) },
          { label: "Адреса мережі", decimal: toDecimal(network), binary: toBinary(network), accent: true },
        ],
      };
    },
    conclusion:
      "Логічне «і» з маскою обнуляє ті розряди, де в маски нулі, тому адреса мережі — " +
      "це адреса вузла з відкинутим «хвостом». Операція йде побайтово, але сенс має на " +
      "всій адресі: межа мережі не зобов’язана збігатися з межею байта.",
  },
  {
    variant: 3,
    title: "Система числення",
    statement:
      "Відобразити число, задане першим параметром, у системі числення, заданій " +
      "другим. Передбачити десяткову, двійкову і шістнадцяткову системи.",
    params: [
      { name: "value", label: "Число", default: "2026" },
      { name: "base", label: "Основа (2, 10 або 16)", default: "16" },
    ],
    build: (v) => {
      const value = int(v, "value", 0, 0, Number.MAX_SAFE_INTEGER);
      const base = int(v, "base", 10, 2, 16);
      const supported: [number, string][] = [
        [2, "двійкова"],
        [10, "десяткова"],
        [16, "шістнадцяткова"],
      ];
      const index = supported.findIndex(([b]) => b === base);

      return {
        kind: "table",
        head: ["Система", "Основа", "Запис"],
        rows: supported.map(([b, name]) => [name, String(b), value.toString(b).toUpperCase()]),
        accentRow: index < 0 ? undefined : index,
      };
    },
    note: "Основи, крім 2, 10 і 16, умовою не передбачені — виділення рядка не буде.",
    conclusion:
      "Число не змінюється від того, у якій системі його записали: змінюється лише форма " +
      "запису. Основа задає, скільки різних цифр доступно і яка вага розряду.",
  },
  {
    variant: 4,
    title: "Календар",
    statement:
      "Побудувати місячний календар таблицею 5 рядків на 7 стовпців. Початкові дані — " +
      "яким днем тижня буде перше число місяця (від 1 до 7).",
    params: [
      { name: "first", label: "День тижня 1-го числа (1–7)", default: "4" },
      { name: "days", label: "Днів у місяці", default: "30" },
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
      "Календарю не потрібні ні дата, ні назва місяця: достатньо знати, на який день " +
      "тижня припадає перше число і скільки днів у місяці. Решта — зсув: номер " +
      "дня перетворюється на номер комірки додаванням константи.",
  },
  {
    variant: 5,
    title: "Таблиця за цифрами числа",
    statement:
      "Виконати динамічну побудову таблиці. Число рядків задати непарними цифрами, " +
      "число стовпців — парними цифрами десяткового числа з рядка браузера.",
    params: [{ name: "value", label: "Десяткове число", default: "385617" }],
    note:
      "Методичка не уточнює, що означає «задати цифрами»: взяти їх кількість чи " +
      "скласти з них число. Тут береться кількість — інакше таблиця з числа на кшталт " +
      "385617 вийшла б 35 на 86 комірок.",
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
      "Розмір таблиці не заданий явно — його доводиться добувати з числа, розібравши його на " +
      "цифри і розсортувавши за парністю. Типова для веба задача: дані приходять " +
      "рядком, і програма спершу має перетворити їх на щось придатне для розмітки.",
  },
  {
    variant: 6,
    title: "Текстове число",
    statement:
      "Відобразити число, задане параметром, у межах від 0.0 до 9.9 в текстовому вигляді. " +
      "Наприклад 3.3 = «три цілих три десятих».",
    params: [{ name: "value", label: "Число від 0,0 до 9,9", default: "3.3" }],
    build: (v) => {
      const raw = text(v, "value", "3.3").replace(",", ".");
      const parsed = Number.isFinite(Number(raw)) ? Number(raw) : 3.3;
      const value = Math.max(0, Math.min(9.9, parsed));
      const whole = Math.floor(value);
      const tenth = Math.round((value - whole) * 10);

      const units = ["нуль", "одна", "дві", "три", "чотири", "п’ять", "шість", "сім", "вісім", "дев’ять"];
      const plural = (n: number, one: string, few: string, many: string) =>
        n === 1 ? one : n >= 2 && n <= 4 ? few : many;

      const words = [
        units[whole],
        plural(whole, "ціла", "цілих", "цілих"),
        units[tenth],
        plural(tenth, "десята", "десятих", "десятих"),
      ].join(" ");

      return {
        kind: "readout",
        items: [
          { label: "Словами", value: words },
          { label: "Ціла частина", value: String(whole) },
          { label: "Десятих", value: String(tenth) },
        ],
      };
    },
    conclusion:
      "Переведення числа в текст спирається не на саме число, а на його розряди: ціла частина і " +
      "десяті озвучуються окремо, а форма слова залежить від останньої цифри.",
  },
  {
    variant: 7,
    title: "Координати комірки",
    statement:
      "Виконати динамічну побудову таблиці. Число рядків і стовпців задати першим і " +
      "другим параметром, літерою X позначити комірку з координатами з третього і четвертого.",
    params: [
      { name: "rows", label: "Рядків", default: "6" },
      { name: "cols", label: "Стовпців", default: "9" },
      { name: "row", label: "Рядок комірки", default: "3" },
      { name: "col", label: "Стовпець комірки", default: "7" },
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
      "Позначена комірка визначається не окремою гілкою розмітки, а збігом " +
      "лічильників із заданими координатами. Порядок перевірки важливий: спершу затискаються " +
      "розміри таблиці, і лише потім координати в її межах.",
  },
  {
    variant: 8,
    title: "Площа картини",
    statement:
      "Відобразити картину з розмірами з першого і другого параметра (висота і ширина) " +
      "і виконати розрахунок її площі.",
    params: [
      { name: "height", label: "Висота, пікселів", default: "180" },
      { name: "width", label: "Ширина, пікселів", default: "320" },
    ],
    build: (v) => {
      const height = int(v, "height", 180, 1, 4000);
      const width = int(v, "width", 320, 1, 4000);

      return {
        kind: "readout",
        items: [
          { label: "Висота", value: `${height} px` },
          { label: "Ширина", value: `${width} px` },
          { label: "Площа", value: `${(height * width).toLocaleString("ru-RU")} px²` },
          { label: "Співвідношення сторін", value: (width / height).toFixed(3) },
        ],
      };
    },
    conclusion:
      "Розрахунок тривіальний, а от перевірка меж — ні: без неї параметр із рядка браузера " +
      "здатен намалювати зображення розміром з екран або й зовсім нульове.",
  },
  {
    variant: 9,
    title: "Текстова піраміда",
    statement:
      "Побудувати таблицю у вигляді піраміди, висоту якої і розмір одного блока (ширину) " +
      "задати в рядку браузера. Як заповнювач можна використати слово «камінь».",
    params: [
      { name: "height", label: "Висота, рядів", default: "6" },
      { name: "block", label: "Ширина блока, символів", default: "8" },
      { name: "word", label: "Слово-заповнювач", default: "камінь" },
    ],
    build: (v) => {
      const height = int(v, "height", 6, 1, 14);
      const block = int(v, "block", 8, 3, 16);
      const word = text(v, "word", "камінь");
      const cell = word.repeat(Math.ceil(block / word.length)).slice(0, block);

      return { kind: "pyramid", rows: Array.from({ length: height }, (_, i) => i + 1), cell };
    },
    conclusion:
      "Піраміда будується вкладеними циклами, де внутрішній виконується стільки разів, який " +
      "поточний рівень. Слово-заповнювач підрізається до заданої ширини, тому блоки " +
      "залишаються однаковими незалежно від довжини слова.",
  },
  {
    variant: 10,
    title: "Піраміда рисунків",
    statement:
      "Побудувати піраміду з рисунків, висоту якої і розмір одного блока (висоту і " +
      "ширину) задати в рядку браузера.",
    params: [
      { name: "height", label: "Висота, рядів", default: "5" },
      { name: "size", label: "Сторона блока, пікселів", default: "48" },
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
      "Загальна кількість блоків дорівнює сумі арифметичної прогресії, тому її можна не " +
      "рахувати циклом: за висоти n виходить n·(n+1)/2 рисунків.",
  },
  {
    variant: 11,
    title: "Шахи",
    statement:
      "Побудувати на базі таблиці 8×8 чорно-білу дошку для гри в шахи. Поставити " +
      "короля, позначеного літерою K, у координати комірки, задані параметрами.",
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
      "Колір поля визначається парністю суми координат — одна умова замість шістдесяти " +
      "чотирьох окремих комірок. Нумерація горизонталей іде згори вниз, тому зовнішній " +
      "цикл рахує у зворотний бік: інакше дошка вийшла б перевернутою.",
  },
  {
    variant: 12,
    title: "Будинок, що збудував Джек",
    statement:
      "Використавши з першої до п’ятої ланки твору С. Маршака, побудувати перші " +
      "куплети. Текст вирівняти згідно з останнім параметром рядка браузера.",
    params: [
      { name: "verses", label: "Скільки куплетів (1–5)", default: "3" },
      { name: "align", label: "Вирівнювання", default: "justify" },
    ],
    note:
      "Рядки тексту методичка дозволяє задати «за бажанням — у тілі програми або в " +
      "параметрах». Тут вони в тілі: зберігаються не куплети, а ланки, і кожен наступний " +
      "куплет дописує до себе всі попередні.",
    build: (v) => {
      const links: [string, string][] = [
        ["дім", "що його збудував Джек"],
        ["пшениця", "що в темній комірчині зберігається в домі"],
        ["весела синиця-пташка", "що часто краде пшеницю"],
        ["кіт", "що лякає й ловить синицю"],
        ["пес без хвоста", "що за комір скубе кота"],
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
        return `Ось ${parts.join(", ")}.`;
      });

      return { kind: "lines", lines, align };
    },
    conclusion:
      "Текст лічилки зберігається не куплетами, а ланками. Кожен наступний куплет дописує " +
      "до себе всі попередні у зворотному порядку, тому додати шосту ланку — це дописати " +
      "один рядок даних, а не новий абзац.",
  },
  {
    variant: 13,
    title: "Зодіак",
    statement:
      "Залежно від місяця, року та імені видати інформацію про знак зодіаку і звіра " +
      "року народження.",
    params: [
      { name: "name", label: "Ім’я", default: "Іван" },
      { name: "month", label: "Місяць народження", default: "4" },
      { name: "day", label: "День народження", default: "15" },
      { name: "year", label: "Рік народження", default: "2002" },
    ],
    note:
      "Методичка називає три параметри — місяць, рік та ім’я. Доданий день: без нього знак " +
      "зодіаку на межі місяця визначити не можна, бо межі знаків не збігаються " +
      "з межами місяців.",
    build: (v) => {
      const signs: [number, string][] = [
        [20, "Козеріг"], [19, "Водолій"], [21, "Риби"], [20, "Овен"],
        [21, "Телець"], [21, "Близнюки"], [23, "Рак"], [23, "Лев"],
        [23, "Діва"], [23, "Терези"], [22, "Скорпіон"], [22, "Стрілець"],
      ];
      const animals = ["Мавпа", "Півень", "Собака", "Свиня", "Пацюк", "Бик",
                       "Тигр", "Кролик", "Дракон", "Змія", "Кінь", "Коза"];

      const name = text(v, "name", "Іван");
      const month = int(v, "month", 4, 1, 12);
      const day = int(v, "day", 15, 1, 31);
      const year = int(v, "year", 2002, 1900, 2100);

      const [edge, sign] = signs[month - 1];
      const actual = day < edge ? signs[(month + 10) % 12][1] : sign;

      return {
        kind: "readout",
        items: [
          { label: "Ім’я", value: name },
          { label: "Дата", value: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}` },
          { label: "Знак зодіаку", value: actual },
          { label: "Звір року", value: animals[year % 12] },
        ],
      };
    },
    conclusion:
      "Знак зодіаку залежить від дня і місяця, звір року — від остачі року при діленні на " +
      "дванадцять. Обидві залежності зберігаються таблицями, а не ланцюжками умов: таблиця " +
      "коротша, читається як дані і не потребує правок у логіці.",
  },
];

export function taskByVariant(variant: number): ObjectTask {
  const found = OBJECT_TASKS.find((t) => t.variant === variant);
  if (!found) throw new Error(`немає варіанта ${variant}`);

  return found;
}

/** Значения параметров по умолчанию для задания. */
export function defaultValues(task: ObjectTask): Record<string, string> {
  return Object.fromEntries(task.params.map((p) => [p.name, p.default]));
}
