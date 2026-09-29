/**
 * «Архітектура комп'ютерів», практичні роботи 1–6: мікропрограми JOLS-M під
 * варіант (табл. 2.1, 3.1, 4.3, 5.1, 6.1 методички) і еталонні розрахунки.
 *
 * Програми — на діалекті IDE yal.cc (var/read/print/if … then/goto/end,
 * мітки «ім'я:»), тим самим, яким здавалися роботи; інтерпретатор сайту
 * звірено з IDE построково. Операнди вводяться командою read: знакові — у
 * прямому коді двійково (#…), беззнакові — десятково.
 */

import { run } from "./jolsm";

const bitsFor = (x: number) => Math.max(1, Math.ceil(Math.log2(x + 1)));
const bin = (x: number, w: number) => (x >>> 0).toString(2).padStart(w, "0").slice(-w);

export type Code = "ЗК" | "ДК";

// ─────────────────────────────────────────────────────────── таблиці варіантів

/** Табл. 2.1: розрядність 4…16, непарні — ЗК, парні — ДК. */
export const lab2Variant = (v: number) => ({ n: 4 + Math.floor((v - 1) / 2), code: (v % 2 ? "ЗК" : "ДК") as Code });

/** Табл. 3.1: розрядність 4…10, спосіб 1…4 по колу. */
export const lab3Variant = (v: number) => ({ n: 4 + Math.floor((v - 1) / 4), method: ((v - 1) % 4) + 1 });

/** Табл. 4.3 (варіанти 25, 26 випадають із закономірності). */
export const lab4Variant = (v: number) =>
  v === 25 ? { n: 16, method: 2 } : v === 26 ? { n: 16, method: 1 } : { n: 4 + 2 * Math.floor((v - 1) / 4), method: 4 - ((v - 1) % 4) };

/** Табл. 5.1: спосіб ділення, відновлення залишку, розрядність. */
const T51: [0 | 1, boolean, number][] = [
  [0, true, 6], [0, false, 6], [1, true, 6], [1, false, 6], [0, true, 7], [0, false, 7], [1, true, 7], [1, false, 7],
  [0, true, 8], [0, false, 8], [1, true, 8], [1, false, 8], [0, true, 9], [0, false, 9], [1, true, 9], [1, false, 9],
  [1, false, 5], [1, true, 5], [0, false, 5], [0, true, 5], [1, false, 10], [1, true, 10], [0, false, 10], [0, true, 10],
  [1, false, 11], [0, true, 11],
];
export const lab5Variant = (v: number) => {
  const [shift, restore, n] = T51[v - 1];
  return { n, restore, shift: shift ? ("дільника" as const) : ("залишку" as const) };
};

/** Табл. 6.1: розрядність мантиси, порядку й код. */
export const lab6Variant = (v: number) => {
  if (v === 23) return { m: 15, p: 7, code: "ЗК" as Code };
  if (v === 24) return { m: 16, p: 5, code: "ДК" as Code };
  if (v === 25) return { m: 17, p: 6, code: "ЗК" as Code };
  return { m: 10 + ((v - 1) % 11), p: 5 + ((v - 1) % 4), code: (v % 2 ? "ЗК" : "ДК") as Code };
};

// ──────────────────────────────────────────────────────────────── виконання

/** Десяткові значення з рядка друку «…(0101 5 5) …» — останнє число в кожних дужках. */
export function printedValues(line: string): number[] {
  return [...line.matchAll(/\(([01]+) [0-9A-F]+ (\d+)\)/g)].map((m) => Number(m[2]));
}
export function printedBits(line: string): string[] {
  return [...line.matchAll(/\(([01]+) [0-9A-F]+ \d+\)/g)].map((m) => m[1]);
}

export function execute(code: string, inputs: (string | number)[]) {
  const r = run(code, inputs, 500000);
  return { output: r.output, errors: r.errors };
}

// ─────────────────────────────────────────────────────────────────── ЛР 1

export const LAB1_PROGRAM = `% ПР 1. Демонстрація мікрокоманд і операцій JOLS-M
% Структура: регістри r1, r2 (16), r3, r4 (16), лічильник k (4), пам'ять m (8 комірок по 16)
var r1(16), r2(16), r3(16), r4(16), k(4), m(8)(16)
print "Введення: r1, r2, m(0), m(1), k (кількість зсувів):"
read r1, r2, m(0), m(1), k
print r1
print r2
print m(0)
print m(1)
print k
% передача регістр -> комірка і комірка -> регістр
m(2)=r1
print m(2)
r3=m(1)
print r3
% І, АБО, сума за модулем 2: два регістри
r3=r1
r3&r2
print "r1 & r2:", r3
r3=r1
r3|r2
print "r1 | r2:", r3
r3=r1
r3^r2
print "r1 ^ r2:", r3
% ... регістр і комірка пам'яті
r3=r1
r3&m(0)
print "r1 & m(0):", r3
r3=r1
r3|m(0)
print "r1 | m(0):", r3
r3=r1
r3^m(0)
print "r1 ^ m(0):", r3
% логічний і циклічний зсув на 1 і 4 розряди
r3=r1
r3<<1
print "r1 << 1:", r3
r3=r1
r3<<4
print "r1 << 4:", r3
r3=r1
r3>>1
print "r1 >> 1:", r3
r3=r1
r3>>4
print "r1 >> 4:", r3
r3=r1
r3|<1
print "r1 |< 1:", r3
r3=r1
r3|<4
print "r1 |< 4:", r3
r3=r1
r3>|1
print "r1 >| 1:", r3
r3=r1
r3>|4
print "r1 >| 4:", r3
% логічний зсув на кількість розрядів з регістра k
r3=r1
r3<<k
print "r1 << k:", r3
r3=r1
r3>>k
print "r1 >> k:", r3
% зсув частини розрядів (молодша половина r4, старша не змінюється)
r4=r1
r4(7:0)<<1
print "r1(7:0) << 1:", r4
r4=r1
r4(7:0)<<4
print "r1(7:0) << 4:", r4
r4=r1
r4(7:0)>>1
print "r1(7:0) >> 1:", r4
r4=r1
r4(7:0)>>4
print "r1(7:0) >> 4:", r4
% передача з перекосом: на 2 розряди вліво і на 3 вправо (без мікрооперації зсуву)
r4=0
r4(15:2)=r1(13:0)
print "перекіс вліво на 2:", r4
r4=0
r4(12:0)=r1(15:3)
print "перекіс вправо на 3:", r4
end`;

/** Вхідні дані ЛР 1: видно різницю логічного й циклічного зсуву, І/АБО/XOR на різних бітах. */
export const LAB1_INPUTS = ["#1011001110001101", "#0000111111110000", "#1111000000001111", "1234", "3"];

// ─────────────────────────────────────────────────────────────────── ЛР 2

/** Прямий код n-розрядного числа (старший біт — знак) для команди read. */
export const toPk = (x: number, n: number) => "#" + (x < 0 ? "1" : "0") + bin(Math.abs(x), n - 1);
export const fromPk = (bits: string) => (bits[0] === "1" ? -1 : 1) * parseInt(bits.slice(1) || "0", 2);

export function lab2Program(v: number): string {
  const { n, code } = lab2Variant(v);
  const w = n + 1;
  const neg = (r: string) =>
    code === "ЗК"
      ? [`if ${r}(${n - 1})=1 then ${r}(${n - 2}:0)~`]
      : [`if ${r}(${n - 1})=1 then ${r}(${n - 2}:0)~`, `if ${r}(${n - 1})=1 then ${r}+1`];
  return [
    `% ПР 2, варіант ${v}: додавання ${n}-розрядних чисел з фіксованою комою, ${code === "ЗК" ? "зворотний" : "додатковий"} код`,
    `% Рг1, Рг2 — операнди в прямому коді (біт ${n - 1} — знак), біт ${n} — другий знаковий`,
    `% розряд модифікованого коду; См — накопичувальний суматор; РгР — результат`,
    `var rg1(${w}), rg2(${w}), sm(${w}), rgr(${n})`,
    `print "Рг1, Рг2 у прямому коді:"`,
    `read rg1(${n - 1}:0), rg2(${n - 1}:0)`,
    `print rg1(${n - 1}:0)`,
    `print rg2(${n - 1}:0)`,
    `% модифікований код: знак у двох розрядах`,
    `rg1(${n})=rg1(${n - 1})`,
    `rg2(${n})=rg2(${n - 1})`,
    `% від'ємні числа — у ${code}${code === "ЗК" ? " (інверсія значущих розрядів)" : " (інверсія значущих розрядів і +1)"}`,
    ...neg("rg1"),
    ...neg("rg2"),
    `print "Рг1, Рг2 у модифікованому ${code}:"`,
    `print rg1`,
    `print rg2`,
    `sm=rg1`,
    code === "ЗК" ? `sm+!rg2` : `sm+rg2`,
    `print "См = Рг1 + Рг2${code === "ЗК" ? " (з циклічним перенесенням)" : ""}:"`,
    `print sm`,
    `% знакові розряди різні — переповнення`,
    `if sm(${n})<>sm(${n - 1}) then goto ovf`,
    `% результат — назад у прямий код`,
    ...(code === "ЗК" ? [`if sm(${n})=1 then sm(${n - 2}:0)~`] : [`if sm(${n})=1 then sm-1`, `if sm(${n})=1 then sm(${n - 2}:0)~`]),
    `rgr=sm(${n - 1}:0)`,
    `print "РгР у прямому коді:"`,
    `print rgr`,
    `end`,
    `ovf: print "Переповнення: знакові розряди суматора різні"`,
    `end`,
  ].join("\n");
}

/** Три пари операндів за вимогою методички: додатний і від'ємний результати та переповнення. */
export function lab2Cases(v: number): { a: number; b: number; title: string }[] {
  const { n } = lab2Variant(v);
  const M = 2 ** (n - 1) - 1;
  const r = (k: number) => Math.max(1, Math.round(k * M));
  return [
    { a: r(0.6), b: -r(0.25), title: "різні знаки, додатний результат" },
    { a: r(0.25), b: -r(0.6), title: "різні знаки, від'ємний результат" },
    { a: r(0.75), b: r(0.5), title: "переповнення" },
  ];
}

// ─────────────────────────────────────────────────────────────────── ЛР 3

export const METHOD3 = [
  "",
  "з молодших розрядів множника, зсув суми часткових добутків",
  "з молодших розрядів множника, зсув множеного",
  "зі старших розрядів множника, зсув суми часткових добутків",
  "зі старших розрядів множника, зсув множеного",
];

export function lab3Program(v: number): string {
  const { n, method } = lab3Variant(v);
  const k = bitsFor(n);
  const head = [`% ПР 3, варіант ${v}: множення ${n}-розрядних чисел, спосіб ${method} —`, `% ${METHOD3[method]}`];
  const tail = (sch: string) => [`if lct<>0 then goto t`, `print "Добуток:"`, `print ${sch}`, `end`];
  const tact = (sch: string) => `print "Рг1 (множник), СЧД:", rg1, ${sch}`;
  if (method === 1)
    return [
      ...head,
      `% Рг1 — множник, Рг2 — множене, СЧД — ${2 * n} розрядів + 1 додатковий для суматора`,
      `var rg1(${n}), rg2(${n}), sch(${2 * n + 1}), lct(${k})`,
      `print "Множене Рг2, множник Рг1:"`,
      `read rg2, rg1`,
      `lct=${n}`,
      `% аналіз молодшого розряду множника; множене — до старшої частини СЧД`,
      `t: if rg1(0)=1 then sch(${2 * n}:${n})+rg2`,
      `sch>>1`,
      `rg1>>1`,
      `lct-1`,
      tact("sch"),
      ...tail(`sch(${2 * n - 1}:0)`),
    ].join("\n");
  if (method === 2)
    return [
      ...head,
      `% Рг1 — множник, Рг2 — множене в ${2 * n}-розрядному регістрі з молодших розрядів;`,
      `% СЧД — ${2 * n} розрядів + 1 додатковий (рис. 3.3)`,
      `var rg1(${n}), rg2(${2 * n}), sch(${2 * n + 1}), lct(${k})`,
      `print "Множене Рг2, множник Рг1:"`,
      `read rg2(${n - 1}:0), rg1`,
      `lct=${n}`,
      `t: if rg1(0)=1 then sch+rg2`,
      `rg2<<1`,
      `rg1>>1`,
      `lct-1`,
      `print "Рг1 (множник), Рг2 (множене), СЧД:", rg1, rg2, sch`,
      ...tail(`sch(${2 * n - 1}:0)`),
    ].join("\n");
  if (method === 3)
    return [
      ...head,
      `% Рг1 — множник, Рг2 — множене, додається до молодшої частини СЧД; останній зсув не виконується;`,
      `% СЧД — ${2 * n} розрядів + 1 додатковий (рис. 3.5)`,
      `var rg1(${n}), rg2(${n}), sch(${2 * n + 1}), lct(${k})`,
      `print "Множене Рг2, множник Рг1:"`,
      `read rg2, rg1`,
      `lct=${n}`,
      `t: if rg1(${n - 1})=1 then sch+rg2`,
      `lct-1`,
      `if lct=0 then goto e`,
      `sch<<1`,
      `rg1<<1`,
      tact("sch"),
      `goto t`,
      `e: rg1<<1`,
      tact("sch"),
      `print "Добуток:"`,
      `print sch(${2 * n - 1}:0)`,
      `end`,
    ].join("\n");
  return [
    ...head,
    `% Рг2 — множене в ${2 * n}-розрядному регістрі зі старших розрядів; спершу зсув, потім додавання;`,
    `% СЧД — ${2 * n} розрядів + 1 додатковий для суматора`,
    `var rg1(${n}), rg2(${2 * n}), sch(${2 * n + 1}), lct(${k})`,
    `print "Множене Рг2, множник Рг1:"`,
    `read rg2(${2 * n - 1}:${n}), rg1`,
    `lct=${n}`,
    `t: rg2>>1`,
    `if rg1(${n - 1})=1 then sch+rg2`,
    `rg1<<1`,
    `lct-1`,
    `print "Рг1 (множник), Рг2 (множене), СЧД:", rg1, rg2, sch`,
    ...tail(`sch(${2 * n - 1}:0)`),
  ].join("\n");
}

/** Приклад під розрядність: множене й множник з помітною структурою бітів. */
export function lab3Operands(n: number): [number, number] {
  const max = 2 ** n - 1;
  return [Math.round(max * 0.81) | 1, Math.round(max * 0.36) | 1];
}

// ─────────────────────────────────────────────────────────────────── ЛР 4

/**
 * Множення з аналізом двох розрядів. Для молодших розрядів (способи 1, 2) —
 * табл. 4.1: пара розрядів і ознака корекції дають v = пара + c (0…4):
 * 0 → 0, 1 → A, 2 → 2A, 3 → −A (c = 1), 4 → 0 (c = 1). Для старших (3, 4) —
 * табл. 4.2: пара й наступний розряд дають −2·b₁ + b₀ + наступний.
 */
export function lab4Program(v: number): string {
  const { n, method } = lab4Variant(v);
  const T = n / 2;
  const k = bitsFor(T + 1);
  const head = [`% ПР 4, варіант ${v}: множення ${n}-розрядних чисел з аналізом двох розрядів, спосіб ${method} —`, `% ${METHOD3[method]}`];
  if (method === 1 || method === 2) {
    const W = method === 1 ? 2 * n + 3 : 2 * n + 2;
    const add = (x: string) =>
      method === 1
        ? { A: `sch(${W - 1}:${n})+rg2`, A2: [`sch(${W - 1}:${n})+rg2`, `sch(${W - 1}:${n})+rg2`], M: `sch(${W - 1}:${n})-rg2` }[x]
        : { A: `sch+rg2`, A2: [`sch+rg2`, `sch+rg2`], M: `sch-rg2` }[x];
    const lines = [
      ...head,
      method === 1
        ? `% СЧД — ${2 * n} розрядів + 3 додаткові (знак часткових сум і зсув); зсув СЧД праворуч арифметичний`
        : `% Рг2 — множене в ${W}-розрядному регістрі з молодших розрядів, зсувається ліворуч на 2`,
      `% c — ознака корекції (табл. 4.1), q — поточна пара розрядів разом з c`,
      `var rg1(${n}), rg2(${method === 1 ? n : W}), sch(${W}), c(1), q(3), s(1), lct(${k})`,
      `print "Множене Рг2, множник Рг1:"`,
      method === 1 ? `read rg2, rg1` : `read rg2(${n - 1}:0), rg1`,
      `lct=${T}`,
      `t: q=rg1(1:0)`,
      `q+c`,
      `c=0`,
      `if q=1 then ${add("A")}`,
      ...(add("A2") as string[]).map((x) => `if q=2 then ${x}`),
      `if q=3 then ${add("M")}`,
      `if q>=3 then c=1`,
      ...(method === 1
        ? [`s=sch(${W - 1})`, `sch>>2`, `if s=1 then sch(${W - 1}:${W - 2})=#11`]
        : [`rg2<<2`]),
      `rg1>>2`,
      `lct-1`,
      `print "пара+c, c, СЧД:", q, c, sch`,
      `if lct<>0 then goto t`,
      `% корекція після останнього такту — ще одне додавання множеного`,
      `if c=1 then ${method === 1 ? `sch(${W - 1}:${n})+rg2` : `sch+rg2`}`,
      `if c=1 then print "додатковий такт, СЧД:", sch`,
      `print "Добуток:"`,
      `print sch(${2 * n - 1}:0)`,
      `end`,
    ];
    return lines.join("\n");
  }
  // старші розряди: Booth по табл. 4.2, фіктивна старша пара «00»
  const W = 2 * n + 3;
  const mulReg = method === 3 ? "rg2" : "md";
  const act = (code: string, what: string) => `if q=${code} then ${what}`;
  const plus = `sch+${mulReg}`;
  const minus = `sch-${mulReg}`;
  const lines = [
    ...head,
    `% mr — множник з двома нулями зверху (фіктивна пара «00») і нулем знизу;`,
    `% q — пара розрядів і наступний розряд (табл. 4.2); СЧД — ${2 * n} розрядів + 3 додаткові`,
    method === 3
      ? `var rg1(${n}), rg2(${n}), mr(${n + 3}), sch(${W}), q(3), lct(${k})`
      : `var rg1(${n}), rg2(${n}), md(${W}), mr(${n + 3}), sch(${W}), q(3), lct(${k})`,
    `print "Множене Рг2, множник Рг1:"`,
    `read rg2, rg1`,
    `mr(${n}:1)=rg1`,
    ...(method === 4 ? [`% множене зі старших розрядів: у першому такті не зсувається`, `md(${2 * n}:${n})=rg2`] : []),
    `lct=${T + 1}`,
    `t: q=mr(${n + 2}:${n})`,
    ...(method === 3 ? [`sch<<2`] : []),
    act("#001", plus),
    act("#010", plus),
    act("#011", plus),
    act("#011", plus),
    act("#100", minus),
    act("#100", minus),
    act("#101", minus),
    act("#110", minus),
    `mr<<2`,
    `lct-1`,
    `print "пара і наступний розряд, СЧД:", q, sch`,
    `if lct=0 then goto e`,
    ...(method === 4 ? [`md>>2`] : []),
    `goto t`,
    `e: print "Добуток:"`,
    `print sch(${2 * n - 1}:0)`,
    `end`,
  ];
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────── ЛР 5

export function lab5Program(v: number): string {
  const { n, restore, shift } = lab5Variant(v);
  const k = bitsFor(n);
  const head = [
    `% ПР 5, варіант ${v}: ділення ${n}-розрядних чисел з фіксованою комою,`,
    `% зсув ${shift}, ${restore ? "з відновленням" : "без відновлення"} залишку`,
  ];
  if (shift === "залишку") {
    const W = n + 2;
    const body = restore
      ? [`t: sm<<1`, `sm+rgd`, `rg1<<1`, `if sm(${W - 1})=0 then rg1(0)=1`, `if sm(${W - 1})=1 then sm+rg2`]
      : [`t: sm<<1`, `if sm(${W - 1})=1 then goto p`, `sm+rgd`, `goto q`, `p: sm+rg2`, `q: rg1<<1`, `if sm(${W - 1})=0 then rg1(0)=1`];
    return [
      ...head,
      `% См — залишок (${n} розрядів + 2 знакові, модифікований ДК), Рг2 — дільник, rgd — -Рг2 у ДК,`,
      `% Рг1 — частка: розряд ${n} — «зн» (ціла частина, 0), ${n - 1}…0 — розряди після коми`,
      `var rg1(${n + 1}), rg2(${W}), rgd(${W}), sm(${W}), lct(${k})`,
      `print "Ділене См, дільник Рг2:"`,
      `read sm(${n - 1}:0), rg2(${n - 1}:0)`,
      `rgd=rg2`,
      `rgd~`,
      `rgd+1`,
      `% пробний такт: додатний залишок — ділене не менше дільника, переповнення`,
      `sm+rgd`,
      `print "пробний такт, См:", sm`,
      `if sm(${W - 1})=0 then goto err`,
      ...(restore ? [`sm+rg2`] : []),
      `lct=${n}`,
      ...body,
      `lct-1`,
      `print "Рг1 (частка), См (залишок):", rg1, sm`,
      `if lct<>0 then goto t`,
      `print "Частка 0,"`,
      `print rg1`,
      `end`,
      `err: print "Переповнення: ділене не менше дільника"`,
      `end`,
    ].join("\n");
  }
  const W = 2 * n + 2;
  const neg = [`rgd=rg2`, `rgd~`, `rgd+1`];
  const body = restore
    ? [`t: rg2>>1`, ...neg, `sm+rgd`, `rg1<<1`, `if sm(${W - 1})=0 then rg1(0)=1`, `if sm(${W - 1})=1 then sm+rg2`]
    : [`t: rg2>>1`, `if sm(${W - 1})=1 then goto p`, ...neg, `sm+rgd`, `goto q`, `p: sm+rg2`, `q: rg1<<1`, `if sm(${W - 1})=0 then rg1(0)=1`];
  return [
    ...head,
    `% См — залишок (${2 * n} розрядів + 2 знакові), Рг2 — дільник, зсувається праворуч,`,
    `% rgd — -Рг2 у ДК, Рг1 — частка: розряд ${n} — «зн» (ціла частина, 0), ${n - 1}…0 — після коми`,
    `var rg1(${n + 1}), rg2(${W}), rgd(${W}), sm(${W}), lct(${k})`,
    `print "Ділене См, дільник Рг2:"`,
    `read sm(${2 * n - 1}:${n}), rg2(${2 * n - 1}:${n})`,
    ...neg,
    `% пробний такт: додатний залишок — переповнення`,
    `sm+rgd`,
    `print "пробний такт, См:", sm`,
    `if sm(${W - 1})=0 then goto err`,
    ...(restore ? [`sm+rg2`] : []),
    `lct=${n}`,
    ...body,
    `lct-1`,
    `print "Рг1 (частка), См (залишок), Рг2 (дільник):", rg1, sm, rg2`,
    `if lct<>0 then goto t`,
    `print "Частка 0,"`,
    `print rg1`,
    `end`,
    `err: print "Переповнення: ділене не менше дільника"`,
    `end`,
  ].join("\n");
}

/** Частка ⌊x·2ⁿ/b⌋ — n розрядів після коми (x < b). */
export const quotient = (x: number, b: number, n: number) => Math.floor((x * 2 ** n) / b);

export function lab5Operands(n: number): [number, number] {
  const max = 2 ** n - 1;
  return [Math.round(max * 0.55), Math.round(max * 0.8)];
}

// ─────────────────────────────────────────────────────────────────── ЛР 6

/**
 * Додавання чисел з плаваючою комою за рис. 6.2. Мантиса — m розрядів
 * (знак + m−1 розрядів дробу), порядок — n розрядів (знак + n−1). Операнди
 * вводяться в прямому коді. Різниця порядків, додавання мантис і зміна
 * порядку при нормалізації виконуються в модифікованому ЗК/ДК; вирівнювання
 * й нормалізація — зсувами модуля мантиси з друком після кожного такту.
 *
 * СмМ (smm): біт m — знак, m−1 — розряд переповнення П, m−2…0 — модуль.
 */
export function lab6Program(v: number): string {
  const { m, p: n, code } = lab6Variant(v);
  const W = m + 1; // СмМ, РгМ
  const V = n + 1; // СмП, РгП — модифікований код порядку
  const add = code === "ЗК" ? "+!" : "+";
  const one = `#${"0".repeat(V - 1)}1`;
  const mone = code === "ЗК" ? `#${"1".repeat(V - 1)}0` : `#${"1".repeat(V)}`;
  // ПК → модифікований код регістра r ширини w (знак у бітах w-1, w-2)
  const toCode = (r: string, w: number) => [
    `${r}(${w - 2})=${r}(${w - 1})`,
    `if ${r}(${w - 1})=1 then ${r}(${w - 3}:0)~`,
    ...(code === "ДК" ? [`if ${r}(${w - 1})=1 then ${r}+1`] : []),
  ];
  // модифікований код → ПК з розрядом переповнення (модуль у w-2…0)
  const toPk = (r: string, w: number) => [
    `if ${r}(${w - 1})=1 then ${r}(${w - 2}:0)~`,
    ...(code === "ДК" ? [`if ${r}(${w - 1})=1 then ${r}(${w - 2}:0)+1`] : []),
  ];
  return [
    `% ПР 6, варіант ${v}: додавання чисел з плаваючою комою, мантиса ${m}, порядок ${n} розрядів, ${code}`,
    `% ma, pa, mb, pb — операнди в прямому коді; СмМ/РгМ — мантиси (знак, П, модуль),`,
    `% СмП/РгП — порядки в модифікованому ${code}, Рг1 — порядок першого операнда, T — знак різниці`,
    `var ma(${m}), pa(${n}), mb(${m}), pb(${n}), smm(${W}), rgm(${W}), smp(${V}), rgp(${V}), rg1(${n}), t(1), cnt(${n}), rm(${m}), rp(${n})`,
    `print "Мантиса й порядок A, мантиса й порядок B (прямий код):"`,
    `read ma, pa, mb, pb`,
    `smm(${m - 2}:0)=ma(${m - 2}:0)`,
    `smm(${m})=ma(${m - 1})`,
    `rgm(${m - 2}:0)=mb(${m - 2}:0)`,
    `rgm(${m})=mb(${m - 1})`,
    `rg1=pa`,
    `% 1. Вирівнювання порядків: СмП := PA − PB`,
    `smp(${n - 2}:0)=pa(${n - 2}:0)`,
    `smp(${n})=pa(${n - 1})`,
    ...toCode("smp", V),
    `% −PB: знак порядку B інвертується`,
    `rgp(${n - 2}:0)=pb(${n - 2}:0)`,
    `rgp(${n})=pb(${n - 1})`,
    `rgp(${n})~`,
    ...toCode("rgp", V),
    `smp${add}rgp`,
    `t=smp(${V - 1})`,
    `print "PA − PB (${code}), T:", smp, t`,
    `% модуль різниці — кількість тактів вирівнювання`,
    `if smp(${V - 1})=1 then smp(${V - 2}:0)~`,
    ...(code === "ДК" ? [`if smp(${V - 1})=1 then smp(${V - 2}:0)+1`] : []),
    `cnt=smp(${V - 2}:0)`,
    `if cnt>=${m} then goto big`,
    `if cnt=0 then goto order`,
    `if t=1 then goto a`,
    `b: rgm(${m - 2}:0)>>1`,
    `cnt-1`,
    `print "вирівнювання: мантиса B, лишилось тактів:", rgm, cnt`,
    `if cnt<>0 then goto b`,
    `goto order`,
    `a: smm(${m - 2}:0)>>1`,
    `cnt-1`,
    `print "вирівнювання: мантиса A, лишилось тактів:", smm, cnt`,
    `if cnt<>0 then goto a`,
    `% порядок суми — більший з порядків`,
    `order: smp=0`,
    `if t=0 then smp(${n - 2}:0)=pa(${n - 2}:0)`,
    `if t=0 then smp(${n})=pa(${n - 1})`,
    `if t=1 then smp(${n - 2}:0)=pb(${n - 2}:0)`,
    `if t=1 then smp(${n})=pb(${n - 1})`,
    ...toCode("smp", V),
    `% 2. Додавання мантис`,
    ...toCode("smm", W),
    ...toCode("rgm", W),
    `smm${add}rgm`,
    `print "сума мантис (${code}):", smm`,
    ...toPk("smm", W),
    `% 3. Нормалізація: переповнення — зсув праворуч і порядок + 1`,
    `if smm(${m - 1})=0 then goto nz`,
    `smm(${m - 1}:0)>>1`,
    `smp${add}${one}`,
    `print "переповнення мантиси: мантиса, порядок:", smm, smp`,
    `if smp(${V - 1})<>smp(${V - 2}) then goto ovf`,
    `nz: if smm(${m - 2}:0)=0 then goto zero`,
    `norm: if smm(${m - 2})=1 then goto fin`,
    `smm(${m - 2}:0)<<1`,
    `smp${add}${mone}`,
    `print "нормалізація: мантиса, порядок:", smm, smp`,
    `if smp(${V - 1})<>smp(${V - 2}) then goto zero`,
    ...(code === "ДК" ? [`% −2^${n - 1} у ДК є, а в прямому коді — ні: теж зникнення порядку`, `if smp=#11${"0".repeat(V - 2)} then goto zero`] : []),
    `goto norm`,
    `% результат без додавання: порядки різняться не менше ніж на ${m}`,
    `big: print "різниця порядків >= ${m}: результат — операнд з більшим порядком"`,
    `if t=0 then rm=ma`,
    `if t=0 then rp=pa`,
    `if t=1 then rm=mb`,
    `if t=1 then rp=pb`,
    `goto out`,
    `% порядок — у прямий код`,
    `fin: ${code === "ДК" ? `if smp(${V - 1})=1 then smp-1` : `if smp(${V - 1})=1 then smp(${V - 3}:0)~`}`,
    ...(code === "ДК" ? [`if smp(${V - 1})=1 then smp(${V - 3}:0)~`] : []),
    `rm(${m - 2}:0)=smm(${m - 2}:0)`,
    `rm(${m - 1})=smm(${m})`,
    `rp=smp(${n - 1}:0)`,
    `out: print "Результат: мантиса, порядок (прямий код):"`,
    `print rm`,
    `print rp`,
    `end`,
    `zero: print "Результат — нуль (мантиса нульова або зникнення порядку)"`,
    `end`,
    `ovf: print "Переповнення порядку"`,
    `end`,
  ].join("\n");
}

export interface Fp {
  s: 0 | 1;
  mag: number; // модуль мантиси, m−1 розрядів дробу
  p: number; // порядок зі знаком
}

export type FpResult = { kind: "num"; value: Fp } | { kind: "zero" } | { kind: "ovf" };

/** Еталон рис. 6.2 з тим самим відкиданням розрядів при зсувах праворуч. */
export function fpAdd(a: Fp, b: Fp, m: number, n: number): FpResult {
  const pmax = 2 ** (n - 1) - 1;
  const d = a.p - b.p;
  if (Math.abs(d) >= m) return { kind: "num", value: d >= 0 ? a : b };
  let ma = a.mag;
  let mb = b.mag;
  let p = d >= 0 ? a.p : b.p;
  if (d > 0) mb = Math.floor(mb / 2 ** d);
  if (d < 0) ma = Math.floor(ma / 2 ** -d);
  const sum = (a.s ? -ma : ma) + (b.s ? -mb : mb);
  const s: 0 | 1 = sum < 0 ? 1 : 0;
  let mag = Math.abs(sum);
  if (mag >= 2 ** (m - 1)) {
    mag = Math.floor(mag / 2);
    p += 1;
    if (p > pmax) return { kind: "ovf" };
  }
  if (mag === 0) return { kind: "zero" };
  while (mag < 2 ** (m - 2)) {
    mag *= 2;
    p -= 1;
    if (p < -pmax) return { kind: "zero" };
  }
  return { kind: "num", value: { s, mag, p } };
}

export const fpInput = (x: Fp, m: number, n: number) => [
  "#" + x.s + bin(x.mag, m - 1),
  "#" + (x.p < 0 ? "1" : "0") + bin(Math.abs(x.p), n - 1),
];

/** Чотири приклади методички: знаки мантис і порядків, |A| і |B|, PA ≠ PB. */
export function lab6Cases(v: number): { a: Fp; b: Fp; title: string }[] {
  const { m } = lab6Variant(v);
  const f = (x: number) => Math.round(x * 2 ** (m - 1)); // нормалізований модуль
  return [
    { a: { s: 0, mag: f(0.8125), p: 3 }, b: { s: 0, mag: f(0.6875), p: -2 }, title: "A > 0, B > 0, PA > 0, PB < 0" },
    { a: { s: 0, mag: f(0.9375), p: 4 }, b: { s: 1, mag: f(0.625), p: 2 }, title: "A > 0, B < 0, |A| > |B|, PA > 0, PB > 0" },
    { a: { s: 0, mag: f(0.75), p: -1 }, b: { s: 1, mag: f(0.8125), p: 2 }, title: "A > 0, B < 0, |A| < |B|, PA < 0, PB > 0" },
    { a: { s: 1, mag: f(0.875), p: 3 }, b: { s: 1, mag: f(0.9375), p: 2 }, title: "A < 0, B < 0, PA > 0, PB > 0" },
  ];
}

export const fpValue = (x: Fp, m: number) => (x.s ? -1 : 1) * (x.mag / 2 ** (m - 1)) * 2 ** x.p;
