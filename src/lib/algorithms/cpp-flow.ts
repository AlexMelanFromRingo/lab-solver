/**
 * Блок-схема з програми на C++ (підмножина, якою написані програми сайту):
 * функції, if/else, while, for, do-while, return, введення cin, виведення
 * cout, виклики власних функцій (блок «визначений процес»), решта — процеси.
 * Препроцесорні рядки й блоки #ifdef … #endif, коментарі, опис struct і
 * оголошення без ініціалізації пропускаються. Дострокові return — вихід
 * через з'єднувач до єдиного «Кінець» (ДСТУ ISO 5807).
 */

import { END, EXIT, JOIN, io, op, seq, type Flow } from "./flowchart";

// ───────────────────────────────────────────────────────── підготовка тексту

function stripComments(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else if (src.startsWith("//", i)) {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (src.startsWith("/*", i)) {
      const j = src.indexOf("*/", i + 2);
      i = j < 0 ? src.length : j + 2;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Без препроцесора: рядки #…, а блоки #ifdef/#ifndef … #endif — цілком. */
function stripPreprocessor(src: string): string {
  const out: string[] = [];
  let depth = 0;
  for (const line of src.split("\n")) {
    const t = line.trim();
    if (/^#\s*if/.test(t)) {
      depth++;
      continue;
    }
    if (/^#\s*endif/.test(t)) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0 || t.startsWith("#") || /^using\s+namespace/.test(t)) continue;
    out.push(line);
  }
  return out.join("\n");
}

/** Кінець збалансованої дужки: s[i] — відкриваюча. */
function matching(s: string, i: number): number {
  const open = s[i];
  const close = open === "(" ? ")" : open === "{" ? "}" : "]";
  let d = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'") {
      j++;
      while (j < s.length && s[j] !== c) j += s[j] === "\\" ? 2 : 1;
      continue;
    }
    if (c === open) d++;
    else if (c === close && --d === 0) return j;
  }
  throw new Error(`Незбалансовані дужки в «${s.slice(i, i + 40)}…»`);
}

// ───────────────────────────────────────────────────────────────── синтаксис

type Stmt =
  | { k: "simple"; text: string }
  | { k: "block"; body: Stmt[] }
  | { k: "if"; cond: string; then: Stmt; else?: Stmt }
  | { k: "while"; cond: string; body: Stmt }
  | { k: "for"; init: string; cond: string; step: string; body: Stmt }
  | { k: "do"; body: Stmt; cond: string }
  | { k: "return"; expr: string };

function parseStatements(s: string): Stmt[] {
  const out: Stmt[] = [];
  let i = 0;
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const one = (): Stmt => {
    ws();
    if (s[i] === "{") {
      const j = matching(s, i);
      const body = parseStatements(s.slice(i + 1, j));
      i = j + 1;
      return { k: "block", body };
    }
    const kw = s.slice(i).match(/^(if|while|for|do|return)\b/)?.[1];
    if (kw === "if" || kw === "while" || kw === "for") {
      i += kw.length;
      ws();
      const j = matching(s, i);
      const head = s.slice(i + 1, j).trim();
      i = j + 1;
      const body = one();
      if (kw === "while") return { k: "while", cond: head, body };
      if (kw === "for") {
        const [init, cond, step] = head.split(";").map((x) => x.trim());
        return { k: "for", init, cond, step, body };
      }
      ws();
      if (s.slice(i).match(/^else\b/)) {
        i += 4;
        return { k: "if", cond: head, then: body, else: one() };
      }
      return { k: "if", cond: head, then: body };
    }
    if (kw === "do") {
      i += 2;
      const body = one();
      ws();
      i += 5; // while
      ws();
      const j = matching(s, i);
      const cond = s.slice(i + 1, j).trim();
      i = j + 1;
      ws();
      if (s[i] === ";") i++;
      return { k: "do", body, cond };
    }
    // простий оператор до «;» на нульовій глибині дужок
    let j = i;
    while (j < s.length && s[j] !== ";") {
      if (s[j] === "(" || s[j] === "{" || s[j] === "[") j = matching(s, j);
      else if (s[j] === '"' || s[j] === "'") {
        const q = s[j];
        j++;
        while (j < s.length && s[j] !== q) j += s[j] === "\\" ? 2 : 1;
      }
      j++;
    }
    const text = s.slice(i, j).trim();
    i = j + 1;
    if (kw === "return") return { k: "return", expr: text.replace(/^return\s*/, "") };
    return { k: "simple", text };
  };
  ws();
  while (i < s.length) {
    out.push(one());
    ws();
  }
  return out;
}

// ─────────────────────────────────────────────────────────── вирази й тексти

const pretty = (e: string) =>
  e
    .replace(/\s+/g, " ")
    .replace(/!=/g, "≠")
    .replace(/==/g, "=")
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/&&/g, "і")
    .replace(/\|\|/g, "або")
    .replace(/ % /g, " mod ")
    .trim();

/** Текст для cout: рядкові літерали без лапок, endl/setw прибираються. */
function coutText(expr: string): string {
  const parts = expr
    .replace(/^cout\s*<</, "")
    .split(/<<(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((p) => p.trim())
    .filter((p) => p && p !== "endl" && !/^setw\(/.test(p) && !/^setprecision\(/.test(p) && p !== "fixed");
  return parts.map((p) => (/^".*"$/.test(p) ? p.slice(1, -1) : p)).join(" ").trim();
}

const TYPE = /^(?:const\s+)?(?:unsigned\s+|long\s+|short\s+|signed\s+)*(?:int|long|short|double|float|char|bool|string|size_t|auto|Matrix|[A-Z]\w*)(?:\s*[*&])*\s+/;

// ───────────────────────────────────────────────────────── у блок-схему

interface Ctx {
  fns: Set<string>;
  isMain: boolean;
  exits: boolean;
}

/** У виразі є виклик власної функції програми. */
const usesFn = (e: string, ctx: Ctx) => [...e.matchAll(/(\w+)\s*\(/g)].some((m) => ctx.fns.has(m[1]));

function simple(text: string, ctx: Ctx): Flow | null {
  const t = text.trim();
  if (!t) return null;
  if (/^cin\s*>>/.test(t))
    return io(
      "Введення " +
        t
          .replace(/^cin\s*>>/, "")
          .split(">>")
          .map((x) => x.trim())
          .join(", "),
    );
  if (/^cout\s*<</.test(t)) {
    const txt = coutText(t);
    // cout << (умова ? "А" : "Б") — розгалуження з двома виведеннями
    const tern = txt.match(/^\((.+?)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\)$/);
    if (tern) return { t: "if", cond: pretty(tern[1]), yes: io(`Виведення: ${tern[2]}`), no: io(`Виведення: ${tern[3]}`) };
    return io("Виведення: " + txt);
  }
  // оголошення без ініціалізації — пропускаються; з ініціалізацією — присвоєння
  if (TYPE.test(t) && !/^(return|delete)\b/.test(t)) {
    const rest = t.replace(TYPE, "");
    if (!rest.includes("=") && !rest.includes("(")) return null;
    const text = pretty(rest.replace(/\s*=\s*/, " := "));
    return usesFn(rest, ctx) ? { t: "call", text } : op(text);
  }
  const call = t.match(/^(\w+)\s*\(/);
  if (call && ctx.fns.has(call[1])) return { t: "call", text: pretty(t) };
  const assign = t.match(/^([\w.[\]>-]+)\s*([+\-*/%]?)=(?!=)\s*(.+)$/s);
  if (assign) {
    const [, lhs, o, rhs] = assign;
    const text = o ? `${lhs} := ${lhs} ${o === "%" ? "mod" : o} ${pretty(rhs)}` : `${lhs} := ${pretty(rhs)}`;
    return usesFn(rhs, ctx) ? { t: "call", text } : op(text);
  }
  if (/^(\w[\w.[\]]*)\s*(\+\+|--)$/.test(t) || /^(\+\+|--)/.test(t)) {
    const name = t.replace(/\+\+|--/g, "");
    return op(`${name} := ${name} ${t.includes("++") ? "+" : "−"} 1`);
  }
  return op(pretty(t));
}

/** Сусідні прості процеси — в один блок (до 4 рядків). */
function merge(items: Flow[]): Flow[] {
  const out: Flow[] = [];
  for (const f of items) {
    const prev = out[out.length - 1];
    if (f.t === "op" && prev?.t === "op" && prev.text.split("\n").length < 4) {
      out[out.length - 1] = op(prev.text + "\n" + f.text);
    } else out.push(f);
  }
  return out;
}

function toFlow(stmts: Stmt[], ctx: Ctx, last: boolean): Flow {
  const items: Flow[] = [];
  stmts.forEach((st, idx) => {
    const isLast = last && idx === stmts.length - 1;
    const f = conv(st, ctx, isLast);
    if (f) items.push(f);
  });
  return seq(...merge(items));
}

function conv(st: Stmt, ctx: Ctx, isLast: boolean): Flow | null {
  switch (st.k) {
    case "simple":
      return simple(st.text, ctx);
    case "block":
      return toFlow(st.body, ctx, isLast);
    case "if":
      return {
        t: "if",
        cond: pretty(st.cond),
        yes: conv(st.then, ctx, false) ?? seq(),
        no: st.else ? (conv(st.else, ctx, false) ?? undefined) : undefined,
      };
    case "while":
      return { t: "while", cond: pretty(st.cond), body: conv(st.body, ctx, false) ?? seq() };
    case "for": {
      const init = st.init ? simple(st.init, ctx) : null;
      const step = st.step ? simple(st.step, ctx) : null;
      return seq(init, { t: "while", cond: pretty(st.cond), body: seq(conv(st.body, ctx, false), step) });
    }
    case "do":
      return { t: "until", body: conv(st.body, ctx, false) ?? seq(), cond: pretty(st.cond) };
    case "return": {
      const value = st.expr && !(ctx.isMain && st.expr === "0");
      if (isLast) return value ? op(`Повернути ${pretty(st.expr)}`) : null;
      ctx.exits = true;
      return seq(value && !ctx.isMain ? op(`Повернути ${pretty(st.expr)}`) : null, EXIT);
    }
  }
}

export interface FunctionFlow {
  name: string;
  signature: string;
  flow: Flow;
}

/** Блок-схеми всіх функцій програми (main — першою). */
export function cppFlows(source: string): FunctionFlow[] {
  const src = stripPreprocessor(stripComments(source));
  const fnRe = /(^|\n)\s*([A-Za-z_][\w:<>\s*&]*?)\s+([A-Za-z_]\w*)\s*\(([^()]*)\)\s*\{/g;
  const found: { name: string; params: string; body: string }[] = [];
  for (let m = fnRe.exec(src); m; m = fnRe.exec(src)) {
    if (/^(struct|class|if|while|for|switch|else)$/.test(m[3]) || /\b(struct|class)\b/.test(m[2])) continue;
    const open = m.index + m[0].length - 1;
    const close = matching(src, open);
    found.push({ name: m[3], params: m[4].trim(), body: src.slice(open + 1, close) });
    fnRe.lastIndex = close + 1;
  }
  const fns = new Set(found.map((f) => f.name));
  const flows = found.map((f) => {
    const ctx: Ctx = { fns, isMain: f.name === "main", exits: false };
    const body = toFlow(parseStatements(f.body), ctx, true);
    const params = f.params
      .split(",")
      .map((p) => p.trim().split(/[\s*&]+/).pop() ?? "")
      .filter(Boolean)
      .join(", ");
    const start: Flow = { t: "start", text: f.name === "main" ? "Початок" : `${f.name}(${params})` };
    const flow = seq(start, body, ctx.exits ? JOIN : null, f.name === "main" ? END : { t: "end", text: "Вихід" });
    return { name: f.name, signature: `${f.name}(${params})`, flow };
  });
  return flows.sort((a, b) => (a.name === "main" ? -1 : b.name === "main" ? 1 : 0));
}
