/**
 * Интерпретатор языка JOLS-M (ЯОЛС-М) — учебного языка микропрограмм для
 * лабораторных по архитектуре ЭВМ ("АРХІТЕКТУРА КОМП'ЮТЕРІВ Lab 1 (JOLS-M)").
 *
 * Порт jolsm-toolkit/jolsm.py (834 строки, чистый Python, без внешних
 * зависимостей) на TypeScript, семантика сохранена насколько возможно 1:1 —
 * тот же грамматика, синонимы ключевых слов на трёх языках, тот же набор
 * операций (=,+,-,&,|,^,<<,>>,циклические сдвиги, сложение с переносом).
 * Значения регистров — BigInt, т.к. JOLS-M допускает разрядность до 64 бит,
 * а битовые операции JS-Number ограничены 32 битами.
 *
 * Отличие от оригинала: run() дополнительно копит trace — снимок состояния
 * всех переменных после каждого шага, чтобы веб-интерфейс мог показать
 * пошаговое выполнение микропрограммы (в CLI-версии это не требовалось).
 */

const KW: Record<string, string> = {};
const KW_GROUPS: [string, string][] = [
  ["var def dim define задать создать объявить обьявить", "DECL"],
  ["do op оп операция operation", "OP"],
  ["if если", "IF"],
  ["then то", "THEN"],
  ["print write echo печать вывести", "PRINT"],
  ["scan read ввести ввод input", "INPUT"],
  ["jump goto идти идти_к go_to", "GOTO"],
  ["call вызов вызвать", "CALL"],
  ["return ret возврат вернуться", "RETURN"],
  ["end конец", "END"],
  ["delay sleep задержка ждать", "DELAY"],
  ["remar remark ремарка", "REM"],
];
for (const [words, kind] of KW_GROUPS) {
  for (const w of words.split(" ")) KW[w] = kind;
}

const STACK_LIMIT = 65535;
// "!=" — не входит в формальную грамматику языка (там "<>"), но реально встречается в
// конспектах лаб как более привычный C-подобный синоним неравенства — принимаем оба.
const RELS = ["<=", ">=", "<>", "!=", "=", "<", ">"];
const BINOPS = ["+!", "++", "|<", ">|", "<<", ">>", ">]", "[<", "=", "+", "-", "&", "|", "/", "^", "@"];
const OP_CANON: Record<string, string> = { "/": "|", "@": "^", ">]": ">|", "[<": "|<", "++": "+!" };

const IDENT = "[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*";

export class JolsmError extends Error {
  line?: number;
  constructor(msg: string, line?: number) {
    super(msg);
    this.line = line;
  }
}

// ── comment stripping / line splitting ──────────────────────────────────
function stripComments(src: string): string {
  const out: string[] = [];
  let line: string[] = [];
  let inBlock = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inBlock) {
      if (c === "}") inBlock = false;
      else if (c === "\n") {
        out.push(line.join(""));
        line = [];
      }
      continue;
    }
    if (c === "{") {
      inBlock = true;
      continue;
    }
    if (c === "%") {
      while (i < src.length && src[i] !== "\n") i++;
      i--; // за счёт i++ во внешнем цикле
      continue;
    }
    if (c === "\n") {
      out.push(line.join(""));
      line = [];
      continue;
    }
    line.push(c);
  }
  out.push(line.join(""));
  return out.join("\n");
}

interface SrcLine {
  no: number;
  label: string;
  text: string;
}

function splitLines(src: string): SrcLine[] {
  const lines: SrcLine[] = [];
  const raw = stripComments(src).split("\n");
  raw.forEach((r, idx) => {
    const t = r.trim();
    if (!t) return;
    let label = "";
    let text = t;
    const m = t.match(new RegExp(`^([A-Za-zА-Яа-яЁё0-9_]+)\\s*:\\s*(.*)$`));
    if (m) {
      label = m[1];
      text = m[2].trim();
    }
    if (label || text) lines.push({ no: idx + 1, label, text });
  });
  return lines;
}

// ── number parsing ───────────────────────────────────────────────────────
function parseNumber(tokIn: string): bigint {
  const tok = tokIn.trim();
  if (/^-?\d+$/.test(tok)) return BigInt(tok);
  if (/^\$[0-9A-Fa-f]+$/.test(tok)) return BigInt("0x" + tok.slice(1));
  if (/^#[01]+$/.test(tok)) return BigInt("0b" + tok.slice(1));
  throw new JolsmError(`некорректное число: '${tok}'`);
}

// ── machine state ────────────────────────────────────────────────────────
export class Var {
  name: string;
  width: number;
  isMem: boolean;
  count: number;
  value: bigint = 0n;
  cells: bigint[] = [];

  constructor(name: string, width: number, isMem = false, count = 0) {
    this.name = name;
    this.width = width;
    this.isMem = isMem;
    this.count = count;
    if (isMem) this.cells = new Array(count).fill(0n);
  }

  mask(): bigint {
    return (1n << BigInt(this.width)) - 1n;
  }
}

class Machine {
  vars = new Map<string, Var>();

  declare(name: string, width: number, isMem = false, count = 0) {
    if (this.vars.has(name)) throw new JolsmError(`переменная '${name}' уже объявлена`);
    if (width < 1 || width > 64) throw new JolsmError(`недопустимая разрядность ${width} (1..64)`);
    this.vars.set(name, new Var(name, width, isMem, count));
  }

  getVar(name: string): Var {
    const v = this.vars.get(name);
    if (!v) throw new JolsmError(`необъявленная переменная '${name}'`);
    return v;
  }
}

// ── operand ───────────────────────────────────────────────────────────────
type OperandKind = "const" | "var" | "bits" | "cell";

interface Operand {
  kind: OperandKind;
  const: bigint;
  name: string;
  hi: number;
  lo: number;
  index: Operand | null;
  invert: boolean;
}

function mkConst(v: bigint, invert = false): Operand {
  return { kind: "const", const: v, name: "", hi: 0, lo: 0, index: null, invert };
}

function parseOperand(textIn: string, machine: Machine): Operand {
  let text = textIn.trim();
  let inv = false;
  if (text.endsWith("~")) {
    inv = true;
    text = text.slice(0, -1).trim();
  }
  if (/^-?\d+$|^\$[0-9A-Fa-f]+$|^#[01]+$/.test(text)) {
    return mkConst(parseNumber(text), inv);
  }
  const m = text.match(new RegExp(`^(${IDENT})\\s*\\((.+)\\)$`));
  if (m) {
    const base = m[1];
    const inside = m[2].trim();
    const v = machine.vars.get(base);
    if (v && v.isMem) {
      let idx: Operand;
      if (/^-?\d+$|^\$[0-9A-Fa-f]+$|^#[01]+$/.test(inside)) {
        idx = mkConst(parseNumber(inside));
      } else if (new RegExp(`^${IDENT}$`).test(inside)) {
        idx = { kind: "var", const: 0n, name: inside, hi: 0, lo: 0, index: null, invert: false };
      } else {
        throw new JolsmError(`некорректный индекс памяти: '${inside}'`);
      }
      return { kind: "cell", const: 0n, name: base, hi: 0, lo: 0, index: idx, invert: inv };
    }
    const bf = inside.match(/^(\d+)\s*:\s*(\d+)$/);
    if (bf) {
      const hi = parseInt(bf[1], 10);
      const lo = parseInt(bf[2], 10);
      if (hi < lo) throw new JolsmError(`в поле (${inside}) старший бит < младшего`);
      return { kind: "bits", const: 0n, name: base, hi, lo, index: null, invert: inv };
    }
    if (/^\d+$/.test(inside)) {
      const b = parseInt(inside, 10);
      return { kind: "bits", const: 0n, name: base, hi: b, lo: b, index: null, invert: inv };
    }
    throw new JolsmError(`некорректный операнд: '${text}'`);
  }
  if (new RegExp(`^${IDENT}$`).test(text)) {
    return { kind: "var", const: 0n, name: text, hi: 0, lo: 0, index: null, invert: inv };
  }
  throw new JolsmError(`некорректный операнд: '${text}'`);
}

// ── read / write ──────────────────────────────────────────────────────────
function cellIndex(op: Operand, m: Machine): number {
  const idx = op.index!;
  if (idx.kind === "const") return Number(idx.const);
  const v = m.getVar(idx.name);
  if (v.isMem) throw new JolsmError(`индексом памяти не может быть массив '${idx.name}'`);
  return Number(v.value);
}

function readOp(op: Operand, m: Machine): bigint {
  if (op.kind === "const") {
    return op.invert ? ~op.const : op.const;
  }
  if (op.kind === "var") {
    const v = m.getVar(op.name);
    if (v.isMem) throw new JolsmError(`'${op.name}' — массив, нужен индекс`);
    const val = v.value & v.mask();
    return op.invert ? ~val & v.mask() : val;
  }
  if (op.kind === "bits") {
    const v = m.getVar(op.name);
    if (op.hi >= v.width) throw new JolsmError(`бит ${op.hi} вне разрядности '${op.name}'(0..${v.width - 1})`);
    const span = op.hi - op.lo + 1;
    const fmask = (1n << BigInt(span)) - 1n;
    const val = (v.value >> BigInt(op.lo)) & fmask;
    return op.invert ? ~val & fmask : val;
  }
  if (op.kind === "cell") {
    const v = m.getVar(op.name);
    const ci = cellIndex(op, m);
    if (ci < 0 || ci >= v.count) throw new JolsmError(`индекс ${ci} вне памяти '${op.name}'(0..${v.count - 1})`);
    const val = v.cells[ci] & v.mask();
    return op.invert ? ~val & v.mask() : val;
  }
  throw new JolsmError("внутренняя ошибка: неизвестный операнд");
}

function writeOp(op: Operand, value: bigint, m: Machine) {
  if (op.kind === "const") throw new JolsmError("нельзя присваивать константе");
  if (op.kind === "var") {
    const v = m.getVar(op.name);
    if (v.isMem) throw new JolsmError(`'${op.name}' — массив, нужен индекс`);
    v.value = value & v.mask();
  } else if (op.kind === "bits") {
    const v = m.getVar(op.name);
    if (op.hi >= v.width) throw new JolsmError(`бит ${op.hi} вне разрядности '${op.name}'(0..${v.width - 1})`);
    const span = op.hi - op.lo + 1;
    const fmask = ((1n << BigInt(span)) - 1n) << BigInt(op.lo);
    v.value = (v.value & ~fmask) | ((value << BigInt(op.lo)) & fmask);
    v.value &= v.mask();
  } else if (op.kind === "cell") {
    const v = m.getVar(op.name);
    const ci = cellIndex(op, m);
    if (ci < 0 || ci >= v.count) throw new JolsmError(`индекс ${ci} вне памяти '${op.name}'(0..${v.count - 1})`);
    v.cells[ci] = value & v.mask();
  } else {
    throw new JolsmError("внутренняя ошибка: некорректная цель записи");
  }
}

function destWidth(op: Operand, m: Machine): number {
  if (op.kind === "bits") return op.hi - op.lo + 1;
  if (op.kind === "var" || op.kind === "cell") return m.getVar(op.name).width;
  throw new JolsmError("цель операции не имеет разрядности");
}

// ── operation evaluation ─────────────────────────────────────────────────
function applyOp(destVal: bigint, opcodeIn: string, rhs: bigint, width: number): bigint {
  const mask = (1n << BigInt(width)) - 1n;
  const opcode = OP_CANON[opcodeIn] ?? opcodeIn;
  const w = BigInt(width);
  switch (opcode) {
    case "=":
      return rhs & mask;
    case "+":
      return (destVal + rhs) & mask;
    case "-":
      return (destVal - rhs) & mask;
    case "&":
      return destVal & rhs & mask;
    case "|":
      return (destVal | rhs) & mask;
    case "^":
      return (destVal ^ rhs) & mask;
    case "<<":
      return (destVal << (rhs & 63n)) & mask;
    case ">>":
      return (destVal & mask) >> (rhs & 63n);
    case "|<": {
      const s = ((rhs % w) + w) % w;
      const v = destVal & mask;
      return s === 0n ? v : ((v << s) | (v >> (w - s))) & mask;
    }
    case ">|": {
      const s = ((rhs % w) + w) % w;
      const v = destVal & mask;
      return s === 0n ? v : ((v >> s) | (v << (w - s))) & mask;
    }
    case "+!": {
      let r = (destVal & mask) + (rhs & mask);
      if (r > mask) r = (r & mask) + 1n;
      return r & mask;
    }
    default:
      throw new JolsmError(`неизвестная операция '${opcodeIn}'`);
  }
}

// ── statement model ──────────────────────────────────────────────────────
type StmtKind = "DECL" | "INPUT" | "PRINT" | "GOTO" | "CALL" | "RETURN" | "DELAY" | "END" | "IF" | "OP" | "NOP";

interface Stmt {
  no: number;
  kind: StmtKind;
  raw: string;
  data: Record<string, unknown>;
}

function firstWord(t: string): [string | null, string] {
  const m = t.match(/^([A-Za-zА-Яа-яЁё_]+)\b/);
  if (!m) return [null, t];
  return [m[1], t.slice(m[0].length).trim()];
}

function splitTop(text: string): string[] {
  const parts: string[] = [];
  let buf: string[] = [];
  let depth = 0;
  for (const c of text) {
    if (c === "(") {
      depth += 1;
      buf.push(c);
      continue;
    }
    if (c === ")") {
      depth -= 1;
      buf.push(c);
      continue;
    }
    if (depth === 0 && c === ",") {
      parts.push(buf.join(""));
      buf = [];
      continue;
    }
    buf.push(c);
  }
  parts.push(buf.join(""));
  return parts.map((p) => p.trim()).filter((p) => p !== "");
}

interface OpData {
  dest: string;
  opcode: string;
  rhs: string | null;
}

function parseOpStatement(t: string): OpData {
  const s = t.trim();
  if (s.endsWith("~~")) return { dest: s.slice(0, -2).trim(), opcode: "~", rhs: null };
  if (s.endsWith("!")) return { dest: s.slice(0, -1).trim(), opcode: "~", rhs: null };
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth += 1;
    else if (c === ")") depth -= 1;
    else if (depth === 0) {
      for (const opt of BINOPS) {
        if (i > 0 && s.startsWith(opt, i)) {
          return { dest: s.slice(0, i).trim(), opcode: opt, rhs: s.slice(i + opt.length).trim() };
        }
      }
    }
  }
  // Одиночный завершающий "~" без парной операции — тоже воспринимается как
  // "инвертировать операнд на месте" (в реальных конспектах лабы встречается
  // и такая запись наравне с формальными "X~~"/"X!" из справочника языка).
  if (s.endsWith("~")) return { dest: s.slice(0, -1).trim(), opcode: "~", rhs: null };
  throw new JolsmError(`не распознана операция: '${t}'`);
}

function parseStatement(no: number, t: string): Stmt {
  if (!t) return { no, kind: "NOP", raw: t, data: {} };
  const [word, rest] = firstWord(t);
  const kw = word ? KW[word.toLowerCase()] : undefined;

  if (kw === "DECL") {
    const decls: { name: string; isMem: boolean; count: number; width: number }[] = [];
    for (const part of splitTop(rest)) {
      let m = part.match(new RegExp(`^\\s*(${IDENT})\\s*\\((\\d+)\\)\\s*\\((\\d+)\\)\\s*$`));
      if (m) {
        decls.push({ name: m[1], isMem: true, count: parseInt(m[2], 10), width: parseInt(m[3], 10) });
        continue;
      }
      m = part.match(new RegExp(`^\\s*(${IDENT})\\s*\\((\\d+)\\)\\s*$`));
      if (m) {
        decls.push({ name: m[1], isMem: false, count: 0, width: parseInt(m[2], 10) });
        continue;
      }
      throw new JolsmError(`некорректное объявление: '${part}'`, no);
    }
    return { no, kind: "DECL", raw: t, data: { decls } };
  }

  if (kw === "INPUT") return { no, kind: "INPUT", raw: t, data: { targets: splitTop(rest) } };
  if (kw === "PRINT") return { no, kind: "PRINT", raw: t, data: { items: splitTop(rest) } };
  if (kw === "GOTO") return { no, kind: "GOTO", raw: t, data: { label: rest.trim() } };
  if (kw === "CALL") return { no, kind: "CALL", raw: t, data: { label: rest.trim() } };
  if (kw === "RETURN") return { no, kind: "RETURN", raw: t, data: {} };
  if (kw === "DELAY") return { no, kind: "DELAY", raw: t, data: { arg: rest.trim() } };

  if (kw === "END") {
    let msg = "";
    const rs = rest.trim();
    if (rs) {
      const mm = rs.match(/^["'](.*)["']$/);
      msg = mm ? mm[1] : rs;
    }
    return { no, kind: "END", raw: t, data: { msg } };
  }

  if (kw === "REM") return { no, kind: "NOP", raw: t, data: {} };

  if (kw === "IF") {
    const body = rest;
    let depth = 0;
    let relpos = -1;
    let reltok = "";
    outer: for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === "(") depth += 1;
      else if (c === ")") depth -= 1;
      else if (depth === 0) {
        for (const rl of RELS) {
          if (body.startsWith(rl, i)) {
            relpos = i;
            reltok = rl;
            break outer;
          }
        }
      }
    }
    if (relpos < 0) throw new JolsmError(`в 'если' нет операции сравнения: '${t}'`, no);
    const left = body.slice(0, relpos).trim();
    const after = body.slice(relpos + reltok.length).trim();
    const spaceIdx = after.search(/\s/);
    const right = spaceIdx === -1 ? after : after.slice(0, spaceIdx);
    let action = spaceIdx === -1 ? "" : after.slice(spaceIdx + 1).trim();
    const [aw] = firstWord(action);
    if (aw && KW[aw.toLowerCase()] === "THEN") action = action.slice(aw.length).trim();
    if (!action) throw new JolsmError(`в 'если' нет действия: '${t}'`, no);
    const inner = parseStatement(no, action);
    if (inner.kind === "IF") throw new JolsmError("'если' нельзя вкладывать в 'если'", no);
    return { no, kind: "IF", raw: t, data: { left, rel: reltok, right, inner } };
  }

  const t2 = kw === "OP" ? rest : t;
  return { no, kind: "OP", raw: t, data: parseOpStatement(t2) as unknown as Record<string, unknown> };
}

interface Program {
  stmts: Stmt[];
  labels: Map<string, number>;
}

function compileProgram(code: string): Program {
  const lines = splitLines(code);
  const stmts: Stmt[] = [];
  const labels = new Map<string, number>();
  for (const ln of lines) {
    const idx = stmts.length;
    if (ln.label) {
      if (labels.has(ln.label)) throw new JolsmError(`метка '${ln.label}' уже определена`, ln.no);
      labels.set(ln.label, idx);
    }
    stmts.push(parseStatement(ln.no, ln.text));
  }
  return { stmts, labels };
}

// ── formatting ────────────────────────────────────────────────────────────
function fmtVal(name: string, val: bigint, width: number): string {
  const m = (1n << BigInt(width)) - 1n;
  const u = val & m;
  const signed = ((u >> BigInt(width - 1)) & 1n) === 1n ? u - (1n << BigInt(width)) : u;
  const b = u.toString(2).padStart(width, "0");
  return `${name} = ${b}b = $${u.toString(16).toUpperCase()} = ${u} (знак.: ${signed})`;
}

// ── public result types ───────────────────────────────────────────────────
export interface VarSnapshot {
  name: string;
  width: number;
  isMem: boolean;
  value?: string; // decimal, как строка (для отображения)
  binary?: string;
  hex?: string;
  cells?: string[];
}

export interface TraceEntry {
  line: number;
  text: string;
  vars: VarSnapshot[];
  printed?: string;
}

export interface JolsmResult {
  ok: boolean;
  errors: string[];
  output: string[];
  trace: TraceEntry[];
  final: VarSnapshot[];
  ended: string;
  steps: number;
}

function snapshotVars(m: Machine): VarSnapshot[] {
  return Array.from(m.vars.values()).map((v) => {
    if (v.isMem) {
      return { name: v.name, width: v.width, isMem: true, cells: v.cells.map((c) => c.toString()) };
    }
    const u = v.value & v.mask();
    return {
      name: v.name,
      width: v.width,
      isMem: false,
      value: u.toString(),
      binary: u.toString(2).padStart(v.width, "0"),
      hex: u.toString(16).toUpperCase(),
    };
  });
}

/** Выполняет микропрограмму JOLS-M. inputs — значения для команд ВВОД/INPUT по порядку. */
export function run(code: string, inputs: (string | number)[] = [], maxSteps = 200000): JolsmResult {
  const res: JolsmResult = { ok: true, errors: [], output: [], trace: [], final: [], ended: "", steps: 0 };
  let inPos = 0;

  let prog: Program;
  try {
    prog = compileProgram(code);
  } catch (e) {
    const err = e as JolsmError;
    res.ok = false;
    res.errors.push(`Ошибка компиляции${err.line ? ` (строка ${err.line})` : ""}: ${err.message}`);
    return res;
  }

  const m = new Machine();
  let pc = 0;
  let steps = 0;
  const callstack: number[] = [];
  const n = prog.stmts.length;

  function resolveLabel(lblIn: string, line: number): number {
    const lbl = lblIn.trim();
    if (prog.labels.has(lbl)) return prog.labels.get(lbl)!;
    if (/^-?\d+$|^\$[0-9A-Fa-f]+$|^#[01]+$/.test(lbl)) {
      const key = parseNumber(lbl).toString();
      if (prog.labels.has(key)) return prog.labels.get(key)!;
    }
    if (new RegExp(`^${IDENT}$`).test(lbl) && m.vars.has(lbl)) {
      const key = readOp(parseOperand(lbl, m), m).toString();
      if (prog.labels.has(key)) return prog.labels.get(key)!;
    }
    throw new JolsmError(`метка '${lbl}' не найдена`, line);
  }

  function execStmt(s: Stmt): number | null {
    switch (s.kind) {
      case "NOP":
        return null;
      case "DECL": {
        const decls = s.data.decls as { name: string; isMem: boolean; count: number; width: number }[];
        for (const d of decls) m.declare(d.name, d.width, d.isMem, d.count);
        return null;
      }
      case "INPUT": {
        const targets = s.data.targets as string[];
        for (const tg of targets) {
          const op = parseOperand(tg, m);
          let val: bigint;
          if (inPos < inputs.length) {
            const raw = inputs[inPos++];
            val = typeof raw === "number" ? BigInt(raw) : parseNumber(String(raw).trim());
          } else {
            val = 0n;
            res.trace.push({ line: s.no, text: `[ввод '${tg}' = 0 — нет данных]`, vars: [] });
          }
          writeOp(op, val, m);
        }
        return null;
      }
      case "PRINT": {
        const items = s.data.items as string[];
        const chunks: string[] = [];
        for (const itRaw of items) {
          const it = itRaw.trim();
          const sm = it.match(/^"(.*)"$|^'(.*)'$/);
          if (sm) {
            chunks.push(sm[1] !== undefined ? sm[1] : sm[2]);
            continue;
          }
          const op = parseOperand(it, m);
          if (op.kind === "var" && m.vars.get(op.name)?.isMem) {
            const v = m.vars.get(op.name)!;
            chunks.push(`${op.name}[0..${v.count - 1}] = ` + v.cells.join(" "));
          } else {
            const val = readOp(op, m);
            let w: number;
            if (op.kind === "bits") w = op.hi - op.lo + 1;
            else if (op.kind === "const") w = Math.max(1, val.toString(2).length);
            else w = m.getVar(op.name).width;
            chunks.push(fmtVal(it, val, w));
          }
        }
        res.output.push(chunks.join("  |  "));
        return null;
      }
      case "GOTO":
        return resolveLabel(s.data.label as string, s.no);
      case "CALL": {
        if (callstack.length >= STACK_LIMIT) throw new JolsmError("переполнение стека вызовов", s.no);
        callstack.push(pc + 1);
        return resolveLabel(s.data.label as string, s.no);
      }
      case "RETURN": {
        if (callstack.length === 0) {
          throw new JolsmError("возврат при пустом стеке — нет соответствующего вызова", s.no);
        }
        return callstack.pop()!;
      }
      case "DELAY":
        return null;
      case "END":
        res.ended = s.data.msg as string;
        return -1;
      case "IF": {
        const lo = parseOperand(s.data.left as string, m);
        const ro = parseOperand(s.data.right as string, m);
        const a = readOp(lo, m);
        const b = readOp(ro, m);
        const rel = s.data.rel as string;
        const ok =
          rel === "="
            ? a === b
            : rel === "<>" || rel === "!="
            ? a !== b
            : rel === "<"
            ? a < b
            : rel === ">"
            ? a > b
            : rel === "<="
            ? a <= b
            : a >= b;
        if (ok) return execStmt(s.data.inner as Stmt);
        return null;
      }
      case "OP": {
        const data = s.data as unknown as OpData;
        const dest = parseOperand(data.dest, m);
        const w = destWidth(dest, m);
        const cur = readOp(dest, m);
        if (data.opcode === "~") {
          writeOp(dest, ~cur & ((1n << BigInt(w)) - 1n), m);
        } else {
          const rhs = readOp(parseOperand(data.rhs!, m), m);
          writeOp(dest, applyOp(cur, data.opcode, rhs, w), m);
        }
        return null;
      }
      default:
        throw new JolsmError(`неизвестная команда '${s.kind}'`, s.no);
    }
  }

  try {
    while (pc >= 0 && pc < n) {
      steps += 1;
      if (steps > maxSteps) {
        throw new JolsmError(`превышен лимит шагов (${maxSteps}) — вероятен бесконечный цикл`);
      }
      const s = prog.stmts[pc];
      const outputBefore = res.output.length;
      const nxt = execStmt(s);
      if (s.kind !== "NOP") {
        res.trace.push({
          line: s.no,
          text: s.raw,
          vars: snapshotVars(m),
          printed: res.output.length > outputBefore ? res.output[res.output.length - 1] : undefined,
        });
      }
      if (nxt === -1) break;
      pc = nxt !== null ? nxt : pc + 1;
    }
    res.steps = steps;
  } catch (e) {
    const err = e as JolsmError;
    res.ok = false;
    const s = pc >= 0 && pc < n ? prog.stmts[pc] : null;
    const loc = err.line ? ` (строка ${err.line})` : s ? ` (строка ${s.no})` : "";
    res.errors.push(`Ошибка выполнения${loc}: ${err.message}`);
  }

  res.final = snapshotVars(m);
  return res;
}

/** Статическая проверка (без выполнения): необъявленные переменные, битовые поля вне разрядности,
 *  неопределённые метки, слишком широкие операнды. Пустой список — код корректен. */
export function validate(code: string): string[] {
  const out: string[] = [];
  let prog: Program;
  try {
    prog = compileProgram(code);
  } catch (e) {
    const err = e as JolsmError;
    return [`ОШИБКА компиляции${err.line ? ` (строка ${err.line})` : ""}: ${err.message}`];
  }

  const m = new Machine();
  for (const s of prog.stmts) {
    if (s.kind === "DECL") {
      const decls = s.data.decls as { name: string; isMem: boolean; count: number; width: number }[];
      for (const d of decls) {
        try {
          m.declare(d.name, d.width, d.isMem, d.count);
        } catch (e) {
          out.push(`ОШИБКА (строка ${s.no}): ${(e as Error).message}`);
        }
      }
    }
  }

  function widthOf(op: Operand | null): number | null {
    if (!op) return null;
    if (op.kind === "bits") return op.hi - op.lo + 1;
    if ((op.kind === "var" || op.kind === "cell") && m.vars.has(op.name)) return m.vars.get(op.name)!.width;
    return null;
  }

  function chkOperand(opstr: string, no: number): Operand | null {
    let op: Operand;
    try {
      op = parseOperand(opstr, m);
    } catch (e) {
      out.push(`ОШИБКА (строка ${no}): ${(e as Error).message}`);
      return null;
    }
    if (op.kind === "const") return op;
    if (!m.vars.has(op.name)) {
      out.push(`ОШИБКА (строка ${no}): необъявленная переменная '${op.name}'`);
      return op;
    }
    const v = m.vars.get(op.name)!;
    if (op.kind === "bits") {
      if (v.isMem) out.push(`ОШИБКА (строка ${no}): '${op.name}' — массив памяти, битовое поле недопустимо`);
      else if (op.hi >= v.width)
        out.push(
          `ОШИБКА (строка ${no}): бит ${op.hi} вне разрядности '${op.name}' — допустимо 0..${v.width - 1}; увеличьте разрядность`
        );
    } else if (op.kind === "cell") {
      if (!v.isMem) out.push(`ОШИБКА (строка ${no}): '${op.name}' — не массив памяти, индексация недопустима`);
      else if (op.index!.kind === "const" && !(op.index!.const >= 0n && op.index!.const < BigInt(v.count)))
        out.push(`ОШИБКА (строка ${no}): индекс ${op.index!.const} вне памяти '${op.name}' (0..${v.count - 1})`);
    }
    return op;
  }

  function chkConstFits(cval: bigint, destOp: Operand | null, no: number) {
    const w = widthOf(destOp);
    if (w === null) return;
    const lo = cval < 0n ? -(1n << BigInt(w - 1)) : 0n;
    const hi = (1n << BigInt(w)) - 1n;
    if (!(lo <= cval && cval <= hi)) {
      out.push(
        `ПРЕДУПРЕЖДЕНИЕ (строка ${no}): константа ${cval} не помещается в ${w}-битный приёмник — будет усечена по модулю 2^${w}; увеличьте разрядность приёмника`
      );
    }
  }

  function chkLabel(tgtIn: string, no: number) {
    const tgt = tgtIn.trim();
    if (/^-?\d+$|^\$[0-9A-Fa-f]+$|^#[01]+$/.test(tgt)) {
      if (!prog.labels.has(parseNumber(tgt).toString())) {
        out.push(`ОШИБКА (строка ${no}): метка '${tgt}' не определена`);
      }
    } else if (new RegExp(`^${IDENT}$`).test(tgt)) {
      if (!prog.labels.has(tgt) && !m.vars.has(tgt)) {
        out.push(`ОШИБКА (строка ${no}): метка/переменная '${tgt}' не определена`);
      }
    } else {
      out.push(`ОШИБКА (строка ${no}): некорректная цель перехода '${tgt}'`);
    }
  }

  function checkOne(s: Stmt) {
    if (s.kind === "DECL" || s.kind === "NOP" || s.kind === "RETURN" || s.kind === "DELAY" || s.kind === "END") return;
    if (s.kind === "GOTO" || s.kind === "CALL") {
      chkLabel(s.data.label as string, s.no);
      return;
    }
    if (s.kind === "INPUT") {
      for (const tg of s.data.targets as string[]) chkOperand(tg, s.no);
      return;
    }
    if (s.kind === "PRINT") {
      for (const it of s.data.items as string[]) {
        if (/^\s*(".*"|'.*')\s*$/.test(it)) continue;
        chkOperand(it.trim(), s.no);
      }
      return;
    }
    if (s.kind === "IF") {
      chkOperand(s.data.left as string, s.no);
      chkOperand(s.data.right as string, s.no);
      checkOne(s.data.inner as Stmt);
      return;
    }
    if (s.kind === "OP") {
      const data = s.data as unknown as OpData;
      const dest = chkOperand(data.dest, s.no);
      if (data.opcode === "~") return;
      const rhs = chkOperand(data.rhs!, s.no);
      if (rhs === null || dest === null) return;
      if (rhs.kind === "const") {
        chkConstFits(rhs.invert ? ~rhs.const : rhs.const, dest, s.no);
      } else {
        const dw = widthOf(dest);
        const rw = widthOf(rhs);
        if (dw !== null && rw !== null && rw > dw) {
          out.push(
            `ПРЕДУПРЕЖДЕНИЕ (строка ${s.no}): операнд '${data.rhs}' (${rw} бит) шире приёмника '${data.dest}' (${dw} бит) — возможна потеря старших разрядов`
          );
        }
      }
    }
  }

  for (const s of prog.stmts) checkOne(s);
  return out;
}
