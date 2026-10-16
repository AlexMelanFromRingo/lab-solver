/**
 * «Бази даних», ЛР 3–6: оператори SQL програми Microsoft Access (Jet SQL)
 * для схеми «ІМЕННИК1 — ДІЄСЛОВО — ІМЕННИК2», як у методичці (Вагон —
 * везе — вантаж). Типи й синтаксис — ті, що приймає Access: TEXT(n),
 * INTEGER, CURRENCY, DATETIME, YESNO; дати в #…#, шаблон LIKE — «*».
 */

export interface Field {
  name: string;
  type: string;
  key: boolean;
}

export interface Schema {
  e1: string;
  verb: string;
  e2: string;
  f1: Field[];
  f2: Field[];
  /** Власні атрибути зв'язку (крім ключів сутностей). */
  fr: Field[];
  /** Значення полів із записів бази (ЛР 1) — для умов і нових записів. */
  data?: Record<string, (string | number | boolean)[]>;
  /** Значення нового запису ІМЕННИК2 (ЛР 4, п. 2.3). */
  fresh?: Record<string, string | number | boolean>;
}

/** «Назва ТИП [*]» по рядку; * — ключове поле. */
export function parseFields(src: string): Field[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const key = /\*\s*$/.test(l);
      const parts = l.replace(/\*\s*$/, "").trim().split(/\s+/);
      if (parts.length < 2) throw new Error(`Рядок «${l}»: потрібно «Назва ТИП»`);
      const type = parts.pop()!.toUpperCase();
      return { name: parts.join("_"), type, key };
    });
}

const isText = (t: string) => /^(TEXT|CHAR|VARCHAR|MEMO)/.test(t);
const isDate = (t: string) => /^(DATETIME|DATE|TIMESTAMP)/.test(t);
const isBool = (t: string) => /^(YESNO|BIT|LOGICAL)/.test(t);
const isNum = (t: string) => !isText(t) && !isDate(t) && !isBool(t);

/** Літерал Access SQL для значення поля. */
function lit(f: Field, v: string | number | boolean): string {
  if (isText(f.type)) return `"${v}"`;
  if (isDate(f.type)) return `#${String(v).slice(5, 7)}/${String(v).slice(8, 10)}/${String(v).slice(0, 4)}#`;
  if (isBool(f.type)) return v ? "True" : "False";
  return String(v);
}

/** Значення для INSERT і умов: із записів бази, якщо поле відоме, інакше правдоподібне за типом. */
export function sample(f: Field, i = 0, s?: Schema): string {
  const vs = s?.data?.[f.name];
  if (vs?.length) return lit(f, vs[i % vs.length]);
  if (isText(f.type)) return `"${f.name}_${i + 1}"`;
  if (isDate(f.type)) return `#0${(i % 9) + 1}/15/2024#`;
  if (isBool(f.type)) return i % 2 ? "False" : "True";
  if (/CURRENCY/.test(f.type)) return String(100 + 25 * i);
  return String(10 + i);
}

/** Відсортовані значення числового поля — межі для BETWEEN, порогів. */
function sorted(s: Schema, f: Field): number[] | null {
  const vs = s.data?.[f.name];
  return vs?.length ? vs.map(Number).sort((a, b) => a - b) : null;
}

const keys = (fs: Field[]) => fs.filter((f) => f.key);
const cols = (fs: Field[]) => fs.map((f) => `    ${f.name} ${f.type}${f.key ? " NOT NULL" : ""}`);
const firstOf = (fs: Field[], pred: (t: string) => boolean) => fs.find((f) => !f.key && pred(f.type)) ?? fs.find((f) => !f.key) ?? fs[0];

export function lab3Ddl(s: Schema): { title: string; sql: string }[] {
  const t1 = `${s.e1}_НОВИЙ`;
  const t2 = `${s.verb}_${s.e2}`;
  const k1 = keys(s.f1);
  const k2 = keys(s.f2);
  const txt = firstOf(s.f1, isText);
  const num = firstOf(s.f1, isNum);
  return [
    {
      title: "2.2. Таблиця №1 з ключем і унікальним індексом",
      sql: `CREATE TABLE ${t1} (
${cols(s.f1).join(",\n")},
    CONSTRAINT PK_${s.e1} PRIMARY KEY (${k1.map((f) => f.name).join(", ")})
);

CREATE UNIQUE INDEX ${s.e1}_UNQ ON ${t1} (${k1.map((f) => f.name).join(", ")});`,
    },
    {
      title: "2.2. Таблиця №2 із зовнішнім ключем",
      sql: `CREATE TABLE ${t2} (
${cols([...k1.map((f) => ({ ...f })), ...s.fr, ...s.f2.map((f) => ({ ...f, key: f.key }))]).join(",\n")},
    CONSTRAINT PK_${t2} PRIMARY KEY (${[...k1, ...k2].map((f) => f.name).join(", ")}),
    CONSTRAINT ${k1[0].name}_FK FOREIGN KEY (${k1.map((f) => f.name).join(", ")}) REFERENCES ${t1} (${k1.map((f) => f.name).join(", ")})
);`,
    },
    {
      title: "2.3. Редагування структури таблиці №1 (Alter)",
      sql: `ALTER TABLE ${t1} ADD COLUMN Примітка TEXT(50);
ALTER TABLE ${t1} ADD CONSTRAINT ${s.e1}_IDX UNIQUE (Примітка);
ALTER TABLE ${t1} DROP CONSTRAINT ${s.e1}_IDX;
ALTER TABLE ${t1} DROP COLUMN Примітка;`,
    },
    {
      title: "2.4. Видалення таблиці №2 (спершу індекс)",
      sql: `CREATE INDEX ${t2}_IDX ON ${t2} (${firstOf(s.f2, isText).name});
DROP INDEX ${t2}_IDX ON ${t2};
DROP TABLE ${t2};`,
    },
    {
      title: "2.5. Простий і композитний індекси для дослідження продуктивності",
      sql: `CREATE INDEX ${s.e1}_S ON ${t1} (${num.name});
CREATE INDEX ${s.e1}_C ON ${t1} (${num.name}, ${txt.name});`,
    },
  ];
}

export function lab4Dml(s: Schema): { title: string; sql: string }[] {
  const t1 = `${s.e1}_НОВИЙ`;
  const sv = (f: Field, i: number) => sample(f, i, s);
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const upd = s.f1.find((f) => !f.key && isText(f.type) && f !== txt) ?? txt;
  // ДІЄСЛОВО — таблиця зв'язку з ЛР 1–2 (ключі обох сутностей і власні поля)
  const link = s.verb;
  const k2 = keys(s.f2)[0];
  const money = firstOf(s.f2, isNum);
  const date = s.fr.find((f) => isDate(f.type));
  const v = sorted(s, num);
  const fresh = s.fresh;
  const insert = fresh
    ? (() => {
        const fs = s.f2.filter((f) => !f.key && f.name in fresh);
        return `INSERT INTO ${s.e2} (${fs.map((f) => f.name).join(", ")})\nVALUES (${fs.map((f) => lit(f, fresh[f.name])).join(", ")});`;
      })()
    : `INSERT INTO ${s.e2} (${s.f2.map((f) => f.name).join(", ")})\nVALUES (${s.f2.map((f, i) => sv(f, i + 7)).join(", ")});`;
  return [
    { title: "2.2. Перенесення даних з таблиці ЛР 2 у таблицю, створену в ЛР 3", sql: `INSERT INTO ${t1}\nSELECT * FROM ${s.e1};` },
    {
      title: "2.3. Новий запис у таблицю ІМЕННИК_2",
      sql: insert + (fresh ? `\n\n-- ${keys(s.f2).map((f) => f.name).join(", ")} — лічильник, Access заповнить сам` : ""),
    },
    { title: "2.4. Відновлення значень одного поля (усі записи)", sql: `UPDATE ${t1} SET ${num.name} = ${num.name} + 1;` },
    { title: "2.4. Відновлення даних за умовою", sql: `UPDATE ${t1} SET ${upd.name} = ${sv(upd, 2)}\nWHERE ${k1.name} = ${sv(k1, 0)};` },
    {
      title: "2.4. Відновлення декількох полів в одному записі",
      sql: `UPDATE ${t1} SET ${num.name} = ${sv(num, 3)}, ${upd.name} = ${sv(upd, 4)}\nWHERE ${k1.name} = ${sv(k1, 1)};`,
    },
    {
      title: "2.4. Відновлення декількох полів у декількох записах",
      sql: `UPDATE ${t1} SET ${num.name} = ${v ? v[v.length - 1] : sv(num, 5)}, ${upd.name} = ${sv(upd, 0)}\nWHERE ${num.name} BETWEEN ${v ? v[0] : sv(num, 0)} AND ${v ? v[2] : sv(num, 5)};`,
    },
    { title: "2.4. Видалення даних за умовою (таблиця ДІЄСЛОВО)", sql: `DELETE FROM ${link}\nWHERE ${k2.name} = ${sv(k2, 2)};` },
    {
      title: "2.5. Форми Update: вираз, підзапит, зв'язані таблиці",
      sql: [
        `UPDATE ${s.e2} SET ${money.name} = ${money.name} * 1.1;`,
        `UPDATE ${t1} SET ${num.name} = ${num.name} * 2\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${link});`,
        `UPDATE ${s.e2} INNER JOIN ${link} ON ${s.e2}.${k2.name} = ${link}.${k2.name}\nSET ${s.e2}.${money.name} = ${s.e2}.${money.name} * 0.9\nWHERE ${link}.${(date ?? k1).name} ${date ? `>= ${sv(date, 4)}` : `= ${sv(k1, 0)}`};`,
      ].join("\n\n"),
    },
  ];
}

export function lab5Dql(s: Schema): { title: string; sql: string }[] {
  const t = s.e1;
  const sv = (f: Field, i: number) => sample(f, i, s);
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const grp = s.f1.find((f) => !f.key && isText(f.type) && f !== txt) ?? txt;
  const link = s.verb;
  const v = sorted(s, num);
  const lo = v ? v[1] : sv(num, 0);
  const hi = v ? v[3] : sv(num, 5);
  const gv = s.data?.[grp.name];
  const inList = gv?.length ? [...new Set(gv)].slice(0, 2).map((x) => lit(grp, x)) : [0, 1, 2].map((i) => sv(k1, i));
  const inField = gv?.length ? grp : k1;
  const first = s.data?.[txt.name]?.[0];
  const letter = typeof first === "string" ? first.slice(0, 1) : txt.name.slice(0, 1);
  return [
    { title: "IS NULL / IS NOT NULL", sql: `SELECT * FROM ${t} WHERE ${grp.name} IS NULL;\nSELECT * FROM ${t} WHERE ${grp.name} IS NOT NULL;` },
    { title: "BETWEEN / NOT BETWEEN", sql: `SELECT * FROM ${t} WHERE ${num.name} BETWEEN ${lo} AND ${hi};\nSELECT * FROM ${t} WHERE ${num.name} NOT BETWEEN ${lo} AND ${hi};` },
    { title: "IN / NOT IN", sql: `SELECT * FROM ${t} WHERE ${inField.name} IN (${inList.join(", ")});\nSELECT * FROM ${t} WHERE ${inField.name} NOT IN (${inList.join(", ")});` },
    { title: "LIKE / NOT LIKE (в Access шаблон — * і ?)", sql: `SELECT * FROM ${t} WHERE ${txt.name} LIKE "${letter}*";\nSELECT * FROM ${t} WHERE ${txt.name} NOT LIKE "*а*";` },
    {
      title: "EXISTS / NOT EXISTS",
      sql: `SELECT * FROM ${t} WHERE EXISTS\n    (SELECT * FROM ${link} WHERE ${link}.${k1.name} = ${t}.${k1.name});\nSELECT * FROM ${t} WHERE NOT EXISTS\n    (SELECT * FROM ${link} WHERE ${link}.${k1.name} = ${t}.${k1.name});`,
    },
    { title: "ALL / ANY", sql: `SELECT * FROM ${t} WHERE ${num.name} >= ALL (SELECT ${num.name} FROM ${t});\nSELECT * FROM ${t} WHERE ${num.name} > ANY (SELECT ${num.name} FROM ${t});` },
    {
      title: "Предикати добору: ALL, DISTINCT, DISTINCTROW, TOP n [PERCENT]",
      sql: `SELECT ALL ${grp.name} FROM ${t};\nSELECT DISTINCT ${grp.name} FROM ${t};\nSELECT DISTINCTROW ${t}.* FROM ${t} INNER JOIN ${link} ON ${t}.${k1.name} = ${link}.${k1.name};\nSELECT TOP 3 * FROM ${t} ORDER BY ${num.name} DESC;\nSELECT TOP 25 PERCENT * FROM ${t} ORDER BY ${num.name};`,
    },
    {
      title: "GROUP BY, HAVING і WHERE, ORDER BY",
      sql: `SELECT ${grp.name}, COUNT(*) AS Кількість, AVG(${num.name}) AS Середнє\nFROM ${t}\nWHERE ${num.name} >= ${v ? v[1] : sv(num, 0)}\nGROUP BY ${grp.name}\nHAVING COUNT(*) >= 1\nORDER BY ${grp.name};`,
    },
  ];
}

export function lab6Complex(s: Schema): { title: string; sql: string }[] {
  const a = s.e1;
  const sv = (f: Field, i: number) => sample(f, i, s);
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const grp = s.f1.find((f) => !f.key && isText(f.type) && f !== txt) ?? txt;
  const rel = `${s.verb}_${s.e2}`;
  const r2 = firstOf(s.f2, isText);
  const n2 = firstOf(s.f2, isNum);
  return [
    { title: "Зв'язування за рівністю", sql: `SELECT ${a}.${k1.name}, ${a}.${txt.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel}\nWHERE ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Натуральне зв'язування (спільний стовпець один раз)", sql: `SELECT ${a}.*, ${rel}.${r2.name}, ${rel}.${n2.name}\nFROM ${a} INNER JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Зв'язування за нерівністю", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel}\nWHERE ${a}.${k1.name} <> ${rel}.${k1.name};` },
    { title: "Зовнішнє зв'язування (LEFT / RIGHT JOIN)", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a} LEFT JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};\n\nSELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a} RIGHT JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Кросс-зв'язування (декартовий добуток)", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel};` },
    { title: "Рекурсивне зв'язування (таблиця сама з собою)", sql: `SELECT X.${k1.name}, Y.${k1.name} AS Пара\nFROM ${a} AS X, ${a} AS Y\nWHERE X.${grp.name} = Y.${grp.name} AND X.${k1.name} < Y.${k1.name};` },
    { title: "Підзапит у Select", sql: `SELECT * FROM ${a}\nWHERE ${num.name} > (SELECT AVG(${num.name}) FROM ${a});` },
    { title: "Підзапит в Insert", sql: `INSERT INTO ${a}_НОВИЙ\nSELECT * FROM ${a}\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${rel});` },
    { title: "Підзапит в Update", sql: `UPDATE ${a} SET ${num.name} = ${num.name} + 1\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${rel} WHERE ${n2.name} > ${sv(n2, 3)});` },
    { title: "Підзапит у Delete", sql: `DELETE FROM ${rel}\nWHERE ${k1.name} NOT IN (SELECT ${k1.name} FROM ${a});` },
    {
      title: "UNION і UNION ALL з order by та group by",
      sql: `SELECT ${txt.name} AS Назва FROM ${a}\nUNION\nSELECT ${r2.name} FROM ${rel}\nORDER BY Назва;\n\nSELECT ${grp.name} AS Назва, COUNT(*) AS Кількість FROM ${a} GROUP BY ${grp.name}\nUNION ALL\nSELECT ${r2.name}, COUNT(*) FROM ${rel} GROUP BY ${r2.name};`,
    },
  ];
}

export const DEFAULT_SCHEMA = {
  e1: "ВАГОН",
  verb: "ВЕЗЕ",
  e2: "ВАНТАЖ",
  f1: "Ном_вагона INTEGER *\nТип_вагона TEXT(20)\nТара_вагона INTEGER\nДата_побудови DATETIME\nВартість CURRENCY\nРолики YESNO",
  fr: "Дата_відправлення DATETIME",
  f2: "Код_вантажу INTEGER *\nНазва_вантажу TEXT(30)\nВідправник TEXT(30)\nМаса_вантажу INTEGER",
};
