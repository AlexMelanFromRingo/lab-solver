/**
 * Разбор математических выражений для численных методов: функции задаются
 * строкой, как в Maple. Поддерживаются + − * / ^, унарный минус, неявное
 * умножение (2x, 3sin(x), (x+1)(x−1)), константы pi и e, функции sin cos tan
 * cot asin acos atan sinh cosh exp ln log (натуральный — как в Maple) log10
 * sqrt abs. Переменные — любые латинские имена, значения передаются при вызове.
 */

type Node =
  | { k: "num"; v: number }
  | { k: "var"; n: string }
  | { k: "neg"; a: Node }
  | { k: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { k: "fn"; f: string; a: Node };

const FN: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  cot: (x) => 1 / Math.tan(x),
  asin: Math.asin,
  arcsin: Math.asin,
  acos: Math.acos,
  arccos: Math.acos,
  atan: Math.atan,
  arctan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log,
  log10: Math.log10,
  lg: Math.log10,
  sqrt: Math.sqrt,
  abs: Math.abs,
};

const CONST: Record<string, number> = { pi: Math.PI, Pi: Math.PI, e: Math.E };

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/\*\*/g, "^").replace(/,/g, ".");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i))!;
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i))!;
      out.push({ t: "id", v: m[0] });
      i += m[0].length;
    } else if ("+-*/^()".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      throw new Error(`Непонятный символ «${c}»`);
    }
  }
  return out;
}

function parse(toks: Tok[]): Node {
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;
  // начало множителя — для неявного умножения
  const startsFactor = () => {
    const t = peek();
    return !!t && (t.t === "num" || t.t === "id" || (t.t === "op" && t.v === "("));
  };

  function expr(): Node {
    let a = term();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++].v as "+" | "-";
      a = { k: "bin", op, a, b: term() };
    }
    return a;
  }
  function term(): Node {
    let a = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[p++].v as "*" | "/";
        a = { k: "bin", op, a, b: unary() };
      } else if (startsFactor()) {
        a = { k: "bin", op: "*", a, b: power() };
      } else return a;
    }
  }
  function unary(): Node {
    if (isOp("-")) {
      p++;
      return { k: "neg", a: unary() };
    }
    if (isOp("+")) {
      p++;
      return unary();
    }
    return power();
  }
  function power(): Node {
    const base = atom();
    if (isOp("^")) {
      p++;
      return { k: "bin", op: "^", a: base, b: unary() };
    }
    return base;
  }
  function atom(): Node {
    const t = toks[p++];
    if (!t) throw new Error("Выражение оборвалось");
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "op" && t.v === "(") {
      const e = expr();
      if (!isOp(")")) throw new Error("Не хватает закрывающей скобки");
      p++;
      return e;
    }
    if (t.t === "id") {
      if (FN[t.v] && isOp("(")) {
        p++;
        const a = expr();
        if (!isOp(")")) throw new Error(`Не хватает скобки после ${t.v}(`);
        p++;
        return { k: "fn", f: t.v, a };
      }
      if (t.v in CONST) return { k: "num", v: CONST[t.v] };
      return { k: "var", n: t.v };
    }
    throw new Error(`Неожиданное «${t.v}»`);
  }

  const n = expr();
  if (p < toks.length) throw new Error(`Лишнее «${toks[p].v}»`);
  return n;
}

function evalNode(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case "num":
      return n.v;
    case "var":
      if (!(n.n in env)) throw new Error(`Неизвестная переменная «${n.n}»`);
      return env[n.n];
    case "neg":
      return -evalNode(n.a, env);
    case "fn":
      return FN[n.f](evalNode(n.a, env));
    case "bin": {
      const a = evalNode(n.a, env);
      const b = evalNode(n.b, env);
      if (n.op === "+") return a + b;
      if (n.op === "-") return a - b;
      if (n.op === "*") return a * b;
      if (n.op === "/") return a / b;
      return Math.pow(a, b);
    }
  }
}

function vars(n: Node, acc = new Set<string>()): Set<string> {
  if (n.k === "var") acc.add(n.n);
  else if (n.k === "neg" || n.k === "fn") vars(n.a, acc);
  else if (n.k === "bin") {
    vars(n.a, acc);
    vars(n.b, acc);
  }
  return acc;
}

export interface Compiled {
  (env: Record<string, number>): number;
  vars: string[];
}

/** Разобрать выражение; допустимые переменные проверяются сразу. */
export function compile(src: string, allowed: string[]): Compiled {
  if (!src.trim()) throw new Error("Пустое выражение");
  const node = parse(tokenize(src));
  const used = [...vars(node)];
  const bad = used.filter((v) => !allowed.includes(v));
  if (bad.length) throw new Error(`Неизвестные имена: ${bad.join(", ")} (переменные: ${allowed.join(", ")})`);
  const f = ((env: Record<string, number>) => evalNode(node, env)) as Compiled;
  f.vars = used;
  return f;
}

/** Функция одной переменной x. */
export function fn1(src: string, v = "x"): (x: number) => number {
  const c = compile(src, [v]);
  return (x) => c({ [v]: x });
}

/** Функция двух переменных (x, y). */
export function fn2(src: string, a = "x", b = "y"): (x: number, y: number) => number {
  const c = compile(src, [a, b]);
  return (x, y) => c({ [a]: x, [b]: y });
}

/** Численные производные: центральные разности. */
export const d1 = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
export const d2 = (f: (x: number) => number, x: number, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
