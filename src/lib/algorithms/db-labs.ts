/**
 * «Бази даних», ЛР 1 і ЛР 2 за темою індивідуального завдання: що ввести в
 * Конструкторі, які записи, як розділити таблицю №0, схема даних, результати
 * дослідження, бланки запитів і фільтрів з готовими відповідями, звіт Мастера.
 */

import type { GuideCode, GuideComputed, GuideTable } from "@/lib/data/guides/types";
import { buildModel, fmtDate, fmtMoney, qbeDate, show, sqlDate, type Cell, type DbField, type DbModel, type DbTable } from "./db-model";
import { relSchema } from "./db-figures";

const design = (t: DbTable, title: string, note?: string): GuideTable => ({
  title,
  columns: ["Ім'я поля", "Тип даних", "Розмір / формат", "Маска введення", "Умова на значення", "Повідомлення про помилку"],
  rows: t.fields.map((f) => [f.key ? `${f.name} (ключ)` : f.name, f.type, f.size ?? "", f.mask ?? "", f.rule ?? "", f.msg ?? ""]),
  note,
});

const sheet = (t: DbTable, title: string, rows: Cell[][] = t.rows, note?: string): GuideTable => ({
  title,
  columns: t.fields.map((f) => f.name),
  rows: rows.map((r) => r.map((v, j) => show(t.fields[j], v))),
  note,
  nowrap: true,
});

const col = (t: DbTable, name: string) => t.fields.findIndex((f) => f.name === name);
const fieldList = (t: DbTable) => t.fields.map((f) => f.name).join(", ");
const count = <T,>(xs: T[], x: T) => xs.filter((y) => y === x).length;
/** 1 запис, 2 записи, 5 записів. */
const plural = (k: number, one: string, few: string, many: string) => {
  const d = k % 10;
  const h = k % 100;
  return `${k} ${d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many}`;
};
const records = (k: number) => plural(k, "запис", "записи", "записів");
const times = (k: number) => plural(k, "раз", "рази", "разів");

/** Повтори значень першої і другої сутності в таблиці №0. */
function redundancy(m: DbModel) {
  const per1 = m.t1.fields.length - 1;
  const per2 = m.t2.fields.length - 1;
  const as = m.facts.map((x) => x.a);
  const bs = m.facts.map((x) => x.b);
  const cells = m.e1.reduce((s, _, i) => s + Math.max(0, count(as, i) - 1) * per1, 0) + m.e2.reduce((s, _, i) => s + Math.max(0, count(bs, i) - 1) * per2, 0);
  const top = m.e1.map((_, i) => count(as, i)).reduce((best, c, i, all) => (c > all[best] ? i : best), 0);
  return { cells, top, topCount: count(as, top) };
}

export function dbLab1(n: number): GuideComputed {
  const m = buildModel(n);
  const { t0, t1, t2, t3, f, topic } = m;
  const E1 = t1.name;
  const E2 = t2.name;
  const V = t3.name;
  const red = redundancy(m);
  const top = m.e1[red.topCount > 1 ? red.top : 0];
  const bs = m.facts.map((x) => x.b);
  const as = m.facts.map((x) => x.a);
  // запис, після видалення якого зникає єдина згадка про екземпляр сутності (аномалія видалення)
  const lone2 = m.e2.findIndex((_, i) => count(bs, i) === 1);
  const lone1 = m.e1.findIndex((_, i) => count(as, i) === 1);
  const lone = lone2 >= 0 ? { name: m.e2[lone2].name, row: m.facts.findIndex((x) => x.b === lone2) + 1 } : lone1 >= 0 ? { name: m.e1[lone1].name, row: m.facts.findIndex((x) => x.a === lone1) + 1 } : null;
  const repl = f.city ?? f.n1;
  const replVal = String(t0.rows[0][col(t0, repl.name)]);
  const byDate = [...t0.rows].sort((a, b) => String(a[a.length - 1]).localeCompare(String(b[b.length - 1]))).map((r) => r[0]);
  const linksOfTop = m.facts.filter((x) => x.a === m.e1.indexOf(top)).length;
  const masked = t0.fields.filter((x) => x.mask || x.rule);

  const tsvRows = t0.rows.map((r) =>
    r
      .slice(1)
      .map((v, j) => {
        const fl = t0.fields[j + 1];
        if (fl.type === "Логічний") return v ? "1" : "0";
        if (fl.type === "Дата/час") return fmtDate(String(v));
        return String(v);
      })
      .join("\t"),
  );

  const tables: GuideTable[] = [
    {
      title: `Тема ${n}: ${topic.title}`,
      columns: ["№", "Таблиця в Access", "Поля", "Записів"],
      rows: [
        [0, t0.name, fieldList(t0), t0.rows.length],
        [1, E1, fieldList(t1), t1.rows.length],
        [2, E2, fieldList(t2), t2.rows.length],
        [3, V, fieldList(t3), t3.rows.length],
      ],
      note: `ІМЕННИК1 — «${E1}», ДІЄСЛОВО — «${V}», ІМЕННИК2 — «${E2}». Назви без пробілів — їх не доведеться брати в [дужки] в SQL ЛР 3–6.`,
    },
    design(
      t0,
      "2.3. Таблиця №0 у Конструкторі",
      "Створення → Конструктор таблицьь. Поле Код з типом Лічильник Access ставить ключем сам. У Access 2013 і новіших «Текстовий» називається «Короткий текст». Маски й умови — у нижній частині вікна, «Властивості поля».",
    ),
    sheet(t0, "2.3. Таблиця №0 у Режимі таблиці — роздруківка №1", t0.rows, "Код заповнюється сам; дату вводять цифрами — крапки підставляє маска."),
    {
      title: "2.4. Редагування таблиці №0",
      columns: ["Операція", "Як у Access", "Що зробити у вашій таблиці"],
      rows: [
        ["Зміна розташування поля", "Режим таблиці: клацнути заголовок стовпця і перетягнути", `перетягнути «${f.date.name}» одразу за «Код», потім повернути назад`],
        ["Копіювання запису", "виділити рядок → Ctrl+C → Основне → Вставити → Вставити з додаванням", `скопіювати запис 1 — з'явиться запис 11 з тими самими даними; видалити його (Delete → «Да»)`],
        ["Вставка і вилучення поля", "Конструктор: Вставити рядки / Видалити рядки", `вставити поле «Примітка» (Текстовий) після «${f.n1.name}», зберегти, потім вилучити`],
        ["Заміна інформації в полі", "Основне → Замінити (Ctrl+H), Збіг: Поля цілком", `у полі «${repl.name}» замінити «${replVal}» на «${replVal} ${f.city ? "(центр)" : "(змінено)"}», потім повернути (Замінити все)`],
        ["Сортування", "Основне → За зростанням / За спаданням", `за «${f.date.name}» за зростанням: порядок кодів ${byDate.join(", ")}`],
      ],
    },
    {
      title: "2.4. Таблиці №1 і №2 з таблиці №0",
      columns: ["Крок", "Дія"],
      rows: [
        [1, `Область навігації: виділити «${t0.name}» → Ctrl+C → Ctrl+V → ім'я «${E1}», «Структура й дані».`],
        [2, `Конструктор «${E1}»: вилучити поля ${[...t2.fields.slice(1), f.date].map((x) => x.name).join(", ")}; перейменувати Код на ${f.k1.name}.`],
        [3, `Режим таблиці: виділити записи 6–10 і видалити — дані ${topic.e1.gen.replace(/_/g, " ")} у них повторюють записи 1–5. Лишаються коди 1–5.`],
        [4, `Так само «${E2}»: вилучити ${[...t1.fields.slice(1), f.date].map((x) => x.name).join(", ")}; Код → ${f.k2.name}; видалити записи 6–10 — дані ${topic.e2.gen.replace(/_/g, " ")} у них теж повторюють записи 1–5.`],
      ],
      note: "Перші п'ять записів таблиці №0 містять кожен екземпляр обох сутностей рівно по разу, тому після видалення записів 6–10 коди лічильника в обох таблицях — 1…5 і збігаються з кодами в таблиці №3.",
    },
    sheet(t1, `Таблиця №1 «${E1}» — роздруківка №2`),
    sheet(t2, `Таблиця №2 «${E2}» — роздруківка №3`),
    design(
      t3,
      `2.5. Таблиця №3 «${V}» у Конструкторі`,
      `Ключ складений: виділити рядки ${f.k1.name} і ${f.k2.name} (з Ctrl) → Ключове поле. Тип Числовий, Довге ціле — такий самий, як у лічильника, інакше зв'язок з цілісністю не створиться.`,
    ),
    sheet(t3, `Таблиця №3 «${V}»`, t3.rows, `Ті самі 10 фактів, що в таблиці №0, але замість назв — коди з таблиць «${E1}» і «${E2}».`),
    {
      title: "2.5. Схема даних",
      columns: ["Крок", "Дія"],
      rows: [
        [1, "Робота з базами даних → Схема даних; у вікні «Додавання таблиці» додати три таблиці."],
        [2, `Перетягнути ${f.k1.name} з «${E1}» на ${f.k1.name} у «${V}» → ☑ Забезпечення цілісності даних, ☑ каскадне оновлення пов'язаних полів → Створити.`],
        [3, `Так само ${f.k2.name} з «${E2}» на ${f.k2.name} у «${V}».`],
        [4, "Тип відношення в обох — «один-до-багатьох». Роздруківка: Конструктор → Звіт за схемою даних."],
      ],
    },
    {
      title: "2.6. Дослідження: без зв'язування і зі зв'язуванням",
      columns: ["Дія", `Без зв'язування (таблиця «${t0.name}»)`, `Зі зв'язуванням («${E1}», «${V}», «${E2}»)`],
      rows: [
        ["Зберігання", `дані «${top.name}» записані ${times(red.topCount)}; усього повторених значень — ${red.cells}`, `кожен екземпляр — один запис; у «${V}» лише коди й дата`],
        [
          `Змінити ${f.phone ? "телефон" : f.num.name.replace(/_/g, " ").toLowerCase()} «${top.name}»`,
          `виправити ${records(red.topCount)}; пропущений запис дасть суперечливі дані`,
          `один запис у «${E1}»`,
        ],
        [`Новий запис «${m.newE2.name}» у «${E2}», поки без записів у «${V}»`, `тільки разом з даними ${topic.e1.gen.replace(/_/g, " ")} і датою або з порожніми полями`, `запис у «${E2}», у «${V}» нічого`],
        lone
          ? [`Видалити запис ${lone.row}`, `разом з ним зникнуть дані «${lone.name}» — інших записів з цим значенням немає`, `видаляється лише рядок у «${V}», «${lone.name}» лишається`]
          : [
              "Видалити записи з «" + m.e2[0].name + "»",
              `разом з останнім із них зникнуть і дані «${m.e2[0].name}»`,
              `видаляються лише рядки у «${V}», «${m.e2[0].name}» лишається в «${E2}»`,
            ],
        [`Ввести в «${V}» ${f.k1.name} = 6`, "—", `Access не дасть: «Неможливо додати або змінити запис, оскільки пов'язаний запис потрібен у таблиці "${E1}"»`],
        [
          `Видалити «${top.name}» з «${E1}»`,
          "—",
          `«Неможливо видалити або змінити запис, оскільки таблиця "${V}" містить пов'язані записи»; з ☑ каскадне видалення разом з ним зникнуть ${records(linksOfTop)} «${V}»`,
        ],
      ],
    },
  ];

  const code: GuideCode[] = [
    {
      title: "Маски й умови для «Властивостей поля»",
      code: masked
        .map((x) => [`${x.name}:`, x.mask && `  Маска введення             ${x.mask}`, x.rule && `  Умова на значення          ${x.rule}`, x.msg && `  Повідомлення про помилку   ${x.msg}`].filter(Boolean).join("\n"))
        .join("\n\n"),
      note: "Маска: 0 — обов'язкова цифра, L — обов'язкова літера, > — далі великі літери, \\ — наступний знак виводиться як є. Друга частина «;;» не зберігає роздільники в таблиці, «;0;» — зберігає; _ — заповнювач.",
    },
    {
      title: "Записи таблиці №0 табуляцією (без поля Код)",
      code: [t0.fields.slice(1).map((x) => x.name).join("\t"), ...tsvRows].join("\n") + "\n",
      note: "Шпаргалка для введення. Щоб не вводити вручну: вставити в Excel, зберегти й імпортувати — Зовнішні дані → Excel → «Додати копію записів у кінець таблиці». Логічне поле: 1 — так, 0 — ні.",
    },
  ];

  return {
    tables,
    figures: [
      {
        kind: "drawing",
        title: `Схема даних: «${E1}» — «${V}» — «${E2}»`,
        drawing: relSchema(
          [t1, t3, t2].map((t) => ({ name: t.name, fields: t.fields.map((x) => ({ name: x.name, key: x.key })) })),
          [
            { from: [0, f.k1.name], to: [1, f.k1.name] },
            { from: [2, f.k2.name], to: [1, f.k2.name] },
          ],
        ),
      },
    ],
    code,
  };
}

/* ---------- ЛР 2: умови, запити, фільтри ---------- */

interface Cond {
  field: DbField;
  /** Як пишеться в рядку «Умова відбору». */
  qbe: string;
  /** Те саме в SQL. */
  sql: string;
  test: (v: Cell) => boolean;
}

function textConds(t: DbTable, fl: DbField): Cond[] {
  const j = col(t, fl.name);
  const vals = [...new Set(t.rows.map((r) => String(r[j])))];
  return vals.map((v) => ({ field: fl, qbe: `"${v}"`, sql: `${fl.name} = "${v}"`, test: (x) => String(x) === v }));
}

function likeConds(t: DbTable, fl: DbField): Cond[] {
  const j = col(t, fl.name);
  const letters = [...new Set(t.rows.map((r) => String(r[j]).slice(0, 1)))];
  return letters.map((c) => ({ field: fl, qbe: `Like "${c}*"`, sql: `${fl.name} Like "${c}*"`, test: (x) => String(x).startsWith(c) }));
}

function numConds(t: DbTable, fl: DbField, fmt: (v: number) => string = String): Cond[] {
  const j = col(t, fl.name);
  const vals = [...new Set(t.rows.map((r) => Number(r[j])))].sort((a, b) => a - b);
  return [
    ...vals.map((v) => ({ field: fl, qbe: `>=${fmt(v)}`, sql: `${fl.name} >= ${fmt(v)}`, test: (x: Cell) => Number(x) >= v })),
    ...vals.map((v) => ({ field: fl, qbe: `<=${fmt(v)}`, sql: `${fl.name} <= ${fmt(v)}`, test: (x: Cell) => Number(x) <= v })),
  ];
}

function dateConds(t: DbTable, fl: DbField): Cond[] {
  const j = col(t, fl.name);
  const vals = [...new Set(t.rows.map((r) => String(r[j])))].sort();
  return vals.map((v) => ({ field: fl, qbe: `>=${qbeDate(v)}`, sql: `${fl.name} >= ${sqlDate(v)}`, test: (x: Cell) => String(x) >= v }));
}

const hits = (t: DbTable, c: Cond) => t.rows.filter((r) => c.test(r[col(t, c.field.name)]));

/** Пара умов, для якої «і» звужує, а «або» розширює вибірку — щоб у звіті було видно різницю. */
function pickPair(t: DbTable, as: Cond[], bs: Cond[], mode: "and" | "or"): [Cond, Cond] {
  const n = t.rows.length;
  const ok = (c: Cond, r: Cell[]) => c.test(r[col(t, c.field.name)]);
  // «і» — близько 40 % записів, «або» — близько 60 %; кожна умова окремо має давати інший результат
  const want = mode === "and" ? 0.4 * n : 0.6 * n;
  let best: { pair: [Cond, Cond]; score: number } | null = null;
  for (const a of as)
    for (const b of bs) {
      const ha = hits(t, a).length;
      const hb = hits(t, b).length;
      const res = t.rows.filter((r) => (mode === "and" ? ok(a, r) && ok(b, r) : ok(a, r) || ok(b, r))).length;
      if (res < 1 || res >= n) continue;
      const strict = mode === "and" ? res < Math.min(ha, hb) : res > Math.max(ha, hb);
      const score = Math.abs(res - want) + (strict ? 0 : n);
      if (!best || score < best.score) best = { pair: [a, b], score };
    }
  return best?.pair ?? [as[0], bs[0]];
}

function grid(fields: { f: DbField; table: string }[], sort: Record<string, string>, cond: Record<string, string>, or: Record<string, string>, title: string, note?: string): GuideTable {
  const cell = (rec: Record<string, string>) => fields.map((x) => rec[x.f.name] ?? "");
  const rows: (string | number)[][] = [
    ["Ім'я таблиці", ...fields.map((x) => x.table)],
    ["Сортування", ...cell(sort)],
    ["Виведення на екран", ...fields.map(() => "☑")],
    ["Умова відбору", ...cell(cond)],
  ];
  if (Object.keys(or).length) rows.push(["або", ...cell(or)]);
  return { title, columns: ["Поле", ...fields.map((x) => x.f.name)], rows, note };
}

export function dbLab2(n: number): GuideComputed {
  const m = buildModel(n);
  const { t0, t1, t2, t3, f } = m;
  const E1 = t1.name;
  const E2 = t2.name;
  const V = t3.name;
  const money = (v: number) => String(v);

  // 2.2: таблиця №1, «і» та «або»
  const txt = f.city ? textConds(t1, f.city) : [...likeConds(t1, f.n1), ...(f.reg ? likeConds(t1, f.reg) : [])];
  const nums = numConds(t1, f.num);
  const [a1, a2] = pickPair(t1, txt, nums, "and");
  const [o1, o2] = pickPair(t1, txt, nums, "or");
  const all1 = t1.fields.map((x) => ({ f: x, table: E1 }));
  const andRows = t1.rows.filter((r) => a1.test(r[col(t1, a1.field.name)]) && a2.test(r[col(t1, a2.field.name)]));
  const orRows = t1.rows.filter((r) => o1.test(r[col(t1, o1.field.name)]) || o2.test(r[col(t1, o2.field.name)]));

  // 2.3: зв'язані таблиці, умова на дату дії
  const dates = [...m.facts.map((x) => x.date)].sort();
  const from = dates[Math.floor(dates.length / 2) - 1];
  const joined = m.facts
    .filter((x) => x.date >= from)
    .sort((x, y) => x.date.localeCompare(y.date))
    .map((x) => [m.e1[x.a].name, m.e2[x.b].name, fmtDate(x.date), fmtMoney(m.e2[x.b].money)]);
  const jf = [
    { f: f.n1, table: E1 },
    { f: f.n2, table: E2 },
    { f: f.date, table: V },
    { f: f.money, table: E2 },
  ];

  // 2.5: звіт — групи за ІМЕННИК1 (Мастер упорядковує їх за значенням), усередині — за датою; Sum і Avg грошового поля
  const report: (string | number)[][] = [];
  let total = 0;
  const groups = m.e1.map((e, i) => ({ e, i })).sort((x, y) => x.e.name.localeCompare(y.e.name, "uk"));
  for (const { e, i } of groups) {
    const fs = m.facts.filter((x) => x.a === i).sort((x, y) => x.date.localeCompare(y.date));
    if (!fs.length) continue;
    report.push([e.name, "", "", ""]);
    fs.forEach((x) => report.push(["", fmtDate(x.date), m.e2[x.b].name, fmtMoney(m.e2[x.b].money)]));
    const sum = fs.reduce((s, x) => s + m.e2[x.b].money, 0);
    total += sum;
    report.push([`Підсумки для «${f.n1.name}» = ${e.name} (${fs.length})`, "", "Sum", fmtMoney(sum)]);
    report.push(["", "", "Avg", fmtMoney(sum / fs.length)]);
  }
  report.push(["РАЗОМ", "", "Sum", fmtMoney(total)]);
  report.push(["", "", "Avg", fmtMoney(total / m.facts.length)]);

  // 2.6: фільтр за виділенням — найчастіший ІМЕННИК1 у таблиці №0
  const red = redundancy(m);
  const sel = m.e1[red.top];
  const selRows = t0.rows.filter((r) => r[col(t0, f.n1.name)] === sel.name);

  // 2.7: розширений фільтр по таблиці №0
  const dc = dateConds(t0, f.date);
  const mc = numConds(t0, f.money, money).filter((c) => c.qbe.startsWith(">="));
  const [fa, fb] = pickPair(t0, dc, mc, "and");
  const fAnd = t0.rows.filter((r) => fa.test(r[col(t0, fa.field.name)]) && fb.test(r[col(t0, fb.field.name)]));
  const e2a = m.e2[0].name;
  const e2b = m.e2[1].name;
  const fOr = t0.rows.filter((r) => [e2a, e2b].includes(String(r[col(t0, f.n2.name)])));
  const fgrid = (cond: Record<string, string>, or: Record<string, string>, title: string, note: string) =>
    grid(
      [...new Set([...Object.keys(cond), ...Object.keys(or)])].map((name) => ({ f: t0.fields[col(t0, name)], table: t0.name })),
      {},
      cond,
      or,
      title,
      note,
    );

  const tables: GuideTable[] = [
    grid(all1, {}, { [a1.field.name]: a1.qbe, [a2.field.name]: a2.qbe }, {}, `2.2. Запит «логічне і» по таблиці «${E1}» — бланк`, "Створення → Конструктор запитів → додати таблицю. Обидві умови в одному рядку «Умова відбору» — виконуються разом."),
    sheet(t1, `Результат запиту «логічне і» — роздруківка №1 (${andRows.length} з ${t1.rows.length})`, andRows),
    grid(all1, {}, { [o1.field.name]: o1.qbe }, { [o2.field.name]: o2.qbe }, `2.2. Запит «логічне або» по таблиці «${E1}» — бланк`, "Друга умова — у рядку «або»: достатньо однієї з двох."),
    sheet(t1, `Результат запиту «логічне або» — роздруківка №2 (${orRows.length} з ${t1.rows.length})`, orRows),
    grid(jf, { [f.date.name]: "за зростанням" }, { [f.date.name]: `>=${qbeDate(from)}` }, {}, `2.3. Запит по зв'язаних таблицях «${E1}», «${V}», «${E2}» — бланк`, "Додати три таблиці — зв'язки підтягнуться зі схеми даних ЛР 1."),
    { title: `Результат запиту по зв'язаних таблицях — роздруківка №3 (${joined.length} з ${m.facts.length})`, columns: jf.map((x) => x.f.name), rows: joined, nowrap: true },
    {
      title: "2.4. Дослідження типу бінарного зв'язку",
      columns: ["Що зв'язати", "Індекси полів", "Тип у вікні «Зміна зв'язків»"],
      rows: [
        [`${E1}.${f.k1.name} → ${V}.${f.k1.name}`, "з одного боку ключ, з іншого — повтори дозволені", `один-до-багатьох (1:Б): «${sel.name}» має ${records(red.topCount)} в «${V}»`],
        [`${E2}.${f.k2.name} → ${V}.${f.k2.name}`, "те саме", "один-до-багатьох (1:Б)"],
        [`${E1} і ${E2}`, "—", `Б:Б: Access такого типу не має, зв'язок реалізує таблиця «${V}» як два зв'язки 1:Б`],
        [`${E1}.${f.k1.name} → копія «${E1}» (Ctrl+C, Ctrl+V)`, "ключ з обох боків", "один-до-одного (1:1)"],
        [`${E1}.${f.n1.name} → ${t0.name}.${f.n1.name}`, "без ключа й унікального індексу з обох боків", "невизначене — «Забезпечення цілісності даних» недоступне"],
      ],
      note: "Перед зміною індексів поля зв'язок треба видалити: у Схемі даних клацнути лінію → Delete.",
    },
    {
      title: "2.5. Майстер звітів",
      columns: ["Крок", "Що вибрати"],
      rows: [
        ["Поля", `${E1}: ${f.n1.name}; ${V}: ${f.date.name}; ${E2}: ${f.n2.name}, ${f.money.name}`],
        ["Вид подання", `по «${E1}» — групування за ${f.n1.name} з'явиться сам`],
        ["Сортування", `${f.date.name} за зростанням`],
        ["Підсумки", `${f.money.name}: ☑ Sum ☑ Avg, «дані й підсумки»`],
        ["Макет", "східчастий, книжкова"],
        ["Ім'я звіту", `Звіт_${V}`],
      ],
    },
    { title: `Звіт «Звіт_${V}» — роздруківка №4`, columns: [f.n1.name, f.date.name, f.n2.name, f.money.name], rows: report, nowrap: true },
    {
      title: `2.6. Фільтр за виділенням у таблиці «${t0.name}» — роздруківка №5`,
      columns: t0.fields.map((x) => x.name),
      rows: selRows.map((r) => r.map((v, j) => show(t0.fields[j], v))),
      nowrap: true,
      note: `Виділити в стовпці ${f.n1.name} значення «${sel.name}» → Основне → Виділення → «Дорівнює "${sel.name}"». Зняти — Видалити фільтр.`,
    },
    fgrid({ [fa.field.name]: fa.qbe, [fb.field.name]: fb.qbe }, {}, "2.7. Розширений фільтр «логічне і» — бланк", "Основне → Додатково → Розширений фільтр; застосувати — Застосувати фільтр."),
    sheet(t0, `Результат фільтра «логічне і» — роздруківка №6 (${fAnd.length} з ${t0.rows.length})`, fAnd),
    fgrid({ [f.n2.name]: `"${e2a}"` }, { [f.n2.name]: `"${e2b}"` }, "2.7. Розширений фільтр «логічне або» — бланк", "Друге значення — у рядку «або»."),
    sheet(t0, `Результат фільтра «логічне або» — роздруківка №7 (${fOr.length} з ${t0.rows.length})`, fOr),
  ];

  const where = (c: Cond) => c.sql;
  const code: GuideCode[] = [
    {
      title: "Ті самі запити в режимі SQL (Основне → Режим → Режим SQL)",
      code: [
        `SELECT * FROM ${E1}\nWHERE ${where(a1)} AND ${where(a2)};`,
        `SELECT * FROM ${E1}\nWHERE ${where(o1)} OR ${where(o2)};`,
        `SELECT ${E1}.${f.n1.name}, ${E2}.${f.n2.name}, ${V}.${f.date.name}, ${E2}.${f.money.name}\nFROM ${E2} INNER JOIN (${E1} INNER JOIN ${V} ON ${E1}.${f.k1.name} = ${V}.${f.k1.name})\n    ON ${E2}.${f.k2.name} = ${V}.${f.k2.name}\nWHERE ${V}.${f.date.name} >= ${sqlDate(from)}\nORDER BY ${V}.${f.date.name};`,
      ].join("\n\n"),
      note: "У бланку дату пишуть за регіональними параметрами (#дд.мм.рррр#), у режимі SQL Access показує її як #мм/дд/рррр#.",
    },
  ];
  return { tables, code };
}
