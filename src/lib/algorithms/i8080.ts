/**
 * Intel 8080 (КР580ВМ80) — ассемблер подмножества команд и симулятор для
 * лабораторных «Проектування мікропроцесорних систем»: листинг «адреса —
 * код — мнемокод», контрольная сумма (директива КС стенда) и результат
 * выполнения в регистрах и памяти.
 */

const R8: Record<string, number> = { B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7 };
const RP: Record<string, number> = { B: 0, D: 1, H: 2, SP: 3, PSW: 3 };

const ALU_R: Record<string, number> = { ADD: 0x80, ADC: 0x88, SUB: 0x90, SBB: 0x98, ANA: 0xa0, XRA: 0xa8, ORA: 0xb0, CMP: 0xb8 };
const ALU_I: Record<string, number> = { ADI: 0xc6, ACI: 0xce, SUI: 0xd6, SBI: 0xde, ANI: 0xe6, XRI: 0xee, ORI: 0xf6, CPI: 0xfe };
const JUMP: Record<string, number> = { JMP: 0xc3, JNZ: 0xc2, JZ: 0xca, JNC: 0xd2, JC: 0xda, JPO: 0xe2, JPE: 0xea, JP: 0xf2, JM: 0xfa, CALL: 0xcd };
const ADDR16: Record<string, number> = { LDA: 0x3a, STA: 0x32, LHLD: 0x2a, SHLD: 0x22 };
const SINGLE: Record<string, number> = { NOP: 0x00, HLT: 0x76, RET: 0xc9, XCHG: 0xeb, EI: 0xfb, DI: 0xf3, RLC: 0x07, RRC: 0x0f, RAL: 0x17, RAR: 0x1f, CMA: 0x2f, STC: 0x37, CMC: 0x3f, DAA: 0x27 };

export interface Line {
  addr: number;
  bytes: number[];
  label?: string;
  text: string;
  comment?: string;
}

export interface Program {
  lines: Line[];
  mem: Map<number, number>;
  labels: Record<string, number>;
  entry: number;
}

function num(tok: string, labels: Record<string, number>): number {
  const t = tok.trim();
  if (labels[t.toUpperCase()] !== undefined) return labels[t.toUpperCase()];
  const m = /^([0-9][0-9A-F]*)H$/i.exec(t);
  if (m) return parseInt(m[1], 16);
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (/^'.'$/.test(t)) return t.charCodeAt(1);
  throw new Error(`Невідоме значення «${t}»`);
}

/**
 * Два прохода: метки, затем коды. Строка: [МЕТКА:] МНЕМО операнды [; комментарий];
 * метка перед DB/DS допускается без двоеточия. entry — первая команда после данных.
 */
export function assemble(src: string): Program {
  const rows = src
    .split("\n")
    .map((raw) => {
      const semi = raw.indexOf(";");
      const code = (semi >= 0 ? raw.slice(0, semi) : raw).trim();
      const comment = semi >= 0 ? raw.slice(semi + 1).trim() : undefined;
      return { code, comment };
    })
    .filter((r) => r.code || r.comment);
  const parse = (code: string) => {
    let label: string | undefined;
    let rest = code;
    const lm = /^([A-Za-z_][\w]*):\s*(.*)$/.exec(rest);
    if (lm) {
      label = lm[1].toUpperCase();
      rest = lm[2];
    } else {
      const dm = /^([A-Za-z_][\w]*)\s+(DB|DS)\s+(.*)$/i.exec(rest);
      if (dm && !(dm[1].toUpperCase() in SINGLE)) {
        label = dm[1].toUpperCase();
        rest = `${dm[2]} ${dm[3]}`;
      }
    }
    const sp = rest.search(/\s/);
    const op = (sp < 0 ? rest : rest.slice(0, sp)).toUpperCase();
    const args = sp < 0 ? [] : rest.slice(sp + 1).split(",").map((s) => s.trim()).filter(Boolean);
    return { label, op, args };
  };
  const size = (op: string, args: string[]): number => {
    if (!op) return 0;
    if (op === "ORG") return 0;
    if (op === "DB") return args.length;
    if (op === "DS") return 0; // размер считается отдельно
    if (op === "MVI" || op in ALU_I || op === "IN" || op === "OUT") return 2;
    if (op === "LXI" || op in JUMP || op in ADDR16) return 3;
    return 1;
  };
  const labels: Record<string, number> = {};
  let pc = 0;
  for (const r of rows) {
    const p = parse(r.code);
    if (p.label) labels[p.label] = pc;
    if (p.op === "ORG") pc = num(p.args[0], labels);
    else if (p.op === "DS") pc += num(p.args[0], labels);
    else pc += size(p.op, p.args);
  }
  const lines: Line[] = [];
  const mem = new Map<number, number>();
  let entry = -1;
  pc = 0;
  for (const r of rows) {
    const p = parse(r.code);
    const start = pc;
    let bytes: number[] = [];
    const op = p.op;
    const a = p.args;
    const lo = (v: number) => v & 0xff;
    const hi = (v: number) => (v >> 8) & 0xff;
    if (!op) {
      lines.push({ addr: pc, bytes: [], text: "", comment: r.comment });
      continue;
    }
    if (op === "ORG") {
      pc = num(a[0], labels);
      lines.push({ addr: pc, bytes: [], text: r.code, comment: r.comment });
      continue;
    }
    if (op === "DS") {
      const n = num(a[0], labels);
      lines.push({ addr: pc, bytes: [], label: p.label, text: r.code, comment: r.comment });
      pc += n;
      continue;
    }
    if (op === "DB") bytes = a.map((x) => num(x, labels) & 0xff);
    else if (op === "MOV") bytes = [0x40 | (R8[a[0].toUpperCase()] << 3) | R8[a[1].toUpperCase()]];
    else if (op === "MVI") bytes = [0x06 | (R8[a[0].toUpperCase()] << 3), lo(num(a[1], labels))];
    else if (op === "LXI") {
      const v = num(a[1], labels);
      bytes = [0x01 | (RP[a[0].toUpperCase()] << 4), lo(v), hi(v)];
    } else if (op in ADDR16) {
      const v = num(a[0], labels);
      bytes = [ADDR16[op], lo(v), hi(v)];
    } else if (op in JUMP) {
      const v = num(a[0], labels);
      bytes = [JUMP[op], lo(v), hi(v)];
    } else if (op === "INR") bytes = [0x04 | (R8[a[0].toUpperCase()] << 3)];
    else if (op === "DCR") bytes = [0x05 | (R8[a[0].toUpperCase()] << 3)];
    else if (op === "INX") bytes = [0x03 | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "DCX") bytes = [0x0b | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "DAD") bytes = [0x09 | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "PUSH") bytes = [0xc5 | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "POP") bytes = [0xc1 | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "STAX") bytes = [0x02 | (RP[a[0].toUpperCase()] << 4)];
    else if (op === "LDAX") bytes = [0x0a | (RP[a[0].toUpperCase()] << 4)];
    else if (op in ALU_R) bytes = [ALU_R[op] | R8[a[0].toUpperCase()]];
    else if (op in ALU_I) bytes = [ALU_I[op], lo(num(a[0], labels))];
    else if (op === "IN") bytes = [0xdb, lo(num(a[0], labels))];
    else if (op === "OUT") bytes = [0xd3, lo(num(a[0], labels))];
    else if (op in SINGLE) bytes = [SINGLE[op]];
    else throw new Error(`Невідома команда «${op}»`);
    if (bytes.some((b) => Number.isNaN(b))) throw new Error(`Невірний операнд у «${r.code}»`);
    if (op !== "DB" && entry < 0) entry = start;
    bytes.forEach((b, i) => mem.set(start + i, b));
    lines.push({ addr: start, bytes, label: p.label, text: r.code.replace(/^([A-Za-z_]\w*):\s*/, ""), comment: r.comment });
    pc += bytes.length;
  }
  return { lines, mem, labels, entry };
}

/** Сумма байтов диапазона «без учёта переполнения» — 16 бит и младший байт. */
export function checksum(mem: Map<number, number>, from: number, to: number) {
  let s = 0;
  for (let a = from; a <= to; a++) s += mem.get(a) ?? 0;
  return { s16: s & 0xffff, s8: s & 0xff };
}

export interface Cpu {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  h: number;
  l: number;
  sp: number;
  pc: number;
  f: { s: boolean; z: boolean; ac: boolean; p: boolean; cy: boolean };
  mem: Map<number, number>;
  steps: number;
}

const parity = (v: number) => {
  let x = v;
  x ^= x >> 4;
  x ^= x >> 2;
  x ^= x >> 1;
  return (x & 1) === 0;
};

/** Выполнение до HLT (или limit команд). Реализованы команды, которые умеет ассемблер. */
export function run(prog: Program, init: Partial<Pick<Cpu, "a" | "b" | "c" | "d" | "e" | "h" | "l">> = {}, limit = 10000): Cpu {
  const mem = new Map(prog.mem);
  const cpu: Cpu = { a: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0, sp: 0x0bb0, pc: prog.entry, f: { s: false, z: false, ac: false, p: false, cy: false }, mem, steps: 0, ...init };
  const rd = (ad: number) => mem.get(ad & 0xffff) ?? 0;
  const wr = (ad: number, v: number) => mem.set(ad & 0xffff, v & 0xff);
  const hl = () => (cpu.h << 8) | cpu.l;
  const getR = (i: number) => [cpu.b, cpu.c, cpu.d, cpu.e, cpu.h, cpu.l, rd(hl()), cpu.a][i];
  const setR = (i: number, v: number) => {
    v &= 0xff;
    if (i === 0) cpu.b = v;
    else if (i === 1) cpu.c = v;
    else if (i === 2) cpu.d = v;
    else if (i === 3) cpu.e = v;
    else if (i === 4) cpu.h = v;
    else if (i === 5) cpu.l = v;
    else if (i === 6) wr(hl(), v);
    else cpu.a = v;
  };
  const getRP = (i: number) => [(cpu.b << 8) | cpu.c, (cpu.d << 8) | cpu.e, hl(), cpu.sp][i];
  const setRP = (i: number, v: number) => {
    v &= 0xffff;
    if (i === 0) [cpu.b, cpu.c] = [v >> 8, v & 0xff];
    else if (i === 1) [cpu.d, cpu.e] = [v >> 8, v & 0xff];
    else if (i === 2) [cpu.h, cpu.l] = [v >> 8, v & 0xff];
    else cpu.sp = v;
  };
  const szp = (v: number) => {
    cpu.f.s = (v & 0x80) !== 0;
    cpu.f.z = (v & 0xff) === 0;
    cpu.f.p = parity(v & 0xff);
  };
  const alu = (kind: number, v: number) => {
    const a = cpu.a;
    let r: number;
    switch (kind) {
      case 0: // ADD
      case 1: {
        const c = kind === 1 && cpu.f.cy ? 1 : 0;
        r = a + v + c;
        cpu.f.ac = ((a & 0xf) + (v & 0xf) + c) > 0xf;
        cpu.f.cy = r > 0xff;
        cpu.a = r & 0xff;
        szp(cpu.a);
        return;
      }
      case 2: // SUB
      case 3:
      case 7: {
        const c = kind === 3 && cpu.f.cy ? 1 : 0;
        r = a - v - c;
        cpu.f.ac = (a & 0xf) - (v & 0xf) - c >= 0;
        cpu.f.cy = r < 0;
        szp(r & 0xff);
        if (kind !== 7) cpu.a = r & 0xff;
        return;
      }
      case 4:
        cpu.f.ac = ((a | v) & 0x08) !== 0;
        cpu.a = a & v;
        cpu.f.cy = false;
        szp(cpu.a);
        return;
      case 5:
        cpu.a = a ^ v;
        cpu.f.cy = cpu.f.ac = false;
        szp(cpu.a);
        return;
      case 6:
        cpu.a = a | v;
        cpu.f.cy = cpu.f.ac = false;
        szp(cpu.a);
        return;
    }
  };
  const cond = (c: number) => [!cpu.f.z, cpu.f.z, !cpu.f.cy, cpu.f.cy, !cpu.f.p, cpu.f.p, !cpu.f.s, cpu.f.s][c];
  while (cpu.steps < limit) {
    const op = rd(cpu.pc);
    const b1 = rd(cpu.pc + 1);
    const w = b1 | (rd(cpu.pc + 2) << 8);
    cpu.steps++;
    if (op === 0x76) break;
    if (op >= 0x40 && op <= 0x7f) {
      setR((op >> 3) & 7, getR(op & 7));
      cpu.pc += 1;
    } else if ((op & 0xc7) === 0x06) {
      setR((op >> 3) & 7, b1);
      cpu.pc += 2;
    } else if ((op & 0xcf) === 0x01) {
      setRP((op >> 4) & 3, w);
      cpu.pc += 3;
    } else if (op === 0x3a) {
      cpu.a = rd(w);
      cpu.pc += 3;
    } else if (op === 0x32) {
      wr(w, cpu.a);
      cpu.pc += 3;
    } else if (op === 0x2a) {
      cpu.l = rd(w);
      cpu.h = rd(w + 1);
      cpu.pc += 3;
    } else if (op === 0x22) {
      wr(w, cpu.l);
      wr(w + 1, cpu.h);
      cpu.pc += 3;
    } else if ((op & 0xc7) === 0x04 || (op & 0xc7) === 0x05) {
      const i = (op >> 3) & 7;
      const v = getR(i);
      const r = (op & 1 ? v - 1 : v + 1) & 0xff;
      cpu.f.ac = op & 1 ? (v & 0xf) !== 0 : (v & 0xf) === 0xf;
      setR(i, r);
      szp(r);
      cpu.pc += 1;
    } else if ((op & 0xcf) === 0x03 || (op & 0xcf) === 0x0b) {
      const i = (op >> 4) & 3;
      setRP(i, getRP(i) + (op & 8 ? -1 : 1));
      cpu.pc += 1;
    } else if ((op & 0xcf) === 0x09) {
      const r = hl() + getRP((op >> 4) & 3);
      cpu.f.cy = r > 0xffff;
      setRP(2, r);
      cpu.pc += 1;
    } else if (op >= 0x80 && op <= 0xbf) {
      alu((op >> 3) & 7, getR(op & 7));
      cpu.pc += 1;
    } else if ((op & 0xc7) === 0xc6) {
      alu((op >> 3) & 7, b1);
      cpu.pc += 2;
    } else if (op === 0xcd) {
      cpu.sp = (cpu.sp - 2) & 0xffff;
      wr(cpu.sp, (cpu.pc + 3) & 0xff);
      wr(cpu.sp + 1, ((cpu.pc + 3) >> 8) & 0xff);
      cpu.pc = w;
    } else if (op === 0xc9) {
      cpu.pc = rd(cpu.sp) | (rd(cpu.sp + 1) << 8);
      cpu.sp = (cpu.sp + 2) & 0xffff;
    } else if ((op & 0xcf) === 0xc5 || (op & 0xcf) === 0xc1) {
      const i = (op >> 4) & 3;
      const psw = () => (cpu.a << 8) | (cpu.f.s ? 0x80 : 0) | (cpu.f.z ? 0x40 : 0) | (cpu.f.ac ? 0x10 : 0) | (cpu.f.p ? 0x04 : 0) | 0x02 | (cpu.f.cy ? 1 : 0);
      if ((op & 0xcf) === 0xc5) {
        const v = i === 3 ? psw() : getRP(i);
        cpu.sp = (cpu.sp - 2) & 0xffff;
        wr(cpu.sp, v & 0xff);
        wr(cpu.sp + 1, v >> 8);
      } else {
        const v = rd(cpu.sp) | (rd(cpu.sp + 1) << 8);
        cpu.sp = (cpu.sp + 2) & 0xffff;
        if (i === 3) {
          cpu.a = v >> 8;
          cpu.f = { s: !!(v & 0x80), z: !!(v & 0x40), ac: !!(v & 0x10), p: !!(v & 0x04), cy: !!(v & 1) };
        } else setRP(i, v);
      }
      cpu.pc += 1;
    } else if (op === 0xc3) cpu.pc = w;
    else if ((op & 0xc7) === 0xc2) cpu.pc = cond((op >> 3) & 7) ? w : cpu.pc + 3;
    else if (op === 0xeb) {
      [cpu.d, cpu.e, cpu.h, cpu.l] = [cpu.h, cpu.l, cpu.d, cpu.e];
      cpu.pc += 1;
    } else if (op === 0x2f) {
      cpu.a = ~cpu.a & 0xff;
      cpu.pc += 1;
    } else if (op === 0x00 || op === 0xfb || op === 0xf3) cpu.pc += 1;
    else throw new Error(`Команда ${op.toString(16)}h не підтримується симулятором`);
  }
  return cpu;
}

export const hx = (v: number, w = 2) => v.toString(16).toUpperCase().padStart(w, "0");
/** Операнд для асемблера: шістнадцяткове число, що починається з літери, пишеться з провідним 0 (0D2h). */
export const asmHex = (v: number, w = 2) => {
  const h = hx(v, w);
  return /^[A-F]/.test(h) ? `0${h}h` : `${h}h`;
};

/** Листинг «Адреса / Код / Мнемокод / Коментар» — по байту в строке, как в методичке. */
export function listing(p: Program): (string | number)[][] {
  const rows: (string | number)[][] = [];
  for (const l of p.lines) {
    if (!l.bytes.length) continue;
    const text = l.label && !new RegExp(`^${l.label}\\s`, "i").test(l.text) ? `${l.label}: ${l.text}` : l.text;
    l.bytes.forEach((b, i) => rows.push([`${hx(l.addr + i, 4)}h`, hx(b), i === 0 ? text : "", i === 0 ? (l.comment ?? "") : ""]));
  }
  return rows;
}

// ------------------------------------------------ ППА Intel 8255A (ЛР 5)

export type PortMode = "sync" | "async" | "bidir";
export type Dir = "in" | "out";

export interface PpiConfig {
  aMode: PortMode;
  aDir: Dir;
  bMode: "sync" | "async";
  bDir: Dir;
  cUpper: Dir;
  cLower: Dir;
}

/** Управляющее слово режима (D7 = 1): «синхр» — режим 0, «асинхр» — режим 1 (стробируемый), «ввод/вивід» — режим 2. */
export function ppiControlWord(c: PpiConfig): number {
  const aMode = c.aMode === "sync" ? 0 : c.aMode === "async" ? 1 : 2;
  // у режимі 2 біт D4 байдужий — 0, як у прикладі методички (C2h)
  return 0x80 | (aMode << 5) | ((c.aMode !== "bidir" && c.aDir === "in" ? 1 : 0) << 4) | ((c.cUpper === "in" ? 1 : 0) << 3) | ((c.bMode === "async" ? 1 : 0) << 2) | ((c.bDir === "in" ? 1 : 0) << 1) | (c.cLower === "in" ? 1 : 0);
}

/** Слово побитовой установки/сброса линии PCn (D7 = 0). */
export const ppiBsr = (bit: number, set: boolean) => ((bit & 7) << 1) | (set ? 1 : 0);

/** Линии порта C, занятые квитированием, и биты INTE (управляются BSR). */
export function ppiHandshake(c: PpiConfig) {
  const lines: { bit: number; name: string; role: string }[] = [];
  const inte: { bit: number; name: string }[] = [];
  if (c.aMode === "bidir") {
    lines.push({ bit: 7, name: "OBFA̅", role: "буфер виводу A заповнений (вихід)" }, { bit: 6, name: "ACKA̅", role: "підтвердження прийому (вхід)" }, { bit: 5, name: "IBFA", role: "буфер вводу A заповнений (вихід)" }, { bit: 4, name: "STBA̅", role: "строб вводу (вхід)" }, { bit: 3, name: "INTRA", role: "запит переривання (вихід)" });
    inte.push({ bit: 6, name: "INTE1 (вивід)" }, { bit: 4, name: "INTE2 (ввід)" });
  } else if (c.aMode === "async") {
    if (c.aDir === "in") {
      lines.push({ bit: 5, name: "IBFA", role: "буфер вводу A заповнений (вихід)" }, { bit: 4, name: "STBA̅", role: "строб вводу (вхід)" }, { bit: 3, name: "INTRA", role: "запит переривання (вихід)" });
      inte.push({ bit: 4, name: "INTE A" });
    } else {
      lines.push({ bit: 7, name: "OBFA̅", role: "буфер виводу A заповнений (вихід)" }, { bit: 6, name: "ACKA̅", role: "підтвердження прийому (вхід)" }, { bit: 3, name: "INTRA", role: "запит переривання (вихід)" });
      inte.push({ bit: 6, name: "INTE A" });
    }
  }
  if (c.bMode === "async") {
    if (c.bDir === "in") lines.push({ bit: 2, name: "STBB̅", role: "строб вводу (вхід)" }, { bit: 1, name: "IBFB", role: "буфер вводу B заповнений (вихід)" }, { bit: 0, name: "INTRB", role: "запит переривання (вихід)" });
    else lines.push({ bit: 2, name: "ACKB̅", role: "підтвердження прийому (вхід)" }, { bit: 1, name: "OBFB̅", role: "буфер виводу B заповнений (вихід)" }, { bit: 0, name: "INTRB", role: "запит переривання (вихід)" });
    inte.push({ bit: 2, name: "INTE B" });
  }
  return { lines: lines.sort((x, y) => y.bit - x.bit), inte };
}
