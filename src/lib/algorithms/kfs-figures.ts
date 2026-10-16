/**
 * Рисунки к работам КФС: схема размещения ТО (с увеличенными кластерами —
 * пары ТО стоят в десятках метров друг от друга при размере предприятия в
 * километры), остовные деревья, квадрат расстояний, структура ТП и цепочка
 * ФПБ заявки.
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import { fmt, pairKey, type ChainStep } from "./kfs";

type XY = Record<string, [number, number]>;

export interface GraphEdge {
  a: string;
  b: string;
  label?: string;
  dashed?: boolean;
  /** Кабель длиннее прямой — ребро дугой. */
  arc?: boolean;
}

const CLUSTER = 0.3; // км: ближе — объекты рисуются в увеличенном окне

export function clusters(names: string[], xy: XY): string[][] {
  const left = [...names];
  const out: string[][] = [];
  while (left.length) {
    const a = left.shift()!;
    const g = [a, ...left.filter((b) => Math.hypot(xy[a][0] - xy[b][0], xy[a][1] - xy[b][1]) < CLUSTER)];
    for (const n of g.slice(1)) left.splice(left.indexOf(n), 1);
    if (g.length > 1) out.push(g);
  }
  return out;
}

function arcPts(p: [number, number], q: [number, number], bend = 0.12): [number, number][] {
  const [x1, y1] = p;
  const [x2, y2] = q;
  const cx = (x1 + x2) / 2 + bend * (y2 - y1);
  const cy = (y1 + y2) / 2 - bend * (x2 - x1);
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    return [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  });
}

function marker(items: DrawItem[], n: string, x: number, y: number) {
  if (n.startsWith("ТП")) items.push({ k: "rect", x: x - 5, y: y - 5, w: 10, h: 10, fill: true });
  else items.push({ k: "circle", x, y, r: 5 });
}

/** Поле с осями в км; to(x, y) — экранные координаты. */
function frame(xs: number[], ys: number[], w: number, h: number, pad: number, grid: boolean) {
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const m = span * pad;
  const lo = [x0 - m, y0 - m];
  const size = span + 2 * m;
  const L = 46, T = 14, S = Math.min(w - L - 80, h - T - 36);
  const to = (x: number, y: number): [number, number] => [L + ((x - lo[0]) / size) * S, T + S - ((y - lo[1]) / size) * S];
  const items: DrawItem[] = [{ k: "rect", x: L, y: T, w: S, h: S }];
  if (grid) {
    const step = size > 4 ? 1 : size > 1 ? 0.2 : size > 0.2 ? 0.05 : 0.01;
    const d = step < 0.05 ? 2 : step < 1 ? 2 : 0;
    for (let g = Math.ceil(lo[0] / step) * step; g <= lo[0] + size + 1e-9; g += step) {
      const [px] = to(g, lo[1]);
      items.push({ k: "line", pts: [[px, T + S], [px, T + S + 4]] });
      items.push({ k: "text", x: px, y: T + S + 16, text: g.toFixed(d).replace(".", ","), anchor: "middle", size: 10, plain: true });
    }
    for (let g = Math.ceil(lo[1] / step) * step; g <= lo[1] + size + 1e-9; g += step) {
      const [, py] = to(lo[0], g);
      items.push({ k: "line", pts: [[L - 4, py], [L, py]] });
      items.push({ k: "text", x: L - 7, y: py + 3, text: g.toFixed(d).replace(".", ","), anchor: "end", size: 10, plain: true });
    }
    items.push({ k: "text", x: L + S / 2, y: T + S + 32, text: "X, км", anchor: "middle", size: 11, plain: true });
    items.push({ k: "text", x: 4, y: T + 10, text: "Y, км", size: 11, plain: true });
  }
  // справа — место под подписи объектов у края поля
  return { items, to, w: L + S + 80, h: T + S + 40 };
}

function edgesOn(items: DrawItem[], edges: GraphEdge[], xy: XY, to: (x: number, y: number) => [number, number], short: boolean) {
  // рёбра между кластерами почти совпадают — подпись ставим одну на место
  const placed: [number, number][] = [];
  for (const e of edges) {
    const p = to(...xy[e.a]);
    const q = to(...xy[e.b]);
    const d = Math.hypot(xy[e.a][0] - xy[e.b][0], xy[e.a][1] - xy[e.b][1]);
    if (short !== d < CLUSTER) continue;
    const pts = e.arc ? arcPts(p, q) : [p, q];
    items.push({ k: "line", pts, dashed: e.dashed });
    if (e.label) {
      const mid = pts[Math.floor(pts.length / 2)];
      const mx = e.arc ? mid[0] : (p[0] + q[0]) / 2;
      const my = e.arc ? mid[1] : (p[1] + q[1]) / 2;
      if (placed.some(([px, py]) => Math.hypot(px - mx, py - my) < 18)) continue;
      placed.push([mx, my]);
      items.push({ k: "text", x: mx + 4, y: my - 4, text: e.label, size: 10, plain: true });
    }
  }
}

/**
 * Схема размещения ТО (и рёбра графа/дерева, если заданы) плюс увеличенные
 * окна для кластеров близких объектов.
 */
export function topology(names: string[], xy: XY, edges: GraphEdge[] = []): { main: Drawing; zooms: { title: string; drawing: Drawing }[] } {
  const f = frame(names.map((n) => xy[n][0]), names.map((n) => xy[n][1]), 560, 520, 0.08, true);
  const items = f.items;
  edgesOn(items, edges, xy, f.to, false);
  const cl = clusters(names, xy);
  for (const n of names) {
    const [x, y] = f.to(...xy[n]);
    marker(items, n, x, y);
  }
  for (const g of cl) {
    const [x, y] = f.to(...xy[g[0]]);
    items.push({ k: "text", x: x + 9, y: y - 8, text: g.join(", "), size: 11, plain: true });
  }
  for (const n of names.filter((n) => !cl.some((g) => g.includes(n)))) {
    const [x, y] = f.to(...xy[n]);
    items.push({ k: "text", x: x + 9, y: y - 8, text: n, size: 11, plain: true });
  }
  const zooms = cl.map((g) => {
    const z = frame(g.map((n) => xy[n][0]), g.map((n) => xy[n][1]), 300, 300, 0.25, true);
    const its = z.items;
    const inner = edges.filter((e) => g.includes(e.a) && g.includes(e.b));
    edgesOn(its, inner, xy, z.to, true);
    g.forEach((n, i) => {
      const [x, y] = z.to(...xy[n]);
      marker(its, n, x, y);
      its.push({ k: "text", x: x + 8, y: i % 2 ? y - 8 : y + 16, text: n, size: 11, plain: true });
    });
    return { title: `Збільшено: ${g.join(", ")}`, drawing: { w: z.w, h: z.h, items: its } };
  });
  return { main: { w: f.w, h: f.h, items }, zooms };
}

/** Рёбра для дерева: подписи — длины, элитная связь пунктиром, кабель длиннее прямой — дугой. */
export function treeEdges(edges: [string, string][], w: Record<string, number>, geom: Record<string, number>, opts: { elite?: [string, string] | null; cable?: boolean }): GraphEdge[] {
  return edges.map(([a, b]) => ({
    a,
    b,
    label: fmt(w[pairKey(a, b)]),
    dashed: !!opts.elite && pairKey(...opts.elite) === pairKey(a, b),
    arc: !!opts.cable && w[pairKey(a, b)] > geom[pairKey(a, b)] + 5e-4,
  }));
}

/** Квадрат расстояний: вершины — суммарные длины МКД, рёбра — разности. */
export function square(totals: Record<string, number>): Drawing {
  const pos: Record<string, [number, number]> = { МКДг: [90, 70], МКДк: [370, 70], МКДке: [370, 290], МКДге: [90, 290] };
  const keys = Object.keys(pos);
  const items: DrawItem[] = [];
  keys.forEach((a, i) =>
    keys.slice(i + 1).forEach((b) => {
      const [x1, y1] = pos[a];
      const [x2, y2] = pos[b];
      items.push({ k: "line", pts: [[x1, y1], [x2, y2]] });
      const diag = x1 !== x2 && y1 !== y2;
      const mx = (x1 + x2) / 2 + (diag ? ((x1 < x2) === (y1 < y2) ? 26 : -26) : 0);
      const my = (y1 + y2) / 2 + (diag ? 0 : -6);
      items.push({ k: "text", x: mx, y: my, text: fmt(Math.abs(totals[a] - totals[b])), anchor: "middle", size: 11, plain: true });
    }),
  );
  for (const k of keys) {
    const [x, y] = pos[k];
    items.push({ k: "circle", x, y, r: 34 });
    items.push({ k: "text", x, y: y - 3, text: k, anchor: "middle", size: 12, bold: true, plain: true });
    items.push({ k: "text", x, y: y + 14, text: fmt(totals[k]), anchor: "middle", size: 11, plain: true });
  }
  return { w: 460, h: 360, items };
}

/** Структура ТП: сетка дільниць так, как она задана в варианте. */
export function structure(cells: Record<string, [number, number, string][]>): Drawing {
  const items: DrawItem[] = [];
  const cw = 52, ch = 34;
  let x0 = 0;
  for (const [tp, cs] of Object.entries(cells)) {
    const cols = Math.max(4, ...cs.map((c) => c[1] + 1));
    items.push({ k: "text", x: x0 + (cols * cw) / 2, y: 14, text: tp, anchor: "middle", size: 13, bold: true, plain: true });
    items.push({ k: "rect", x: x0, y: 22, w: cols * cw, h: 3 * ch });
    for (const [r, c, d] of cs) {
      items.push({ k: "rect", x: x0 + c * cw + 5, y: 22 + r * ch + 5, w: cw - 10, h: ch - 10 });
      items.push({ k: "text", x: x0 + c * cw + cw / 2, y: 22 + r * ch + ch / 2 + 4, text: d, anchor: "middle", size: 12, plain: true });
    }
    x0 += cols * cw + 28;
  }
  return { w: x0 - 28, h: 22 + 3 * ch + 4, items };
}

/**
 * Цепочка ФПБ заявки: в узле номер ФПБ и время на выбранном МКП, на ветвях —
 * коэффициент слагаемого (вероятность альтернативы или 1,00 у ветвей, что
 * выполняются все). Длинные цепочки переносятся на несколько строк.
 */
export function chain(steps: ChainStep[], T: number[], perRow = 6): Drawing {
  const items: DrawItem[] = [];
  const gap = 92, r = 22, rowGap = 26;
  let top = 0;
  let width = 0;
  for (let s0 = 0; s0 < steps.length; s0 += perRow) {
    const part = steps.slice(s0, s0 + perRow);
    const H = Math.max(70, 58 * Math.max(...part.map((p) => p.terms.length)));
    const yc = top + H / 2;
    let x = 10;
    let cur: [number, number] = [x, yc];
    if (s0) items.push({ k: "text", x: 0, y: yc + 4, text: "…", size: 14, plain: true });
    const node = (cx: number, cy: number, f: number) => {
      items.push({ k: "circle", x: cx, y: cy, r });
      items.push({ k: "text", x: cx, y: cy - 2, text: `Ф${f}`, anchor: "middle", size: 12, plain: true });
      items.push({ k: "text", x: cx, y: cy + 12, text: Math.round(T[f - 1] ?? 0).toString(), anchor: "middle", size: 9, plain: true });
    };
    for (const st of part) {
      if (st.terms.length === 1) {
        x += gap;
        items.push({ k: "line", pts: [cur, [x - r, yc]], arrow: true });
        node(x, yc, st.terms[0][1]);
        cur = [x + r, yc];
        continue;
      }
      const fork: [number, number] = [x + gap * 0.5, yc];
      items.push({ k: "line", pts: [cur, fork] });
      items.push({ k: "dot", x: fork[0], y: fork[1] });
      x = fork[0] + gap * 0.8;
      const join: [number, number] = [x + gap * 0.8, yc];
      st.terms.forEach(([p, f], i) => {
        const y = yc - 58 * ((st.terms.length - 1) / 2 - i); // первая альтернатива — сверху
        items.push({ k: "line", pts: [fork, [x - r, y]], arrow: true });
        node(x, y, f);
        items.push({ k: "line", pts: [[x + r, y], join] });
        items.push({ k: "text", x: (fork[0] + x - r) / 2, y: (yc + y) / 2 - 6, text: fmt(p, 2), anchor: "middle", size: 9, plain: true });
      });
      items.push({ k: "dot", x: join[0], y: join[1] });
      cur = join;
      x = join[0] - gap * 0.45;
    }
    items.push({ k: "line", pts: [cur, [cur[0] + 40, yc]], arrow: true });
    if (s0 + perRow < steps.length) items.push({ k: "text", x: cur[0] + 46, y: yc + 4, text: "…", size: 14, plain: true });
    width = Math.max(width, cur[0] + 60);
    top += H + rowGap;
  }
  return { w: width, h: top - rowGap, items };
}
