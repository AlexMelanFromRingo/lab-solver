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

/** Правдоподібне значення за типом (для INSERT і умов). */
export function sample(f: Field, i = 0): string {
  if (isText(f.type)) return `'${f.name}_${i + 1}'`;
  if (isDate(f.type)) return `#0${(i % 9) + 1}/15/2024#`;
  if (isBool(f.type)) return i % 2 ? "False" : "True";
  if (/CURRENCY/.test(f.type)) return String(100 + 25 * i);
  return String(10 + i);
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
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const rel = `${s.e1}_${s.verb}_${s.e2}`;
  const k2 = keys(s.f2)[0];
  const other = s.f1.filter((f) => !f.key && f !== num).slice(0, 2);
  return [
    { title: "2.2. Перенесення даних з таблиці ЛР 2 у таблицю, створену в ЛР 3", sql: `INSERT INTO ${t1}\nSELECT * FROM ${s.e1};` },
    { title: "2.3. Новий запис у таблицю ІМЕННИК_2", sql: `INSERT INTO ${s.e2} (${s.f2.map((f) => f.name).join(", ")})\nVALUES (${s.f2.map((f, i) => sample(f, i + 7)).join(", ")});` },
    { title: "2.4. Відновлення значень одного поля (усі записи)", sql: `UPDATE ${t1} SET ${num.name} = ${num.name} + 1;` },
    { title: "2.4. Відновлення даних за умовою", sql: `UPDATE ${t1} SET ${txt.name} = ${sample(txt, 20)}\nWHERE ${k1.name} = ${sample(k1, 0)};` },
    {
      title: "2.4. Відновлення декількох полів в одному записі",
      sql: `UPDATE ${t1} SET ${[num, ...other].map((f, i) => `${f.name} = ${sample(f, i + 3)}`).join(", ")}\nWHERE ${k1.name} = ${sample(k1, 1)};`,
    },
    {
      title: "2.4. Відновлення декількох полів у декількох записах",
      sql: `UPDATE ${t1} SET ${[num, ...other].slice(0, 2).map((f, i) => `${f.name} = ${sample(f, i + 5)}`).join(", ")}\nWHERE ${num.name} BETWEEN ${sample(num, 0)} AND ${sample(num, 5)};`,
    },
    { title: "2.4. Видалення даних за умовою", sql: `DELETE FROM ${rel}\nWHERE ${k2.name} = ${sample(k2, 2)};` },
    {
      title: "2.5. Update з підзапитом (інша форма конструкції)",
      sql: `UPDATE ${t1} SET ${num.name} = ${num.name} * 2\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${rel});`,
    },
  ];
}

export function lab5Dql(s: Schema): { title: string; sql: string }[] {
  const t = s.e1;
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const rel = `${s.e1}_${s.verb}_${s.e2}`;
  return [
    { title: "IS NULL / IS NOT NULL", sql: `SELECT * FROM ${t} WHERE ${txt.name} IS NULL;\nSELECT * FROM ${t} WHERE ${txt.name} IS NOT NULL;` },
    { title: "BETWEEN / NOT BETWEEN", sql: `SELECT * FROM ${t} WHERE ${num.name} BETWEEN ${sample(num, 0)} AND ${sample(num, 5)};\nSELECT * FROM ${t} WHERE ${num.name} NOT BETWEEN ${sample(num, 0)} AND ${sample(num, 5)};` },
    { title: "IN / NOT IN", sql: `SELECT * FROM ${t} WHERE ${k1.name} IN (${[0, 1, 2].map((i) => sample(k1, i)).join(", ")});\nSELECT * FROM ${t} WHERE ${k1.name} NOT IN (${[0, 1].map((i) => sample(k1, i)).join(", ")});` },
    { title: "LIKE / NOT LIKE (в Access шаблон — * і ?)", sql: `SELECT * FROM ${t} WHERE ${txt.name} LIKE '${txt.name.slice(0, 1)}*';\nSELECT * FROM ${t} WHERE ${txt.name} NOT LIKE '*а*';` },
    { title: "EXISTS / NOT EXISTS", sql: `SELECT * FROM ${t} WHERE EXISTS\n    (SELECT * FROM ${rel} WHERE ${rel}.${k1.name} = ${t}.${k1.name});\nSELECT * FROM ${t} WHERE NOT EXISTS\n    (SELECT * FROM ${rel} WHERE ${rel}.${k1.name} = ${t}.${k1.name});` },
    { title: "ALL / ANY", sql: `SELECT * FROM ${t} WHERE ${num.name} >= ALL (SELECT ${num.name} FROM ${t});\nSELECT * FROM ${t} WHERE ${num.name} > ANY (SELECT ${num.name} FROM ${t});` },
    { title: "Предикати добору: ALL, DISTINCT, DISTINCTROW, TOP n [PERCENT]", sql: `SELECT ALL ${txt.name} FROM ${t};\nSELECT DISTINCT ${txt.name} FROM ${t};\nSELECT DISTINCTROW ${t}.* FROM ${t} INNER JOIN ${rel} ON ${t}.${k1.name} = ${rel}.${k1.name};\nSELECT TOP 3 * FROM ${t} ORDER BY ${num.name} DESC;\nSELECT TOP 25 PERCENT * FROM ${t} ORDER BY ${num.name};` },
    { title: "GROUP BY, HAVING і WHERE, ORDER BY", sql: `SELECT ${txt.name}, COUNT(*) AS Кількість, AVG(${num.name}) AS Середнє\nFROM ${t}\nWHERE ${num.name} > ${sample(num, 0)}\nGROUP BY ${txt.name}\nHAVING COUNT(*) >= 1\nORDER BY ${txt.name};` },
  ];
}

export function lab6Complex(s: Schema): { title: string; sql: string }[] {
  const a = s.e1;
  const k1 = keys(s.f1)[0];
  const num = firstOf(s.f1, isNum);
  const txt = firstOf(s.f1, isText);
  const rel = `${s.verb}_${s.e2}`;
  const r2 = firstOf(s.f2, isText);
  const n2 = firstOf(s.f2, isNum);
  return [
    { title: "Зв'язування за рівністю", sql: `SELECT ${a}.${k1.name}, ${a}.${txt.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel}\nWHERE ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Натуральне зв'язування (спільний стовпець один раз)", sql: `SELECT ${a}.*, ${rel}.${r2.name}, ${rel}.${n2.name}\nFROM ${a} INNER JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Зв'язування за нерівністю", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel}\nWHERE ${a}.${num.name} > ${rel}.${n2.name};` },
    { title: "Зовнішнє зв'язування (LEFT / RIGHT JOIN)", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a} LEFT JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};\n\nSELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a} RIGHT JOIN ${rel} ON ${a}.${k1.name} = ${rel}.${k1.name};` },
    { title: "Кросс-зв'язування (декартовий добуток)", sql: `SELECT ${a}.${k1.name}, ${rel}.${r2.name}\nFROM ${a}, ${rel};` },
    { title: "Рекурсивне зв'язування (таблиця сама з собою)", sql: `SELECT X.${k1.name}, Y.${k1.name} AS Пара\nFROM ${a} AS X, ${a} AS Y\nWHERE X.${txt.name} = Y.${txt.name} AND X.${k1.name} < Y.${k1.name};` },
    { title: "Підзапит у Select", sql: `SELECT * FROM ${a}\nWHERE ${num.name} > (SELECT AVG(${num.name}) FROM ${a});` },
    { title: "Підзапит в Insert", sql: `INSERT INTO ${a}_НОВИЙ\nSELECT * FROM ${a}\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${rel});` },
    { title: "Підзапит в Update", sql: `UPDATE ${a} SET ${num.name} = ${num.name} + 1\nWHERE ${k1.name} IN (SELECT ${k1.name} FROM ${rel} WHERE ${n2.name} > ${sample(n2, 3)});` },
    { title: "Підзапит у Delete", sql: `DELETE FROM ${rel}\nWHERE ${k1.name} NOT IN (SELECT ${k1.name} FROM ${a});` },
    {
      title: "UNION і UNION ALL з order by та group by",
      sql: `SELECT ${txt.name} AS Назва FROM ${a}\nUNION\nSELECT ${r2.name} FROM ${rel}\nORDER BY Назва;\n\nSELECT ${txt.name} AS Назва, COUNT(*) AS Кількість FROM ${a} GROUP BY ${txt.name}\nUNION ALL\nSELECT ${r2.name}, COUNT(*) FROM ${rel} GROUP BY ${r2.name};`,
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
