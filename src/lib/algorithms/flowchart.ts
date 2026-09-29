/**
 * Структурні блок-схеми за ДСТУ ISO 5807:2016 (ISO 5807:1985; раніше
 * ГОСТ 19.701-90): термінатор, введення-виведення, процес, рішення,
 * з'єднувач. Один вхід «Початок» і один вихід «Кінець»: дострокові виходи
 * ведуть через з'єднувач «А» до спільного термінатора; блоки мають наскрізну
 * нумерацію в лівому верхньому куті. Розміщення — рекурсивне: послідовність,
 * розгалуження (гілки ліворуч і праворуч, як на рисунках методичок), цикли з
 * перед- і післяумовою, нескінченний цикл з виходом із тіла.
 */

export type Flow =
  | { t: "seq"; items: Flow[] }
  | { t: "start" | "end"; text: string }
  | { t: "io"; text: string }
  | { t: "op"; text: string }
  | { t: "if"; cond: string; yes: Flow; no?: Flow; yesLabel?: string; noLabel?: string }
  | { t: "while"; cond: string; body: Flow; yesLabel?: string; noLabel?: string }
  | { t: "until"; body: Flow; cond: string; yesLabel?: string; noLabel?: string }
  /** Нескінченний цикл: вихід — лише через EXIT усередині тіла. */
  | { t: "loop"; body: Flow }
  /** Достроковий вихід: з'єднувач, що веде до спільного «Кінець». */
  | { t: "exit" }
  /** Вхідний з'єднувач перед «Кінець»: сюди сходяться всі EXIT. */
  | { t: "join" };

export const seq = (...items: (Flow | false | null | undefined)[]): Flow => ({ t: "seq", items: items.filter(Boolean) as Flow[] });
export const op = (text: string): Flow => ({ t: "op", text });
export const io = (text: string): Flow => ({ t: "io", text });
export const END: Flow = { t: "end", text: "Кінець" };
export const EXIT: Flow = { t: "exit" };
export const JOIN: Flow = { t: "join" };
const CONN = "А";
const R = 11;

/** Гілка далі не продовжується (кінець, вихід через з'єднувач, нескінченний цикл) — з неї немає злиття. */
function terminates(f: Flow): boolean {
  if (f.t === "end" || f.t === "exit" || f.t === "loop") return true;
  if (f.t === "seq") return f.items.length > 0 && terminates(f.items[f.items.length - 1]);
  if (f.t === "if") return !!f.no && terminates(f.yes) && terminates(f.no);
  return false;
}

export type Shape =
  | { k: "term" | "op" | "io"; x: number; y: number; w: number; h: number; lines: string[] }
  | { k: "dec"; x: number; y: number; w: number; h: number; lines: string[] }
  | { k: "line"; pts: [number, number][]; arrow?: boolean }
  | { k: "label"; x: number; y: number; text: string; anchor?: "start" | "end" | "middle" }
  | { k: "conn"; x: number; y: number; text: string }
  | { k: "num"; x: number; y: number; text: string };

interface Box {
  w: number;
  h: number;
  /** x входу/виходу відносно лівого краю */
  cx: number;
  shapes: Shape[];
}

const CH = 6.6; // ширина символу при 11 px
const LINE_H = 14;
const GAP = 22;
const SIDE = 26;

function wrap(text: string, max = 30): string[] {
  const out: string[] = [];
  for (const part of text.split("\n")) {
    let cur = "";
    for (const w of part.split(" ")) {
      if ((cur + " " + w).trim().length > max && cur) {
        out.push(cur);
        cur = w;
      } else cur = (cur + " " + w).trim();
    }
    if (cur) out.push(cur);
  }
  return out;
}

function shift(shapes: Shape[], dx: number, dy: number): Shape[] {
  return shapes.map((s) => {
    if (s.k === "line") return { ...s, pts: s.pts.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
    return { ...s, x: s.x + dx, y: s.y + dy };
  });
}

/** З'єднувач виходу: коло «А» під гілкою. */
function exitBox(): Box {
  return { w: 2 * R + 4, h: 2 * R, cx: R + 2, shapes: [{ k: "conn", x: R + 2, y: R, text: CONN }] };
}

/** Вхідний з'єднувач «А» ліворуч від лінії: вливається в неї над «Кінець». */
function joinBox(fromAbove: boolean): Box {
  const cx = 3 * R + 20;
  const y = R + 4;
  const shapes: Shape[] = [
    { k: "conn", x: R + 2, y, text: CONN },
    { k: "line", pts: [[2 * R + 2, y], [cx, y]], arrow: true },
  ];
  if (fromAbove) shapes.push({ k: "line", pts: [[cx, 0], [cx, y]] });
  shapes.push({ k: "line", pts: [[cx, y], [cx, 2 * y]] });
  return { w: cx + 10, h: 2 * y, cx, shapes };
}

function block(k: "term" | "op" | "io", text: string): Box {
  const lines = wrap(text);
  const w = Math.max(k === "term" ? 110 : 150, Math.max(...lines.map((l) => l.length)) * CH + (k === "io" ? 40 : 24));
  const h = Math.max(34, lines.length * LINE_H + 16);
  return { w, h, cx: w / 2, shapes: [{ k, x: 0, y: 0, w, h, lines }] };
}

function decision(cond: string): Box {
  const lines = wrap(cond, 22);
  const w = Math.max(150, Math.max(...lines.map((l) => l.length)) * CH * 1.7 + 30);
  const h = Math.max(54, lines.length * LINE_H * 1.6 + 26);
  return { w, h, cx: w / 2, shapes: [{ k: "dec", x: 0, y: 0, w, h, lines }] };
}

function layout(f: Flow): Box {
  switch (f.t) {
    case "start":
    case "end":
      return block("term", f.text);
    case "op":
      return block("op", f.text);
    case "exit":
      return exitBox();
    case "join":
      return joinBox(true);
    case "io":
      return block("io", f.text);
    case "seq": {
      // після термінатора послідовність не продовжується
      const cut = f.items.findIndex((x) => x.t === "end");
      const items = cut >= 0 && cut < f.items.length - 1 ? f.items.slice(0, cut + 1) : f.items;
      const boxes = items.map((x, i) => (x.t === "join" ? joinBox(i > 0 && !terminates(items[i - 1])) : layout(x)));
      if (!boxes.length) return { w: 10, h: 0, cx: 5, shapes: [] };
      const left = Math.max(...boxes.map((b) => b.cx));
      const right = Math.max(...boxes.map((b) => b.w - b.cx));
      const shapes: Shape[] = [];
      let y = 0;
      boxes.forEach((b, i) => {
        if (i > 0 && !terminates(items[i - 1]) && items[i].t !== "join") {
          shapes.push({ k: "line", pts: [[left, y], [left, y + GAP]], arrow: true });
          y += GAP;
        }
        shapes.push(...shift(b.shapes, left - b.cx, y));
        y += b.h;
      });
      return { w: left + right, h: y, cx: left, shapes };
    }
    case "if": {
      const d = decision(f.cond);
      const a = layout(f.yes);
      const b = f.no ? layout(f.no) : null;
      // гілки — під лівою («так») і правою («ні») вершинами ромба; розсуваються, лише якщо перекриваються
      const L = d.w / 2;
      let ax = -L;
      let bx = L;
      const need = a.w - a.cx + (b ? b.cx : 0) + SIDE - 2 * L;
      if (need > 0) {
        ax -= need / 2;
        bx += need / 2;
      }
      const minX = Math.min(ax - a.cx, -L) - 4;
      const maxX = Math.max(b ? bx + b.w - b.cx : bx, L) + 4;
      const cx = -minX;
      const w = maxX - minX;
      const AX = ax + cx;
      const BX = bx + cx;
      const top = d.h / 2;
      const branchY = d.h + GAP / 2;
      const shapes: Shape[] = [...shift(d.shapes, cx - L, 0)];
      shapes.push({ k: "line", pts: [[cx - L, top], [AX, top], [AX, branchY]], arrow: true });
      shapes.push({ k: "label", x: cx - L - 4, y: top - 5, text: f.yesLabel ?? "так", anchor: "end" });
      shapes.push({ k: "line", pts: [[cx + L, top], [BX, top], [BX, branchY]], arrow: !!b });
      shapes.push({ k: "label", x: cx + L + 4, y: top - 5, text: f.noLabel ?? "ні" });
      shapes.push(...shift(a.shapes, AX - a.cx, branchY));
      if (b) shapes.push(...shift(b.shapes, BX - b.cx, branchY));
      const h1 = branchY + a.h;
      const h2 = branchY + (b ? b.h : 0);
      const merge = Math.max(h1, h2) + GAP / 2;
      if (!terminates(f.yes)) shapes.push({ k: "line", pts: [[AX, h1], [AX, merge], [cx, merge]] });
      if (!(b && terminates(f.no!))) shapes.push({ k: "line", pts: [[BX, h2], [BX, merge], [cx, merge]] });
      return { w, h: merge, cx, shapes };
    }
    case "while": {
      // ромб угорі; тіло під ним (гілка «так»), повернення ліворуч, вихід праворуч
      const d = decision(f.cond);
      const body = layout(f.body);
      const inner = Math.max(d.w / 2, body.cx);
      const cx = SIDE + inner;
      const w = cx + Math.max(d.w / 2, body.w - body.cx) + SIDE;
      const y0 = GAP / 2;
      const shapes: Shape[] = [{ k: "line", pts: [[cx, 0], [cx, y0]], arrow: true }, ...shift(d.shapes, cx - d.w / 2, y0)];
      const by = y0 + d.h + GAP;
      shapes.push({ k: "line", pts: [[cx, y0 + d.h], [cx, by]], arrow: true });
      shapes.push({ k: "label", x: cx + 5, y: y0 + d.h + 13, text: f.yesLabel ?? "так" });
      shapes.push(...shift(body.shapes, cx - body.cx, by));
      const end = by + body.h;
      shapes.push({ k: "line", pts: [[cx, end], [cx, end + GAP / 2], [SIDE / 2, end + GAP / 2], [SIDE / 2, y0 / 2], [cx, y0 / 2]], arrow: true });
      const out = end + GAP;
      shapes.push({ k: "line", pts: [[cx + d.w / 2, y0 + d.h / 2], [w - SIDE / 2, y0 + d.h / 2], [w - SIDE / 2, out], [cx, out]] });
      shapes.push({ k: "label", x: cx + d.w / 2 + 4, y: y0 + d.h / 2 - 5, text: f.noLabel ?? "ні" });
      return { w, h: out, cx, shapes };
    }
    case "loop": {
      // тіло й безумовне повернення ліворуч на його початок
      const body = layout(f.body);
      const cx = SIDE + body.cx;
      const w = cx + (body.w - body.cx) + SIDE / 2;
      const y0 = GAP / 2;
      const shapes: Shape[] = [{ k: "line", pts: [[cx, 0], [cx, y0]], arrow: true }, ...shift(body.shapes, cx - body.cx, y0)];
      const end = y0 + body.h;
      if (!terminates(f.body)) shapes.push({ k: "line", pts: [[cx, end], [cx, end + GAP / 2], [SIDE / 2, end + GAP / 2], [SIDE / 2, y0 / 2], [cx, y0 / 2]], arrow: true });
      return { w, h: end + GAP / 2, cx, shapes };
    }
    case "until": {
      // тіло, під ним ромб; «так» — повернення ліворуч на початок тіла, «ні» — вихід донизу
      const body = layout(f.body);
      const d = decision(f.cond);
      const inner = Math.max(d.w / 2, body.cx);
      const cx = SIDE + inner;
      const w = cx + Math.max(d.w / 2, body.w - body.cx) + SIDE / 2;
      const y0 = GAP / 2;
      const shapes: Shape[] = [{ k: "line", pts: [[cx, 0], [cx, y0]], arrow: true }, ...shift(body.shapes, cx - body.cx, y0)];
      const dy = y0 + body.h + GAP;
      shapes.push({ k: "line", pts: [[cx, y0 + body.h], [cx, dy]], arrow: true });
      shapes.push(...shift(d.shapes, cx - d.w / 2, dy));
      shapes.push({ k: "line", pts: [[cx - d.w / 2, dy + d.h / 2], [SIDE / 2, dy + d.h / 2], [SIDE / 2, y0 / 2], [cx, y0 / 2]], arrow: true });
      shapes.push({ k: "label", x: cx - d.w / 2 - 4, y: dy + d.h / 2 - 5, text: f.yesLabel ?? "так", anchor: "end" });
      const out = dy + d.h + GAP / 2;
      shapes.push({ k: "line", pts: [[cx, dy + d.h], [cx, out]] });
      shapes.push({ k: "label", x: cx + 5, y: dy + d.h + 12, text: f.noLabel ?? "ні" });
      return { w, h: out, cx, shapes };
    }
  }
}

export interface FlowChart {
  w: number;
  h: number;
  shapes: Shape[];
}

export function layoutFlow(f: Flow): FlowChart {
  const b = layout(f);
  // наскрізна нумерація блоків (зверху вниз, зліва направо) у лівому верхньому куті
  const blocks = b.shapes.filter((s): s is Extract<Shape, { k: "term" | "op" | "io" | "dec" }> => s.k === "term" || s.k === "op" || s.k === "io" || s.k === "dec");
  blocks.sort((p, q) => p.y - q.y || p.x - q.x);
  const nums: Shape[] = blocks.map((s, i) => ({ k: "num", x: s.k === "dec" ? s.x + s.w / 2 - 14 : s.x - 2, y: s.y - 3, text: String(i + 1) }));
  return { w: b.w, h: b.h, shapes: [...b.shapes, ...nums] };
}
