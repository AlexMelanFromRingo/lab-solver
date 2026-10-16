/**
 * «Бази даних», ЛР 1–6: база даних Access за темою індивідуального завдання.
 * Із теми «ІМЕННИК1 — ДІЄСЛОВО — ІМЕННИК2» будуються таблиці №0–№3 з ЛР 1
 * (поля різних типів, маски введення, умови на значення, 10 записів), а
 * на них — запити, звіт і фільтри ЛР 2 з готовими результатами. Дані
 * детерміновані: той самий номер теми дає ті самі записи.
 */

import { DB_TOPICS, type DbEntity, type DbTopic } from "@/lib/data/db-topics";
import type { Schema } from "@/lib/algorithms/access-sql";

export type AccessType = "Счетчик" | "Текстовый" | "Числовой" | "Денежный" | "Дата/время" | "Логический";

export interface DbField {
  name: string;
  type: AccessType;
  /** Размер поля / Формат. */
  size?: string;
  mask?: string;
  rule?: string;
  msg?: string;
  key?: boolean;
  /** Тип у Jet SQL для ЛР 3–6. */
  sql: string;
}

/** Значення: текст, число, дата «РРРР-ММ-ДД», логічне. */
export type Cell = string | number | boolean;

export interface DbTable {
  name: string;
  fields: DbField[];
  rows: Cell[][];
}

interface E1 {
  name: string;
  city?: string;
  phone?: string;
  reg?: string;
  num: number;
}
interface E2 {
  name: string;
  money: number;
  flag: boolean;
}
interface Fact {
  a: number;
  b: number;
  date: string;
}

export interface DbModel {
  topic: DbTopic;
  e1: E1[];
  e2: E2[];
  facts: Fact[];
  /** Шостий екземпляр ІМЕННИК2 — для нового запису в ЛР 4. */
  newE2: E2;
  f: {
    k1: DbField;
    n1: DbField;
    city?: DbField;
    phone?: DbField;
    reg?: DbField;
    num: DbField;
    k2: DbField;
    n2: DbField;
    money: DbField;
    flag: DbField;
    date: DbField;
  };
  t0: DbTable;
  t1: DbTable;
  t2: DbTable;
  t3: DbTable;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORGS = ["Альфа", "Вектор", "Гарант", "Злагода", "Меридіан", "Олімп", "Престиж", "Фортуна", "Еталон", "Каштан", "Світанок", "Явір"];
const PEOPLE = [
  "Коваленко О. П.", "Бондаренко І. В.", "Шевчук М. А.", "Мельник Т. С.", "Ткаченко Д. Ю.", "Кравченко Н. О.",
  "Олійник В. Г.", "Савченко А. М.", "Руденко К. Л.", "Марченко Ю. Р.", "Лисенко С. В.", "Гончаренко Л. І.",
];
const CITIES = ["Дніпро", "Київ", "Львів", "Харків", "Одеса", "Полтава"];
const OPS = ["050", "063", "066", "067", "068", "073", "093", "095", "096", "097", "098", "099"];

/** Округлення до двох значущих цифр — ціни виглядають як справжні. */
function nice(x: number) {
  if (x < 10) return Math.max(1, Math.round(x));
  const p = 10 ** (Math.floor(Math.log10(x)) - 1);
  return Math.round(x / p) * p;
}

function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const nameField = (e: DbEntity) => `${e.kind === "person" ? "ПІБ" : "Назва"}_${e.gen}`;

function instances(e: DbEntity, r: () => number): string[] {
  if (e.list) return [...shuffle(e.list.slice(0, 5), r), e.list[5] ?? `${e.list[0]} (новий)`];
  return shuffle(e.kind === "person" ? PEOPLE : ORGS, r).slice(0, 6);
}

export const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
/** Дата для SQL програми Access: #ММ/ДД/РРРР#. */
export const sqlDate = (d: string) => `#${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}#`;
/** Дата в бланку запиту чи фільтра з українськими регіональними параметрами. */
export const qbeDate = (d: string) => `#${fmtDate(d)}#`;

function group3(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
export function fmtMoney(x: number) {
  const c = Math.round(x * 100);
  return `${group3(Math.floor(c / 100))},${String(c % 100).padStart(2, "0")} грн`;
}
const fmtPhone = (p: string) => `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8)}`;

/** Як значення виглядає в Режиме таблицы. */
export function show(f: DbField, v: Cell): string {
  if (f.type === "Дата/время") return fmtDate(String(v));
  if (f.type === "Денежный") return fmtMoney(Number(v));
  if (f.type === "Логический") return v ? "☑" : "☐";
  if (f.mask?.startsWith("000\\-000")) return fmtPhone(String(v));
  return String(v);
}

export function buildModel(n: number): DbModel {
  const topic = DB_TOPICS[n - 1];
  if (!topic) throw new Error(`Теми №${n} немає: номери від 1 до ${DB_TOPICS.length}`);
  const r = rng(n * 7919 + 17);
  const { e1: E1d, e2: E2d } = topic;

  const n1 = instances(E1d, r);
  const n2 = instances(E2d, r);
  const cities = shuffle(CITIES, r).slice(0, 3);
  const [, lo, hi] = E1d.num ?? ["Рейтинг", 1, 5];
  const step = hi - lo > 1000 ? 50 : hi - lo > 100 ? 10 : 1;
  const prefix = E1d.name.slice(0, 2).toUpperCase();
  let e1: E1[] = [];
  // числове поле першої сутності — без повторів і не всі однакові
  for (let tries = 0; tries < 50; tries++) {
    e1 = n1.slice(0, 5).map((name, i) => ({
      name,
      city: E1d.kind === "thing" ? undefined : cities[i < 3 ? i : Math.floor(r() * 3)],
      phone: E1d.kind === "thing" ? undefined : OPS[Math.floor(r() * OPS.length)] + String(1000000 + Math.floor(r() * 9000000)).slice(0, 7),
      reg: E1d.kind === "thing" ? `${prefix}-${String(Math.floor(r() * 9000) + 1000)}` : undefined,
      num: lo + step * Math.floor((r() * (hi - lo + 1)) / step),
    }));
    if (new Set(e1.map((x) => x.num)).size >= Math.min(4, hi - lo + 1)) break;
  }
  const used = new Set<number>();
  const mk = (name: string): E2 => {
    let money = nice(E2d.scale * (0.5 + r() * 1.1));
    for (let k = 0; k < 20 && used.has(money); k++) money = nice(E2d.scale * (0.5 + r() * 1.1));
    used.add(money);
    return { name, money, flag: r() < 0.5 };
  };
  let e2 = n2.slice(0, 5).map(mk);
  if (e2.every((x) => x.flag === e2[0].flag)) e2 = e2.map((x, i) => (i === 2 ? { ...x, flag: !x.flag } : x));
  const newE2 = mk(n2[5]);

  // перші п'ять фактів — пари (i, i): після вилучення повторів у копіях таблиці №0
  // коди лічильника в таблицях №1 і №2 лишаються 1…5
  const pairs: [number, number][] = [0, 1, 2, 3, 4].map((i) => [i, i]);
  while (pairs.length < 10) {
    const a = Math.floor(r() * 5);
    const b = Math.floor(r() * 5);
    if (a !== b && !pairs.some(([x, y]) => x === a && y === b)) pairs.push([a, b]);
  }
  const days = new Set<number>();
  while (days.size < 10) days.add(Math.floor(r() * 520));
  const base = Date.UTC(2024, 0, 9);
  const facts = pairs.map(([a, b], i) => ({ a, b, date: new Date(base + [...days][i] * 86400000).toISOString().slice(0, 10) }));

  const f = {
    k1: { name: `Код_${E1d.gen}`, type: "Счетчик", key: true, size: "Длинное целое", sql: "INTEGER" } as DbField,
    n1: { name: nameField(E1d), type: "Текстовый", size: "40", sql: "TEXT(40)" } as DbField,
    city: E1d.kind === "thing" ? undefined : ({ name: "Місто", type: "Текстовый", size: "20", sql: "TEXT(20)" } as DbField),
    phone:
      E1d.kind === "thing"
        ? undefined
        : ({ name: "Телефон", type: "Текстовый", size: "10", mask: "000\\-000\\-00\\-00;;_", sql: "TEXT(10)" } as DbField),
    reg: E1d.kind === "thing" ? ({ name: "Код_реєстру", type: "Текстовый", size: "7", mask: ">LL\\-0000;0;_", sql: "TEXT(7)" } as DbField) : undefined,
    num: {
      name: E1d.num?.[0] ?? "Рейтинг",
      type: "Числовой",
      size: "Длинное целое",
      rule: `Between ${lo} And ${hi}`,
      msg: `${(E1d.num?.[0] ?? "Рейтинг").replace(/_/g, " ")}: від ${lo} до ${hi}`,
      sql: "INTEGER",
    } as DbField,
    k2: { name: `Код_${E2d.gen}`, type: "Счетчик", key: true, size: "Длинное целое", sql: "INTEGER" } as DbField,
    n2: { name: nameField(E2d), type: "Текстовый", size: "40", sql: "TEXT(40)" } as DbField,
    money: { name: E2d.money, type: "Денежный", size: "Денежный", rule: ">0", msg: "Сума має бути більшою за нуль", sql: "CURRENCY" } as DbField,
    flag: { name: E2d.flag, type: "Логический", size: "Да/Нет", sql: "YESNO" } as DbField,
    date: {
      name: `Дата_${topic.act}`,
      type: "Дата/время",
      size: "Краткий формат даты",
      mask: "00.00.0000;0;_",
      rule: "<=Date()",
      msg: "Дата не може бути пізнішою за сьогоднішню",
      sql: "DATETIME",
    } as DbField,
  };

  const e1Fields = [f.n1, f.city, f.phone, f.reg, f.num].filter(Boolean) as DbField[];
  const e1Vals = (x: E1) => [x.name, x.city, x.phone, x.reg, x.num].filter((v) => v !== undefined) as Cell[];
  const e2Fields = [f.n2, f.money, f.flag];
  const e2Vals = (x: E2) => [x.name, x.money, x.flag];

  const t0: DbTable = {
    name: `${E1d.name}_${topic.verb}_${E2d.name}`,
    fields: [{ name: "Код", type: "Счетчик", key: true, size: "Длинное целое", sql: "COUNTER" }, ...e1Fields, ...e2Fields, f.date],
    rows: facts.map((x, i) => [i + 1, ...e1Vals(e1[x.a]), ...e2Vals(e2[x.b]), x.date]),
  };
  const t1: DbTable = { name: E1d.name, fields: [f.k1, ...e1Fields], rows: e1.map((x, i) => [i + 1, ...e1Vals(x)]) };
  const t2: DbTable = { name: E2d.name, fields: [f.k2, ...e2Fields], rows: e2.map((x, i) => [i + 1, ...e2Vals(x)]) };
  const fk = (k: DbField): DbField => ({ ...k, type: "Числовой", key: true });
  const t3: DbTable = {
    name: topic.verb,
    fields: [fk(f.k1), fk(f.k2), f.date],
    rows: facts.map((x) => [x.a + 1, x.b + 1, x.date]),
  };
  return { topic, e1, e2, facts, newE2, f, t0, t1, t2, t3 };
}

/** Схема для SQL ЛР 3–6: назви за темою, ключі — цілі, значення для умов — із записів. */
export function sqlSchema(m: DbModel): Schema {
  const plain = (fs: DbField[]) => fs.map((x) => ({ name: x.name, type: x.sql === "COUNTER" ? "INTEGER" : x.sql, key: !!x.key }));
  const data: Record<string, Cell[]> = {};
  for (const t of [m.t1, m.t2, m.t3]) t.fields.forEach((fl, j) => (data[fl.name] ??= t.rows.map((row) => row[j])));
  return {
    e1: m.t1.name,
    verb: m.t3.name,
    e2: m.t2.name,
    f1: plain(m.t1.fields),
    f2: plain(m.t2.fields),
    fr: plain([m.f.date]),
    data,
    fresh: { [m.f.n2.name]: m.newE2.name, [m.f.money.name]: m.newE2.money, [m.f.flag.name]: m.newE2.flag },
  };
}

/** Рядки «Назва ТИП *» для полів віджета SQL. */
export function schemaText(m: DbModel) {
  const s = sqlSchema(m);
  const lines = (fs: Schema["f1"]) => fs.map((x) => `${x.name} ${x.type}${x.key ? " *" : ""}`).join("\n");
  return { e1: s.e1, verb: s.verb, e2: s.e2, f1: lines(s.f1), fr: lines(s.fr), f2: lines(s.f2) };
}
