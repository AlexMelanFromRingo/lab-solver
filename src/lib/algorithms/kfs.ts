/**
 * «Теорія проектування кіберфізичних систем» (методички КС ЛР1–ЛР7):
 * технологические объекты, минимальные остовные деревья, классификация
 * системы, время выполнения ФПБ и заявок, быстродействие МКП, информационные
 * потоки и техническая структура (КОК, МКП, центральная БД).
 *
 * Данные варианта приходят из файла Excel преподавателя (листы «Координати»,
 * «Ділянки», «ФПБ») или из примеров методичек. Вычисления — те же, что в
 * генераторе отчётов курса (tools/calc.py); правила, которых методички не
 * задают, вынесены в параметры и описаны в errata модулей.
 */

import { addr, type CellValue, type Sheet } from "./xlsx-read";

export interface KfsSignal {
  kind: string;
  func: string;
  name: string;
  /** Дільниця → [інтенсивність | null, кількість | null]. */
  per: Record<string, [number | null, number | null]>;
}

export interface KfsRequest {
  obj: string;
  name: string;
  /** Рядки блоку ланцюга: комірки кроків (стовпці D…M), null — порожньо. */
  rows: (string | null)[][];
  /** Тгр, мс і адресат, якщо є у файлі. */
  tgr?: number;
  to?: string;
  /** Інтенсивність заявки з файлу (у варіантах задана лише для заявок ДП), 1/с. */
  lam?: number;
  /** «Зміна бази даних», «Видача кер. впливу» («ТАК», «НІ», «ТАК(ТП2)»), обсяг повідомлення, байт. */
  dbChange?: string;
  ctrl?: string;
  vol?: number;
  kgot?: number;
}

export interface KfsDbArray {
  name: string;
  /** Обсяг масиву, Мбайт. */
  size: number;
  /** Частка масиву, яку використовує ФПБ: [ФПБ 0..]. */
  frac: number[];
}

export interface KfsVariant {
  source: string;
  names: string[];
  xy: Record<string, [number, number]>;
  /** Кабельні відстані замовника: ключ pairKey(a, b). */
  cable: Record<string, number>;
  sections: string[];
  struct: Record<string, Record<string, number>>;
  /** Розташування дільниць у сітці ТП (рядок, стовпець, Д) — для рисунка. */
  structCells: Record<string, [number, number, string][]>;
  signals: KfsSignal[];
  /** Кількість команд: [вид команди 0..3][ФПБ 0..]. */
  fpbK: number[][];
  mkp: { n: number; name: string; f: number }[];
  requests: KfsRequest[];
  /** Масиви БД (аркуш «ФПБ»); у файлах, збережених до ЛР5–ЛР7, відсутні. */
  db?: KfsDbArray[];
}

export const CMD = ["складення", "множення", "ділення", "пересилання"] as const;
/** Методичка ЛР4, табл. 2: такти на команду за номером МКП. */
export const DEFAULT_TACTS: number[][] = [
  [1, 13, 24, 1],
  [1, 10, 20, 1],
  [1, 10, 20, 1],
];

export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

// ------------------------------------------------------------------ читання файлу

const num = (v: CellValue | undefined): number | null => (typeof v === "number" ? v : null);
const str = (v: CellValue | undefined) => (v == null ? "" : String(v).trim());

export function parseVariant(sheets: Record<string, Sheet>, source: string): KfsVariant {
  const need = (n: string) => {
    const s = sheets[n];
    if (!s) throw new Error(`У файлі немає аркуша «${n}». Потрібен файл варіанта від викладача (аркуші «Координати», «Ділянки», «ФПБ»).`);
    return s;
  };
  const co = need("Координати");
  const names: string[] = [];
  const xy: KfsVariant["xy"] = {};
  for (let r = 3; r < 40; r++) {
    const n = str(co.get(addr(2, r)));
    if (!n) break;
    const x = num(co.get(addr(3, r)));
    const y = num(co.get(addr(4, r)));
    if (x == null || y == null) throw new Error(`Аркуш «Координати»: немає координат для ${n}.`);
    names.push(n);
    xy[n] = [x, y];
  }
  const cable: Record<string, number> = {};
  for (let c = 5; c < 5 + names.length + 2; c++) {
    const head = str(co.get(addr(c, 2)));
    if (!head) continue;
    names.forEach((n, i) => {
      const v = num(co.get(addr(c, 3 + i)));
      if (v != null && n !== head) cable[pairKey(n, head)] = v;
    });
  }

  const di = need("Ділянки");
  // шапка ТП у рядку 2; кожен ТП займає стовпці до наступного заголовка
  const heads: [number, string][] = [];
  for (let c = 1; c < 30; c++) {
    const h = str(di.get(addr(c, 2)));
    if (/^ТП\d+/.test(h)) heads.push([c, h]);
  }
  const struct: KfsVariant["struct"] = {};
  const structCells: KfsVariant["structCells"] = {};
  heads.forEach(([c0, tp], k) => {
    const c1 = k + 1 < heads.length ? heads[k + 1][0] : c0 + 4;
    const cnt: Record<string, number> = {};
    const cells: [number, number, string][] = [];
    for (let r = 3; r <= 5; r++)
      for (let c = c0; c < c1; c++) {
        const d = str(di.get(addr(c, r)));
        if (/^Д\d+$/.test(d)) {
          cnt[d] = (cnt[d] ?? 0) + 1;
          cells.push([r - 3, c - c0, d]);
        }
      }
    struct[tp] = cnt;
    structCells[tp] = cells;
  });
  const sections: string[] = [];
  for (let c = 4; c < 40; c += 2) {
    const h = str(di.get(addr(c, 9)));
    const m = /(\d+)/.exec(h);
    if (!m) break;
    sections.push(`Д${m[1]}`);
  }
  const signals: KfsSignal[] = [];
  let kind = "";
  let func = "";
  for (let r = 12; r < 60; r++) {
    const name = str(di.get(addr(3, r))).replace(/\s+/g, "");
    if (!name) break;
    kind = str(di.get(addr(1, r))) || kind;
    func = str(di.get(addr(2, r))) || func;
    const per: KfsSignal["per"] = {};
    sections.forEach((d, j) => {
      per[d] = [num(di.get(addr(4 + 2 * j, r))), num(di.get(addr(5 + 2 * j, r)))];
    });
    signals.push({ kind, func, name, per });
  }

  const fp = need("ФПБ");
  let nf = 0;
  while (str(fp.get(addr(3 + nf, 2))).startsWith("Ф")) nf++;
  const fpbK = [0, 1, 2, 3].map((c) => Array.from({ length: nf }, (_, b) => num(fp.get(addr(3 + b, 3 + c))) ?? 0));
  // таблиця МКП: «Номер МКП», «Назва», «Тактова частота» у рядку 2 (у варіантах стоїть у різних стовпцях)
  const headCol = (re: RegExp, dflt: number) => {
    for (let c = 3; c < 40; c++) if (re.test(str(fp.get(addr(c, 2))))) return c;
    return dflt;
  };
  const cN = headCol(/^Номер МКП/, 15);
  const cName = headCol(/^Назва/, cN + 1);
  const cF = headCol(/^Тактова/, cN + 3);
  const mkp = [4, 5, 6]
    .map((r) => ({ n: num(fp.get(addr(cN, r))) ?? r - 3, name: str(fp.get(addr(cName, r))), f: num(fp.get(addr(cF, r))) ?? 0 }))
    .filter((m) => m.f > 0);
  // масиви БД: «М3(128Мбайт)» і частки масиву за ФПБ
  const db: KfsDbArray[] = [];
  for (let r = 3; r < 20; r++) {
    const m = /^М(\d+)\s*\(\s*([\d.,]+)\s*Мбайт\s*\)/.exec(str(fp.get(addr(2, r))).replace(/\s+/g, ""));
    if (m) db.push({ name: `М${m[1]}`, size: Number(m[2].replace(",", ".")), frac: Array.from({ length: nf }, (_, b) => num(fp.get(addr(3 + b, r))) ?? 0) });
  }
  const numText = (v: CellValue | undefined) => (typeof v === "number" ? v : v != null && /^[\d.,]+$/.test(String(v).trim()) ? Number(String(v).replace(",", ".")) : undefined);
  const requests: KfsRequest[] = [];
  const lastRow = Math.max(17, ...[...fp.keys()].map((a) => Number(/\d+$/.exec(a)?.[0] ?? 0)));
  let obj = "";
  let cur: KfsRequest | null = null;
  for (let r = 17; r <= lastRow; r++) {
    obj = str(fp.get(addr(1, r))).replace(/\s+/g, "") || obj;
    const nm = str(fp.get(addr(2, r)));
    const row = Array.from({ length: 10 }, (_, k) => str(fp.get(addr(4 + k, r))) || null);
    if (nm) {
      cur = {
        obj,
        name: nm,
        rows: [],
        lam: num(fp.get(addr(3, r))) ?? undefined,
        dbChange: str(fp.get(addr(14, r))) || undefined,
        ctrl: str(fp.get(addr(15, r))) || undefined,
        to: str(fp.get(addr(16, r))).replace(/\s+/g, "") || undefined,
        vol: numText(fp.get(addr(17, r))),
        tgr: num(fp.get(addr(18, r))) ?? undefined,
        kgot: numText(fp.get(addr(19, r))),
      };
      requests.push(cur);
    }
    if (cur && row.some(Boolean)) cur.rows.push(row);
  }
  return { source, names, xy, cable, sections, struct, structCells, signals, fpbK, mkp, requests, db };
}

// ------------------------------------------------------------------ ЛР1

export interface Lab1Fix {
  a: string;
  b: string;
  lk: number | null;
  lg: number;
  fixed: number;
  why: "lt" | "big" | "none";
}

export interface Lab1 {
  /** Пари ТО з різницею координат до 1 м, об'єднані в складні. */
  groups: string[][];
  /** Об'єкти після об'єднання (складні — через «_»). */
  names: string[];
  xy: Record<string, [number, number]>;
  geom: Record<string, number>;
  cable: Record<string, number>;
  nearest: { a: string; b: string; d: number }[];
  k: number;
  kPair: [string, string] | null;
  fixes: Lab1Fix[];
  cableFixed: Record<string, number>;
  longest: [string, string];
}

const ceil3 = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e6) / 1000;
const dist = (p: [number, number], q: [number, number]) => Math.hypot(p[0] - q[0], p[1] - q[1]);

/**
 * kOverride — коефіцієнт трасування для уточнення (за замовчуванням — найбільше
 * l_к/l_г серед каналів, що пройшли перевірку).
 */
export function lab1(v: KfsVariant, kOverride?: number): Lab1 {
  // об'єднання: різниця кожної координати не більше 1 м
  const groups: string[][] = [];
  const used = new Set<string>();
  for (const a of v.names) {
    if (used.has(a)) continue;
    const g = [a, ...v.names.filter((b) => b !== a && !used.has(b) && Math.abs(v.xy[a][0] - v.xy[b][0]) <= 0.0010000001 && Math.abs(v.xy[a][1] - v.xy[b][1]) <= 0.0010000001)];
    g.forEach((n) => used.add(n));
    groups.push(g);
  }
  // складний ТО бере координати й кабельні відстані першого члена (ТП), як у методичці
  const names = groups.map((g) => g.join("_"));
  const head = Object.fromEntries(groups.map((g) => [g.join("_"), g[0]]));
  const xy = Object.fromEntries(names.map((n) => [n, v.xy[head[n]]])) as Lab1["xy"];
  const geom: Record<string, number> = {};
  const cable: Record<string, number> = {};
  const pairs: [string, string][] = [];
  names.forEach((a, i) =>
    names.slice(i + 1).forEach((b) => {
      pairs.push([a, b]);
      geom[pairKey(a, b)] = dist(xy[a], xy[b]);
      const c = v.cable[pairKey(head[a], head[b])];
      if (c != null) cable[pairKey(a, b)] = c;
    }),
  );
  const nearest = v.names
    .flatMap((a, i) => v.names.slice(i + 1).map((b) => ({ a, b, d: dist(v.xy[a], v.xy[b]) })))
    .sort((p, q) => p.d - q.d)
    .slice(0, 4);
  // таблиці методички порівнюють відстані з точністю до метра
  const r3 = (x: number) => Math.round(x * 1000);
  let best = 0;
  let kPair: [string, string] | null = null;
  for (const [a, b] of pairs) {
    const c = cable[pairKey(a, b)];
    const g = geom[pairKey(a, b)];
    if (c != null && r3(c) >= r3(g) && c / g <= 2 && c / g > best) {
      best = c / g;
      kPair = [a, b];
    }
  }
  const k = kOverride ?? (kPair ? Math.round(best * 1000) / 1000 : 1);
  const fixes: Lab1Fix[] = [];
  const cableFixed = { ...cable };
  for (const [a, b] of pairs) {
    const key = pairKey(a, b);
    const g = geom[key];
    const c = cable[key];
    const why = c == null ? "none" : r3(c) < r3(g) ? "lt" : c / g > 2 ? "big" : null;
    if (!why) continue;
    const fixed = ceil3(g * k);
    fixes.push({ a, b, lk: c ?? null, lg: g, fixed, why });
    cableFixed[key] = fixed;
  }
  const longest = pairs.reduce((m, p) => (geom[pairKey(...p)] > geom[pairKey(...m)] ? p : m), pairs[0]);
  return { groups, names, xy, geom, cable, nearest, k, kPair, fixes, cableFixed, longest };
}

// ------------------------------------------------------------------ ЛР2

export interface Tree {
  key: "МКДг" | "МКДк" | "МКДге" | "МКДке";
  rows: { a: string; b: string; w: number; mark: string }[];
  edges: [string, string][];
  total: number;
  elite: [string, string] | null;
}

function kruskal(names: string[], w: Record<string, number>, key: Tree["key"], elite: [string, string] | null): Tree {
  const order: [string, string][] = [];
  names.forEach((a, i) => names.slice(i + 1).forEach((b) => order.push([a, b])));
  order.sort((p, q) => w[pairKey(...p)] - w[pairKey(...q)] || names.indexOf(p[0]) - names.indexOf(q[0]) || names.indexOf(p[1]) - names.indexOf(q[1]));
  if (elite) {
    const i = order.findIndex((e) => pairKey(...e) === pairKey(...elite));
    order.unshift(...order.splice(i, 1));
  }
  const parent: Record<string, string> = Object.fromEntries(names.map((n) => [n, n]));
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const rows: Tree["rows"] = [];
  const edges: [string, string][] = [];
  for (const [a, b] of order) {
    const wt = w[pairKey(a, b)];
    if (edges.length === names.length - 1) {
      rows.push({ a, b, w: wt, mark: "" });
      continue;
    }
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) rows.push({ a, b, w: wt, mark: "-" });
    else {
      parent[ra] = rb;
      edges.push([a, b]);
      rows.push({ a, b, w: wt, mark: key });
    }
  }
  return { key, rows, edges, total: edges.reduce((s, e) => s + w[pairKey(...e)], 0), elite };
}

export function lab2(l1: Lab1): Tree[] {
  return [
    kruskal(l1.names, l1.geom, "МКДг", null),
    kruskal(l1.names, l1.cableFixed, "МКДк", null),
    kruskal(l1.names, l1.geom, "МКДге", l1.longest),
    kruskal(l1.names, l1.cableFixed, "МКДке", l1.longest),
  ];
}

// ------------------------------------------------------------------ ЛР3

/** Індекс системи за УІП (ОРТМ). */
export function uipIndex(n: number): number {
  return n > 2500 ? 5 : n > 650 ? 4 : n > 160 ? 3 : n > 40 ? 2 : 1;
}

export function lab3(v: KfsVariant) {
  const tps = Object.keys(v.struct);
  // УІП — сигнали, що надходять до системи, тобто лише вхідні: у прикладі
  // методички ТП1 = 3459 і ТП2 = 1816 сходяться саме так
  const rows = v.signals.map((s) => {
    const input = s.kind.startsWith("Вхідн");
    const hasLam = input && v.sections.some((d) => s.per[d]?.[0] != null);
    const lam = Object.fromEntries(tps.map((tp) => [tp, Object.entries(v.struct[tp]).reduce((acc, [d, m]) => acc + m * (s.per[d]?.[0] ?? 0), 0)]));
    const cnt = Object.fromEntries(tps.map((tp) => [tp, Object.entries(v.struct[tp]).reduce((acc, [d, m]) => acc + m * (s.per[d]?.[1] ?? 0), 0)]));
    return { ...s, input, lam: hasLam ? lam : null, cnt: input ? cnt : null };
  });
  const inputs = rows.filter((r) => r.input);
  const totCnt = Object.fromEntries(tps.map((tp) => [tp, inputs.reduce((a, r) => a + (r.cnt?.[tp] ?? 0), 0)]));
  const totLam = Object.fromEntries(tps.map((tp) => [tp, inputs.reduce((a, r) => a + (r.lam?.[tp] ?? 0), 0)]));
  const secCnt = Object.fromEntries(v.sections.map((d) => [d, inputs.reduce((a, s) => a + (s.per[d]?.[1] ?? 0), 0)]));
  const secLam = Object.fromEntries(v.sections.map((d) => [d, inputs.reduce((a, s) => a + (s.per[d]?.[0] ?? 0), 0)]));
  const uipS = tps.reduce((a, tp) => a + totCnt[tp], 0);
  return {
    tps,
    rows,
    totCnt,
    totLam,
    secCnt,
    secLam,
    uipS,
    lamS: tps.reduce((a, tp) => a + totLam[tp], 0),
    idx: Object.fromEntries(tps.map((tp) => [tp, uipIndex(totCnt[tp])])),
    idxS: uipIndex(uipS),
  };
}

/**
 * Обладнання ДП: Кмон = ]d/m[ + i, Кприн = ]m/d[ + i. Розшифровки ]x[ у
 * методичці немає; у її прикладі (d = 5, m = 6) ]5/6[ = 2 і ]6/5[ = 1, тобто
 * дріб перевертається й округлюється вгору — так і рахуємо.
 */
export function equipment(nDp: number, d: number, m: number) {
  const br = (a: number, b: number) => Math.ceil(b / a);
  return Array.from({ length: nDp }, (_, k) => ({ i: k + 1, mon: br(d, m) + k + 1, prn: br(m, d) + k + 1 }));
}

// ------------------------------------------------------------------ ЛР4

export type StepKind = "one" | "alt" | "par";
export interface ChainStep {
  kind: StepKind;
  /** Доданки [коефіцієнт, номер ФПБ] у формулі часу. */
  terms: [number, number][];
}

const CELL = /^Г(\d*)\(Ф(\d+);\s*([\d.,]+%|--)\)$/;

/**
 * Крок ланцюга з комірок одного стовпця. Г — один ФПБ; Г1, Г2 … з відсотками —
 * альтернативи (сума p·T); Г1, Г2 … з «--» — гілки, що виконуються всі (на
 * одному МКП послідовно, сума T); Г21, Г22 … — альтернативи всередині гілки Г2.
 */
export function chainStep(cells: string[]): ChainStep {
  const groups = new Map<string, { plain: [number | null, number] | null; sub: [number, number][] }>();
  for (const s of cells) {
    const m = CELL.exec(s.trim());
    if (!m) throw new Error(`Не розпізнано запис ланцюга «${s}»`);
    const [, lbl, f, p] = m;
    const prob = p === "--" ? null : Number(p.replace("%", "").replace(",", ".")) / 100;
    const g = lbl.slice(0, 1) || "0";
    if (!groups.has(g)) groups.set(g, { plain: null, sub: [] });
    const gr = groups.get(g)!;
    if (lbl.length >= 2) gr.sub.push([prob ?? 1, Number(f)]);
    else gr.plain = [prob, Number(f)];
  }
  const alt = [...groups.values()].some((g) => g.plain && g.plain[0] != null);
  const terms: [number, number][] = [];
  for (const g of groups.values()) {
    if (g.sub.length) terms.push(...g.sub);
    else if (g.plain) terms.push([alt ? (g.plain[0] ?? 1) : 1, g.plain[1]]);
  }
  return { kind: alt ? "alt" : groups.size > 1 ? "par" : "one", terms };
}

export function lab4(v: KfsVariant, tacts: number[][] = DEFAULT_TACTS) {
  const nf = v.fpbK[0].length;
  // t[m][c] — мкс (частота в МГц)
  const t = v.mkp.map((m, mi) => CMD.map((_, c) => (tacts[mi]?.[c] ?? 0) / m.f));
  const T = v.mkp.map((_, mi) => Array.from({ length: nf }, (_, b) => CMD.reduce((s, _c, c) => s + t[mi][c] * v.fpbK[c][b], 0)));
  const cmds = Array.from({ length: nf }, (_, b) => CMD.reduce((s, _c, c) => s + v.fpbK[c][b], 0));
  const Q = cmds.map((n) => (n * 2) / 2 ** 20);
  const reqs = v.requests.map((q) => {
    const width = Math.max(...q.rows.map((r) => r.length));
    const steps: ChainStep[] = [];
    for (let k = 0; k < width; k++) {
      const cells = q.rows.map((r) => r[k]).filter((x): x is string => !!x);
      if (cells.length) steps.push(chainStep(cells));
    }
    const time = v.mkp.map((_, mi) => steps.reduce((s, st) => s + st.terms.reduce((a, [p, f]) => a + p * (T[mi][f - 1] ?? 0), 0), 0));
    return { ...q, steps, time };
  });
  return { t, T, cmds, Q, Qs: Q.reduce((a, b) => a + b, 0), reqs };
}

// ------------------------------------------------------------------ інтенсивності заявок

const SIG = /^(ДІ|ЧІ|АІ|ІН)(\d)(\d+)$/;

/**
 * λ заявок, 1/с. У варіантах інтенсивність задана лише для заявок ДП; заявка ТП
 * ДІ11 — це сигнал ДІ1 у ТП1, її λ — інтенсивність сигналу в ТП з ЛР3.
 * null — інтенсивність не знайдено.
 */
export function intensities(v: KfsVariant, l3: ReturnType<typeof lab3>): Record<string, number | null> {
  const bySig = new Map(l3.rows.map((r) => [r.name.replace(/\s+/g, ""), r]));
  return Object.fromEntries(
    v.requests.map((q) => {
      if (q.lam != null) return [q.name, q.lam];
      const m = SIG.exec(q.name);
      const sig = m ? bySig.get(`${m[1]}${m[3]}`) : undefined;
      const lam = m && sig?.lam ? sig.lam[`ТП${m[2]}`] : undefined;
      return [q.name, lam ?? null];
    }),
  );
}

// ------------------------------------------------------------------ ЛР5

/** Суміш Гібсон-3 (табл. 1 методички ЛР5) — лише для ознайомлення. */
export const GIBSON3: [string, number][] = [
  ["Завантаження регістру без індексації", 31.0],
  ["Завантаження регістру з індексацією", 18.0],
  ["Перевірка умови та переходу", 17.0],
  ["Порівняння", 4.0],
  ["Зсув на 3 розряди", 4.0],
  ["Логічна операція «ТА»", 2.0],
  ["Команди з мінімальним часом виконання", 5.0],
  ["Складення з фіксованою комою", 6.0],
  ["Множення з фіксованою комою", 0.6],
  ["Ділення з фіксованою комою", 0.2],
  ["Складення з плаваючою комою", 7.0],
  ["Множення з плаваючою комою", 4.0],
  ["Ділення з плаваючою комою", 1.5],
];

export function lab5(v: KfsVariant, l4: ReturnType<typeof lab4>, lam: Record<string, number | null>) {
  const M = v.mkp.length;
  const vnom = l4.t.map((row) => row.map((t) => (t > 0 ? 1 / t : 0))); // млн оп/с
  const rows = l4.reqs.map((q) => {
    // кількість команд кожного виду за ланцюгом (альтернативи — з імовірностями)
    const k = CMD.map((_, c) => q.steps.reduce((s, st) => s + st.terms.reduce((a, [p, f]) => a + p * (v.fpbK[c][f - 1] ?? 0), 0), 0));
    const sum = k.reduce((a, b) => a + b, 0) || 1;
    const p = k.map((x) => x / sum);
    const vcom = Array.from({ length: M }, (_, m) => 1 / CMD.reduce((s, _c, c) => s + p[c] * l4.t[m][c], 0));
    const l = lam[q.name] ?? 0;
    const lt = q.time.map((t) => l * t * 1e-6);
    return { obj: q.obj, name: q.name, k, p, vcom, lam: l, time: q.time, lt };
  });
  const vavg = Array.from({ length: M }, (_, m) => rows.reduce((a, r) => a + r.vcom[m], 0) / Math.max(1, rows.length));
  const sumLam = rows.reduce((a, r) => a + r.lam, 0);
  const sumLt = Array.from({ length: M }, (_, m) => rows.reduce((a, r) => a + r.lt[m], 0));
  const vtr = sumLt.map((x) => (x > 0 ? sumLam / x : 0)); // заявок/с
  return { vnom, rows, vavg, sumLam, sumLt, vtr };
}

// ------------------------------------------------------------------ ЛР6

/** Керуючий вплив кодується 2 байтами (методичка ЛР6). */
export const CTRL_BYTES = 2;

export function lab6(v: KfsVariant, l4: ReturnType<typeof lab4>, lam: Record<string, number | null>) {
  const ctrl: Record<string, number> = {}; // «від→до»
  const msg: Record<string, number> = {};
  const dbReq: Record<string, number> = {};
  const dbObj: Record<string, number> = {};
  const dbArr: Record<string, number> = {}; // «об'єкт→масив»
  const dbDetail: Record<string, Record<string, number>> = {};
  const add = (o: Record<string, number>, key: string, x: number) => (o[key] = (o[key] ?? 0) + x);
  for (const q of l4.reqs) {
    const lz = lam[q.name] ?? 0;
    const give = (q.ctrl ?? "").trim();
    if (give.startsWith("ТАК")) {
      // для ТП вплив іде на той ТП, звідки сигнал; для ДП адресу вказано в дужках
      const dst = /\((ТП\d+)\)/.exec(give)?.[1] ?? q.obj;
      add(ctrl, `${q.obj}→${dst}`, lz * CTRL_BYTES * 8);
    }
    for (const dst of (q.to ?? "").split(",").map((x) => x.trim()).filter(Boolean)) add(msg, `${q.obj}→${dst}`, lz * (q.vol ?? 0) * 8);
    // звертання ФПБ ланцюга до масивів: частка × λ × обсяг (рис. 1 методички ЛР6)
    const arr: Record<string, number> = {};
    for (const st of q.steps)
      for (const [coef, f] of st.terms)
        for (const a of v.db ?? []) {
          const fr = a.frac[f - 1] ?? 0;
          if (fr) add(arr, a.name, coef * fr * lz * a.size);
        }
    dbDetail[q.name] = arr;
    dbReq[q.name] = Object.values(arr).reduce((x, y) => x + y, 0);
    add(dbObj, q.obj, dbReq[q.name]);
    for (const [a, x] of Object.entries(arr)) add(dbArr, `${q.obj}→${a}`, x);
  }
  // узагальнена структура: повідомлення й керуючі впливи між парами, без петель
  const gen: Record<string, number> = {};
  for (const flows of [ctrl, msg])
    for (const [key, x] of Object.entries(flows)) {
      const [a, b] = key.split("→");
      if (a !== b) add(gen, pairKey(a, b), x);
    }
  return { ctrl, msg, dbReq, dbObj, dbArr, dbDetail, gen };
}

// ------------------------------------------------------------------ ЛР7

/** ТО ближче за 10 м — в одній будівлі, їх обслуговує один КОК (методичка ЛР7). */
export const KOK_DIST = 0.01;

function treePath(edges: [string, string][], a: string, b: string): string[] {
  const adj = new Map<string, string[]>();
  for (const [x, y] of edges) {
    adj.set(x, [...(adj.get(x) ?? []), y]);
    adj.set(y, [...(adj.get(y) ?? []), x]);
  }
  const prev = new Map<string, string | null>([[a, null]]);
  const stack = [a];
  while (stack.length) {
    const u = stack.pop()!;
    for (const w of adj.get(u) ?? [])
      if (!prev.has(w)) {
        prev.set(w, u);
        stack.push(w);
      }
  }
  const path: string[] = [];
  for (let u = b; prev.get(u) != null; u = prev.get(u)!) path.push(pairKey(u, prev.get(u)!));
  return path;
}

/** Вершины пути по дереву от a до b. */
function pathNodes(edges: [string, string][], a: string, b: string): string[] {
  const nodes = [b];
  for (const e of treePath(edges, a, b)) {
    const [x, y] = e.split("|");
    nodes.push(nodes[nodes.length - 1] === x ? y : x);
  }
  return nodes.reverse();
}

function component(edges: [string, string][], start: string): Set<string> {
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop()!;
    for (const [x, y] of edges)
      for (const [p, q] of [[x, y], [y, x]])
        if (p === u && !seen.has(q)) {
          seen.add(q);
          stack.push(q);
        }
  }
  return seen;
}

function route(edges: [string, string][], flows: Record<string, number>) {
  const load: Record<string, number> = Object.fromEntries(edges.map((e) => [pairKey(...e), 0]));
  for (const [p, x] of Object.entries(flows)) {
    const [a, b] = p.split("|");
    for (const e of treePath(edges, a, b)) load[e] += x;
  }
  return load;
}

export interface Kok {
  name: string;
  id: string;
  /** ТО у складі КОК. */
  to: string[];
  mkp: KfsVariant["mkp"][number];
  /** МКП за правилом частоти до перевірки завантаження. */
  rule: KfsVariant["mkp"][number];
  reqs: string[];
  rho: Record<string, number>;
  R: number;
  db: number;
}

export function lab7(v: KfsVariant, l1: Lab1, trees: Tree[], l4: ReturnType<typeof lab4>, l6: ReturnType<typeof lab6>, lam: Record<string, number | null>, kokDist = KOK_DIST) {
  // вершини ЛР1 (складні ТО — через «_») групуються в КОК за відстанню
  const left = [...l1.names];
  const groups: string[][] = [];
  while (left.length) {
    const a = left.shift()!;
    const g = [a, ...left.filter((b) => Math.hypot(l1.xy[a][0] - l1.xy[b][0], l1.xy[a][1] - l1.xy[b][1]) <= kokDist + 1e-12)];
    for (const n of g.slice(1)) left.splice(left.indexOf(n), 1);
    groups.push(g);
  }
  const ids = groups.map((g) => g.join("_"));
  const kokOf = (obj: string) => ids.find((id) => id.split("_").includes(obj)) ?? obj;
  const members = (id: string) => groups[ids.indexOf(id)];
  // узагальнені потоки між КОК (потоки всередині КОК відкидаються)
  const flows: Record<string, number> = {};
  for (const [p, x] of Object.entries(l6.gen)) {
    const [a, b] = p.split("|").map(kokOf);
    if (a !== b) flows[pairKey(a, b)] = (flows[pairKey(a, b)] ?? 0) + x;
  }
  // МаксКД: Краскал за спаданням потоку
  const order: [string, string][] = [];
  ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => order.push([a, b])));
  order.sort((p, q) => (flows[pairKey(...q)] ?? 0) - (flows[pairKey(...p)] ?? 0));
  const parent: Record<string, string> = Object.fromEntries(ids.map((n) => [n, n]));
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const maxst: [string, string][] = [];
  const rows: { a: string; b: string; w: number; mark: "МаксКД" | "-" | "" }[] = [];
  for (const [a, b] of order) {
    const w = flows[pairKey(a, b)] ?? 0;
    if (maxst.length === ids.length - 1) {
      rows.push({ a, b, w, mark: "" });
      continue;
    }
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) rows.push({ a, b, w, mark: "-" });
    else {
      parent[ra] = rb;
      maxst.push([a, b]);
      rows.push({ a, b, w, mark: "МаксКД" });
    }
  }
  const loadMax = route(maxst, flows);
  // структура комунікацій — МКДке; ребра всередині КОК відпадають
  const tke = trees.find((t) => t.key === "МКДке")!;
  const mkdke: [string, string][] = tke.edges.map(([a, b]) => [kokOf(a), kokOf(b)] as [string, string]).filter(([a, b]) => a !== b);
  const loadCab = route(mkdke, flows);
  const cableLen = (a: string, b: string) => Math.min(...members(a).flatMap((x) => members(b).map((y) => l1.cableFixed[pairKey(x, y)] ?? Infinity)));
  const sum = (o: Record<string, number>) => Object.values(o).reduce((x, y) => x + y, 0);
  const cmp = {
    maxst: { len: maxst.reduce((s, e) => s + cableLen(...e), 0), flow: sum(loadMax) },
    mkdke: { len: mkdke.reduce((s, e) => s + cableLen(...e), 0), flow: sum(loadCab) },
  };
  // МКП: лише ДП — мінімальна частота, один ТП — середня, ТП з ДП — максимальна; далі за завантаженням:
  // ρ заявки або R КОК понад 0,6 — потужніший, R КОК до 0,1 — слабший (як у прикладі методички, за R КОК)
  const ms = [...v.mkp].sort((a, b) => a.f - b.f);
  const reqT = new Map(l4.reqs.map((q) => [q.name, q]));
  const koks: Kok[] = ids.map((id, i) => {
    const to = id.split("_");
    const tps = to.filter((n) => n.startsWith("ТП"));
    const dps = to.filter((n) => n.startsWith("ДП"));
    const rule = !tps.length ? 0 : tps.length === 1 && !dps.length ? Math.min(1, ms.length - 1) : ms.length - 1;
    const reqs = l4.reqs.filter((q) => to.includes(q.obj)).map((q) => q.name);
    const loadAt = (lv: number) => {
      const mi = v.mkp.indexOf(ms[lv]);
      const rho = Object.fromEntries(reqs.map((z) => [z, (lam[z] ?? 0) * reqT.get(z)!.time[mi] * 1e-6]));
      return { rho, R: sum(rho) };
    };
    const over = (x: { rho: Record<string, number>; R: number }) => Math.max(0, ...Object.values(x.rho)) > 0.6 || x.R > 0.6;
    let lv = rule;
    let cur = loadAt(lv);
    while (over(cur) && lv < ms.length - 1) cur = loadAt(++lv);
    while (cur.R < 0.1 && lv > 0 && !over(loadAt(lv - 1))) cur = loadAt(--lv);
    return { name: `КОК-${i + 1}`, id, to, mkp: ms[lv], rule: ms[rule], reqs, rho: cur.rho, R: cur.R, db: to.reduce((s, n) => s + (l6.dbObj[n] ?? 0), 0) };
  });
  // центральна БД — у КОК з найбільшим потоком до БД; навантаження мережі — потоки решти КОК (рис. 8 ЛР7)
  const totalDb = koks.reduce((s, k) => s + k.db, 0);
  const place = Object.fromEntries(koks.map((k) => [k.name, totalDb - k.db]));
  const central = koks.reduce((m, k) => (place[k.name] < place[m.name] ? k : m), koks[0]);
  const final = mkdke.map(([a, b]) => {
    const rest = mkdke.filter((e) => pairKey(...e) !== pairKey(a, b));
    let side = component(rest, a);
    if (side.has(central.id)) side = component(rest, b);
    return { a, b, work: loadCab[pairKey(a, b)], len: cableLen(a, b), db: koks.filter((k) => side.has(k.id)).reduce((s, k) => s + k.db, 0) };
  });
  return { ids, flows, rows, maxst, loadMax, mkdke, loadCab, cmp, koks, place, central, final, cableLen, pathNodes };
}

// ------------------------------------------------------------------ приклад з методичок

/**
 * Дані прикладів методичок: координати й кабельні відстані — табл. 1 ЛР1;
 * структура ТП і сигнали — приклад ЛР3; МКП, такти й команди ФПБ — табл. 1, 2,
 * 4 ЛР4 (ділення у Ф3 — 1,5 тис., пересилання у Ф6 — 88,7 тис., див. errata);
 * ланцюг — рисунок ЛР4.
 */
export function demoVariant(): KfsVariant {
  const names = ["ТП1", "ТП2", "ДП1", "ДП2", "ДП3", "ДП4"];
  const xy: KfsVariant["xy"] = { ТП1: [2.062, 6.534], ТП2: [4.212, 9.834], ДП1: [2.061, 6.533], ДП2: [0.593, 6.626], ДП3: [4.211, 9.833], ДП4: [3.319, 8.671] };
  const low: [string, string, number][] = [
    ["ТП2", "ТП1", 6.851],
    ["ДП1", "ТП1", 0.001], ["ДП1", "ТП2", 6.851],
    ["ДП2", "ТП1", 1.473], ["ДП2", "ТП2", 6.653], ["ДП2", "ДП1", 1.471],
    ["ДП3", "ТП1", 3.937], ["ДП3", "ТП2", 10.697], ["ДП3", "ДП1", 3.938], ["ДП3", "ДП2", 4.835],
    ["ДП4", "ТП1", 2.479], ["ДП4", "ТП2", 9.284], ["ДП4", "ДП1", 2.48], ["ДП4", "ДП2", 3.407], ["ДП4", "ДП3", 1.465],
  ];
  const cable = Object.fromEntries(low.map(([a, b, d]) => [pairKey(a, b), d]));
  const sections = ["Д1", "Д2", "Д3", "Д4"];
  const sig = (kind: string, func: string, name: string, vals: ([number, number] | [null, number] | null)[]): KfsSignal => ({
    kind,
    func,
    name,
    per: Object.fromEntries(sections.map((d, i) => [d, (vals[i] ?? [null, null]) as [number | null, number | null]])),
  });
  const signals = [
    sig("Вхідні", "Дискретні", "ДИ1", [[2.42, 95], [3.17, 47], null, [3.39, 99]]),
    sig("Вхідні", "Дискретні", "ДИ2", [[3.6, 59], [0.36, 37], null, [4.01, 55]]),
    sig("Вхідні", "Дискретні", "ДИ3", [[2.17, 72], [4.6, 89], null, [2.52, 99]]),
    sig("Вхідні", "Дискретні", "ДИ4", [[4.1, 33], [1.24, 79], null, [3.06, 93]]),
    sig("Вхідні", "Дискретні", "ДИ5", [[1.75, 83], [0.16, 64], null, [0.66, 97]]),
    sig("Вхідні", "Чисельно-імпульсні", "I1", [[0.92, 42], [4.88, 91], [1.48, 73], null]),
    sig("Вхідні", "Чисельно-імпульсні", "I2", [[3.88, 71], [0.06, 92], [2.96, 95], null]),
    sig("Вхідні", "Аналогові", "АИ1", [[1.71, 83], null, null, null]),
    sig("Вихідні", "Дискретні", "ДО1", [[null, 11], [null, 73], null, [null, 35]]),
    sig("Вихідні", "Дискретні", "ДО2", [[null, 24], [null, 11], null, [null, 96]]),
    sig("Вихідні", "Дискретні потужні", "ДП1", [null, null, null, null]),
    sig("Вихідні", "Дискретні потужні", "ДП2", [null, null, null, null]),
    sig("Вихідні", "Аналогові", "АО1", [[null, 46], null, null, null]),
  ];
  const k = (xs: number[]) => xs.map((x) => Math.round(x * 1000));
  return {
    source: "Приклад з методичок ЛР1, ЛР3, ЛР4",
    names,
    xy,
    cable,
    sections,
    struct: { ТП1: { Д1: 2, Д2: 3, Д4: 2 }, ТП2: { Д1: 1, Д2: 1, Д3: 2, Д4: 1 } },
    structCells: {
      // розкладка — як у таблиці «Структура технологічних процесів» прикладу ЛР3
      ТП1: [[0, 0, "Д2"], [0, 2, "Д2"], [1, 0, "Д4"], [1, 1, "Д2"], [1, 3, "Д4"], [2, 0, "Д1"], [2, 2, "Д1"]],
      ТП2: [[0, 1, "Д1"], [1, 0, "Д4"], [1, 2, "Д2"], [1, 3, "Д3"], [2, 1, "Д3"]],
    },
    signals,
    fpbK: [
      k([37.6, 32.5, 57.4, 31.2, 52.1, 20.4, 49.8, 35.7, 23.5, 41.4]),
      k([7.9, 12.1, 11.4, 11.7, 12.6, 14.1, 9.6, 7.4, 7.9, 14.3]),
      k([4.1, 2.3, 1.5, 2.5, 4.6, 4.5, 1.3, 1.5, 2.1, 2.4]),
      k([49.8, 49.3, 78.0, 82.3, 82.6, 88.7, 58.8, 55.5, 78.5, 67.4]),
    ],
    mkp: [
      { n: 1, name: "Celeron", f: 400 },
      { n: 2, name: "Pentium", f: 1400 },
      { n: 3, name: "Pentium 4-M", f: 2400 },
    ],
    requests: [
      {
        obj: "приклад",
        name: "заявка з рисунка ЛР4",
        rows: [
          ["Г(Ф7;--)", "Г(Ф9;--)", "Г(Ф2;--)", "Г(Ф10;--)", "Г(Ф7;--)", "Г1(Ф5;52%)", "Г(Ф4;--)", "Г(Ф8;--)", "Г(Ф3;--)", "Г(Ф8;--)"],
          [null, null, null, null, null, "Г2(Ф2;48%)", null, null, null, null],
        ],
      },
    ],
  };
}

/** Число з комою. */
export const fmt = (x: number, d = 3) => x.toFixed(d).replace(".", ",");
/** Частка з файлу як записана (0,007, а не 0,006999…): шість значущих цифр, з комою. */
export const share = (x: number) => String(Number(x.toPrecision(6))).replace(".", ",");
