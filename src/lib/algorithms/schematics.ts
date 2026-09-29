/**
 * «Комп'ютерна схемотехніка» — расчёты к практическим/лабораторным в OrCAD:
 * логическая формула → вентили серии 7400 и список цепей PSpice (ПР 1, 3),
 * RC-цепочки (ПР 2), КМОН-инвертор (ЛР 4), асинхронный счётчик, регистр и
 * дешифратор 2 на 4 с задержками 7474 (ЛР 6).
 */

// ------------------------------------------------------------ формулы

export type Expr = { t: "var"; name: string } | { t: "not"; a: Expr } | { t: "and" | "or"; args: Expr[] };

export interface Formula {
  out: string;
  expr: Expr;
  /** Переменные в порядке появления в формуле. */
  vars: string[];
}

/** Разбор записи методички: «S=not(V*K)+(notV*D)»; not сильнее *, * сильнее +. */
export function parseFormula(src: string): Formula {
  const s = src.replace(/\s+/g, "");
  const eq = s.indexOf("=");
  if (eq < 1) throw new Error("Нет «=»: формула записывается как Y=…");
  const out = s.slice(0, eq);
  const body = s.slice(eq + 1);
  let i = 0;
  const vars: string[] = [];
  const peek = () => body[i];
  function primary(): Expr {
    if (body.startsWith("not", i)) {
      i += 3;
      return { t: "not", a: primary() };
    }
    if (peek() === "(") {
      i++;
      const e = orExpr();
      if (peek() !== ")") throw new Error(`Не закрыта скобка (позиция ${i + 1})`);
      i++;
      return e;
    }
    const m = /^[A-Za-z]\w*/.exec(body.slice(i));
    if (!m) throw new Error(`Непонятный символ «${peek() ?? "конец"}» (позиция ${i + 1})`);
    i += m[0].length;
    const name = m[0].toUpperCase();
    if (!vars.includes(name)) vars.push(name);
    return { t: "var", name };
  }
  function andExpr(): Expr {
    const args = [primary()];
    while (peek() === "*") {
      i++;
      args.push(primary());
    }
    return args.length === 1 ? args[0] : { t: "and", args };
  }
  function orExpr(): Expr {
    const args = [andExpr()];
    while (peek() === "+") {
      i++;
      args.push(andExpr());
    }
    return args.length === 1 ? args[0] : { t: "or", args };
  }
  const expr = orExpr();
  if (i < body.length) throw new Error(`Лишний символ «${body[i]}» (позиция ${i + 1}) — вероятно, лишняя скобка`);
  return { out: out.toUpperCase(), expr, vars };
}

export function evalExpr(e: Expr, env: Record<string, number>): number {
  switch (e.t) {
    case "var":
      return env[e.name];
    case "not":
      return 1 - evalExpr(e.a, env);
    case "and":
      return e.args.every((a) => evalExpr(a, env) === 1) ? 1 : 0;
    case "or":
      return e.args.some((a) => evalExpr(a, env) === 1) ? 1 : 0;
  }
}

/** Строки таблицы истинности: первая переменная — старший разряд (как у стимулов с наибольшим периодом). */
export function truthTable(f: Formula): { inputs: number[]; out: number }[] {
  const n = f.vars.length;
  return Array.from({ length: 1 << n }, (_, row) => {
    const inputs = f.vars.map((_, k) => (row >> (n - 1 - k)) & 1);
    const env = Object.fromEntries(f.vars.map((v, k) => [v, inputs[k]]));
    return { inputs, out: evalExpr(f.expr, env) };
  });
}

/** Переменные, от которых функция на самом деле не зависит. */
export function dummyVars(f: Formula): string[] {
  const rows = truthTable(f);
  const n = f.vars.length;
  return f.vars.filter((_, k) => rows.every((r, idx) => r.out === rows[idx ^ (1 << (n - 1 - k))].out));
}

export interface Gate {
  ref: string;
  part: string;
  title: string;
  inputs: string[];
  output: string;
}

const PARTS: Record<string, Record<number, { part: string; title: string }>> = {
  and: { 2: { part: "7408", title: "2І" }, 3: { part: "7411", title: "3І" } },
  nand: { 2: { part: "7400", title: "2І-НІ" }, 3: { part: "7410", title: "3І-НІ" } },
  nor: { 2: { part: "7402", title: "2АБО-НІ" }, 3: { part: "7427", title: "3АБО-НІ" } },
  or: { 2: { part: "7432", title: "2АБО" } },
};

/**
 * Схема «как записано»: not над * и + — элементы І-НІ и АБО-НІ (как NOR в
 * примере методички), not над переменной — інвертор 7404, остальное — І, АБО.
 * Трёхвходовых АБО в серии 7400 нет — каскад из двух 7432.
 */
export function buildGates(f: Formula): { gates: Gate[]; outNet: string } {
  const gates: Gate[] = [];
  let net = 0;
  const inverted = new Map<string, string>();
  const add = (kind: string, inputs: string[], output?: string): string => {
    const o = output ?? `N${++net}`;
    const p = PARTS[kind][inputs.length];
    if (!p) {
      // АБО на 3+ входа: каскад двухвходовых
      const mid = add(kind, inputs.slice(0, 2));
      return add(kind, [mid, ...inputs.slice(2)], output);
    }
    gates.push({ ref: `U${gates.length + 1}A`, part: p.part, title: p.title, inputs, output: o });
    return o;
  };
  function build(e: Expr, output?: string): string {
    if (e.t === "var") return e.name;
    if (e.t === "not") {
      if (e.a.t === "and") return add("nand", e.a.args.map((a) => build(a)), output);
      if (e.a.t === "or") return add("nor", e.a.args.map((a) => build(a)), output);
      if (e.a.t === "var" && !output) {
        // один інвертор на переменную, даже если notV встречается дважды
        const had = inverted.get(e.a.name);
        if (had) return had;
      }
      const src = build(e.a);
      const o = output ?? `N${++net}`;
      gates.push({ ref: `U${gates.length + 1}A`, part: "7404", title: "НІ", inputs: [src], output: o });
      if (e.a.t === "var" && !output) inverted.set(e.a.name, o);
      return o;
    }
    return add(e.t, e.args.map((a) => build(a)), output);
  }
  const outNet = build(f.expr, f.out);
  return { gates, outNet };
}

/** Строки списка цепей в формате Capture/PSpice (как в ПР 3). */
export function netlist(title: string, gates: Gate[], stims: string[] = []): string {
  const lines = [`* source ${title}`];
  for (const g of gates) {
    lines.push(`${`X_${g.ref}`.padEnd(14)}${[...g.inputs, g.output].join(" ")} $G_DPWR $G_DGND ${g.part} PARAMS:`);
    lines.push("+ IO_LEVEL=0 MNTYMXDLY=0");
  }
  stims.forEach((v, k) => lines.push(`${`U_DSTM${k + 1}`.padEnd(15)}STIM(1,0) $G_DPWR $G_DGND ${v} IO_STM STIMULUS=${v.toLowerCase()}`));
  return lines.join("\n");
}

// ------------------------------------------------------------ RC

export interface RcResult {
  tau: number;
  period: number;
  tmod: number;
  /** Установившиеся уровни выхода интегрирующей цепочки (0…V меандр). */
  vMax: number;
  vMin: number;
  /** Доля завершения переходного процесса за полупериод, %. */
  settle: number;
  /** Напряжение на конденсаторе в конце каждого полупериода от нулевого начального. */
  edges: { t: number; vc: number; x: number }[];
}

/** R, кОм; C, нФ → τ, T, Tmod в мкс. Вход — меандр 0…v с периодом T. */
export function rcChain(rK: number, cN: number, k: number, m: number, v = 5): RcResult {
  const tau = (rK * 1e3 * cN * 1e-9) * 1e6;
  const period = k * tau;
  const tmod = m * period;
  const a = Math.exp(-k / 2);
  const edges: RcResult["edges"] = [];
  let vc = 0;
  for (let h = 1; h <= 2 * m; h++) {
    const x = h % 2 ? v : 0; // первая половина периода — импульс
    vc = x + (vc - x) * a;
    edges.push({ t: (h * period) / 2, vc, x });
  }
  return { tau, period, tmod, vMax: v / (1 + a), vMin: (v * a) / (1 + a), settle: (1 - a) * 100, edges };
}

// ------------------------------------------------------ КМОН-инвертор

/**
 * Стандартная модель MOS уровня 1 в PSpice: KP = 20 мкА/В², VTO = 0,
 * W = L = 100 мкм — порог переключения Vd/2, сквозной ток в нём
 * ID = KP/2·(Vd/2)² (для 5 В — 62,5 мкА; методичка по графику: «≈ 65 мкА»).
 */
export const cmosPeakCurrent = (vd: number) => (2e-5 / 2) * (vd / 2) ** 2;

// --------------------------------------------- счётчик и дешифратор (ЛР 6)

/** Задержки 7474 по методичке: выход 0→1 — 14 нс, 1→0 — 20 нс. */
export const T_LH = 14;
export const T_HL = 20;

export type Mode = "up" | "down" | "reg";

interface FF {
  q: number;
  nq: number;
}

/** Выходы дешифратора 2 на 4 на 2І-НІ: Y0 = ¬(NQ1·NQ0), Y1 = ¬(NQ1·Q0), Y2 = ¬(Q1·NQ0), Y3 = ¬(Q1·Q0). */
export function decoder(f1: FF, f0: FF): number {
  const y0 = 1 - (f1.nq & f0.nq);
  const y1 = 1 - (f1.nq & f0.q);
  const y2 = 1 - (f1.q & f0.nq);
  const y3 = 1 - (f1.q & f0.q);
  return (y3 << 3) | (y2 << 2) | (y1 << 1) | y0;
}

export interface Step {
  /** нс от фронта Clk. */
  t: number;
  q: number;
  y: number;
}

/**
 * Переход по одному фронту Clk из состояния q (Q1Q0). Для счётчика T1
 * тактируется от NQ0 (суммирующий) или Q0 (вычитающий), D = NQ; для регистра
 * оба тригера — от Clk, D — с шины. Дешифратор без задержек, как в анализе
 * методички (рис. 6).
 */
export function transition(mode: Mode, q: number, d = 0): Step[] {
  const ff: FF[] = [0, 1].map((b) => ({ q: (q >> b) & 1, nq: 1 - ((q >> b) & 1) }));
  type Ev = { t: number; b: number; pin: "q" | "nq"; v: number };
  const events: Ev[] = [];
  const clock = (b: number, t: number, dv: number) => {
    if (dv === ff[b].q) return;
    // Q и NQ меняются с разными задержками: 0→1 быстрее, чем 1→0
    events.push({ t: t + (dv ? T_LH : T_HL), b, pin: "q", v: dv });
    events.push({ t: t + (dv ? T_HL : T_LH), b, pin: "nq", v: 1 - dv });
  };
  if (mode === "reg") {
    clock(0, 0, d & 1);
    clock(1, 0, (d >> 1) & 1);
  } else clock(0, 0, ff[0].nq);
  const steps: Step[] = [{ t: 0, q, y: decoder(ff[1], ff[0]) }];
  while (events.length) {
    events.sort((a, b) => a.t - b.t);
    const t = events[0].t;
    while (events.length && events[0].t === t) {
      const e = events.shift()!;
      const before = { ...ff[e.b] };
      ff[e.b][e.pin] = e.v;
      // фронт 0→1 на входе синхронизации второго тригера
      if (mode !== "reg" && e.b === 0) {
        const src = mode === "up" ? "nq" : "q";
        if (e.pin === src && before[src] === 0 && e.v === 1) clock(1, t, ff[1].nq);
      }
    }
    steps.push({ t, q: (ff[1].q << 1) | ff[0].q, y: decoder(ff[1], ff[0]) });
  }
  return steps;
}

/** Последовательность состояний по фронтам Clk (после сброса Rst — 0). */
export function sequence(mode: Mode, count: number, data: number[] = []): number[] {
  const out: number[] = [];
  let q = 0;
  for (let k = 0; k < count; k++) {
    q = mode === "up" ? (q + 1) & 3 : mode === "down" ? (q + 3) & 3 : data[k % data.length] & 3;
    out.push(q);
  }
  return out;
}

export const hex = (v: number) => v.toString(16).toUpperCase();
export const bin = (v: number, n: number) => v.toString(2).padStart(n, "0");
