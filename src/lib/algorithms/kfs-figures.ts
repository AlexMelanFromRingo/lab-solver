/**
 * Рисунки к работам КФС: схема размещения ТО (с увеличенными кластерами —
 * пары ТО стоят в десятках метров друг от друга при размере предприятия в
 * километры), остовные деревья, квадрат расстояний, структура ТП и цепочка
 * ФПБ заявки.
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import { fmt, pairKey, share, type ChainStep } from "./kfs";

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

// ================================================================== ЛР5–ЛР7

type P = [number, number];

/** Ширина надписи в px (оценка для раскладки подписей). */
const textW = (t: string, size: number) => t.length * size * 0.58 + 6;

function niceStep(max: number): number {
  const raw = max / 5;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? raw;
}

/** Столбчатая диаграмма: подписи столбцов (строки через «\n»), значения над столбцами. */
export function bars(labels: string[], values: number[], unit: string, digits = 1): Drawing {
  const L = 58, T = 18, W = Math.max(300, labels.length * 110), H = 190;
  const max = Math.max(...values, 1e-9) * 1.15;
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const y = (v: number) => T + H - (v / top) * H;
  const items: DrawItem[] = [{ k: "line", pts: [[L, T], [L, T + H], [L + W, T + H]] }];
  for (let v = 0; v <= top + 1e-9; v += step) {
    items.push({ k: "line", pts: [[L - 4, y(v)], [L, y(v)]] });
    items.push({ k: "text", x: L - 7, y: y(v) + 4, text: fmt(v, step < 1 ? 1 : 0), anchor: "end", size: 10, plain: true });
  }
  items.push({ k: "text", x: 4, y: T - 6, text: unit, size: 10, plain: true });
  const bw = W / labels.length;
  values.forEach((v, i) => {
    const x = L + i * bw + bw * 0.22;
    items.push({ k: "rect", x, y: y(v), w: bw * 0.56, h: T + H - y(v), fill: true });
    items.push({ k: "text", x: x + bw * 0.28, y: y(v) - 5, text: fmt(v, digits), anchor: "middle", size: 10, plain: true });
    labels[i].split("\n").forEach((ln, j) =>
      items.push({ k: "text", x: x + bw * 0.28, y: T + H + 15 + j * 13, text: ln, anchor: "middle", size: 10, plain: true }),
    );
  });
  const lines = Math.max(...labels.map((l) => l.split("\n").length));
  return { w: L + W + 10, h: T + H + 12 + lines * 13, items };
}

/** Значения по заявкам (номер z по оси X): по линии на МКП с разными маркерами, средние — пунктиром. */
export function perRequest(series: { label: string; values: number[] }[], avgs: number[], unit: string): Drawing {
  const n = series[0]?.values.length ?? 0;
  const L = 58, T = 34, W = Math.max(520, n * 16), H = 220;
  const max = Math.max(...series.flatMap((s) => s.values), 1e-9) * 1.1;
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const x = (i: number) => L + 12 + (i * (W - 24)) / Math.max(1, n - 1);
  const y = (v: number) => T + H - (v / top) * H;
  const items: DrawItem[] = [{ k: "line", pts: [[L, T], [L, T + H], [L + W, T + H]] }];
  for (let v = 0; v <= top + 1e-9; v += step) {
    items.push({ k: "line", pts: [[L - 4, y(v)], [L, y(v)]] });
    items.push({ k: "text", x: L - 7, y: y(v) + 4, text: fmt(v, 0), anchor: "end", size: 10, plain: true });
  }
  for (let i = 0; i < n; i += n > 30 ? 2 : 1) items.push({ k: "text", x: x(i), y: T + H + 14, text: String(i + 1), anchor: "middle", size: 9, plain: true });
  items.push({ k: "text", x: L + W / 2, y: T + H + 30, text: "номер заявки z", anchor: "middle", size: 10, plain: true });
  items.push({ k: "text", x: 4, y: T - 8, text: unit, size: 10, plain: true });
  const mark = (si: number, px: number, py: number) => {
    if (si === 0) items.push({ k: "circle", x: px, y: py, r: 2.6, fill: true });
    else if (si === 1) items.push({ k: "rect", x: px - 2.6, y: py - 2.6, w: 5.2, h: 5.2, fill: true });
    else items.push({ k: "diamond", x: px, y: py, w: 7, h: 7 });
  };
  series.forEach((s, si) => {
    items.push({ k: "line", pts: s.values.map((v, i) => [x(i), y(v)] as P) });
    s.values.forEach((v, i) => mark(si, x(i), y(v)));
    items.push({ k: "line", pts: [[L, y(avgs[si])], [L + W, y(avgs[si])]], dashed: true });
    items.push({ k: "text", x: L + W - 4, y: y(avgs[si]) - 5, text: `середнє ${fmt(avgs[si], 1)}`, anchor: "end", size: 9, plain: true, bg: true });
    mark(si, L + 10 + si * 110, 12);
    items.push({ k: "text", x: L + 18 + si * 110, y: 16, text: s.label, size: 10, plain: true });
  });
  return { w: L + W + 10, h: T + H + 36, items };
}

// --- графы потоков -------------------------------------------------------------------

function bez(p: P, q: P, rad: number, t: number): P {
  const cx = (p[0] + q[0]) / 2 + rad * (q[1] - p[1]);
  const cy = (p[1] + q[1]) / 2 - rad * (q[0] - p[0]);
  return [(1 - t) ** 2 * p[0] + 2 * (1 - t) * t * cx + t * t * q[0], (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * cy + t * t * q[1]];
}

/** Ребро проходит сквозь чужую вершину — его рисуют дугой. */
function through(pos: Record<string, P>, a: string, b: string, r: number) {
  const [x1, y1] = pos[a];
  const [x2, y2] = pos[b];
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  return Object.entries(pos).some(([n, [qx, qy]]) => {
    if (n === a || n === b) return false;
    const t = ((qx - x1) * dx + (qy - y1) * dy) / (L * L);
    return t > 0 && t < 1 && Math.abs(dy * (qx - x1) - dx * (qy - y1)) / L < r * 1.4;
  });
}

/** Кривая ребра без участков внутри кружков вершин. */
function edgePts(p: P, q: P, rad: number, r: number): P[] {
  const pts = Array.from({ length: 61 }, (_, i) => bez(p, q, rad, i / 60));
  return pts.filter((pt) => Math.hypot(pt[0] - p[0], pt[1] - p[1]) >= r && Math.hypot(pt[0] - q[0], pt[1] - q[1]) >= r + 1);
}

/** Раскладка подписей: из кандидатов — точка дальше от поставленных подписей, вершин и чужих рёбер. */
class Places {
  taken: [P, number][] = [];
  constructor(private nodes: P[], private r: number) {}
  pick(cands: P[], w: number, lines: P[]): P {
    const score = (p: P) => {
      const d = Math.min(9e9, ...this.taken.map(([q, qw]) => Math.max(Math.abs(p[0] - q[0]) - (w + qw) / 2, Math.abs(p[1] - q[1]) - 13)));
      const dn = Math.min(9e9, ...this.nodes.map((n) => Math.hypot(p[0] - n[0], p[1] - n[1]) - this.r - w / 2));
      const dl = Math.min(9e9, ...lines.map((q) => Math.max(Math.abs(p[0] - q[0]) - w / 2, Math.abs(p[1] - q[1]) - 6)));
      return Math.min(d, dn, dl * 1.5);
    };
    const best = cands.find((c) => score(c) > 3) ?? cands.reduce((m, c) => (score(c) > score(m) ? c : m), cands[0]);
    this.taken.push([best, w]);
    return best;
  }
}

function fitBox(items: DrawItem[], pos: Record<string, P>, margin: number): Drawing {
  const xs = Object.values(pos).map((p) => p[0]);
  const ys = Object.values(pos).map((p) => p[1]);
  const dx = margin - Math.min(...xs);
  const dy = margin - Math.min(...ys);
  const shift = (it: DrawItem): DrawItem => {
    switch (it.k) {
      case "line":
        return { ...it, pts: it.pts.map(([x, y]) => [x + dx, y + dy] as P) };
      case "ground":
        return { ...it, x1: it.x1 + dx, x2: it.x2 + dx, y: it.y + dy };
      default:
        return { ...it, x: it.x + dx, y: it.y + dy } as DrawItem;
    }
  };
  return { w: Math.max(...xs) - Math.min(...xs) + 2 * margin, h: Math.max(...ys) - Math.min(...ys) + 2 * margin, items: items.map(shift) };
}

function nodeCircle(items: DrawItem[], [x, y]: P, label: string, r: number, size = 12) {
  items.push({ k: "circle", x, y, r });
  const lines = label.split("\n");
  lines.forEach((ln, i) => items.push({ k: "text", x, y: y + 4 + (i - (lines.length - 1) / 2) * (size + 1), text: ln, anchor: "middle", size, plain: true }));
}

/**
 * Граф потоков: flows — [откуда, куда, значение]; петля (a, a) — дуга снаружи
 * вершины, встречные потоки — двумя дугами, ребро сквозь чужую вершину — дугой.
 */
export function flowGraph(
  pos: Record<string, P>,
  flows: [string, string, number][],
  opts: { directed?: boolean; fmt?: (x: number) => string; bold?: string[]; dashed?: string[]; names?: Record<string, string>; r?: number } = {},
): Drawing {
  const directed = opts.directed ?? true;
  const f = opts.fmt ?? ((x: number) => Math.round(x).toString());
  const r = opts.r ?? 20;
  const bold = new Set(opts.bold ?? []);
  const dashed = new Set(opts.dashed ?? []);
  const items: DrawItem[] = [];
  const cx = Object.values(pos).reduce((s, p) => s + p[0], 0) / Object.keys(pos).length;
  const cy = Object.values(pos).reduce((s, p) => s + p[1], 0) / Object.keys(pos).length;
  const places = new Places(Object.values(pos), r);
  const has = new Set(flows.map(([a, b]) => `${a}→${b}`));
  const edges = flows
    .filter(([a, b]) => a !== b)
    .map(([a, b, v]) => {
      const two = directed && has.has(`${b}→${a}`);
      const rad = two ? 0.16 : through(pos, a, b, r) ? 0.3 : 0;
      return { a, b, v, rad, pts: edgePts(pos[a], pos[b], rad, r) };
    });
  for (const [a, b, v] of flows) {
    if (a !== b) continue;
    const [x, y] = pos[a];
    const n = Math.hypot(x - cx, y - cy) || 1;
    const ux = (x - cx) / n, uy = (y - cy) / n;
    const c: P = [x + ux * (r + 6), y + uy * (r + 6)];
    const th = Math.atan2(uy, ux);
    const pts = Array.from({ length: 41 }, (_, i) => {
      const s = th + Math.PI + 0.5 + (i / 40) * (2 * Math.PI - 1.0);
      return [c[0] + 13 * Math.cos(s), c[1] + 13 * Math.sin(s)] as P;
    }).filter((p) => Math.hypot(p[0] - x, p[1] - y) >= r);
    items.push({ k: "line", pts, arrow: directed });
    const lp: P = [x + ux * (r + 34), y + uy * (r + 30) + 4];
    places.taken.push([lp, textW(f(v), 10)]);
    items.push({ k: "text", x: lp[0], y: lp[1], text: f(v), anchor: "middle", size: 10, plain: true, bg: true });
  }
  for (const e of edges) {
    const key = pairKey(e.a, e.b);
    items.push({ k: "line", pts: e.pts, arrow: directed, bold: bold.has(key), dashed: dashed.has(key) });
  }
  for (const e of edges) {
    const others = edges.filter((o) => o !== e).flatMap((o) => o.pts.filter((_, i) => i % 3 === 0));
    const t = f(e.v);
    const lp = places.pick([0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75, 0.2, 0.8].map((k) => bez(pos[e.a], pos[e.b], e.rad, k)), textW(t, 10), others);
    items.push({ k: "text", x: lp[0], y: lp[1] + 4, text: t, anchor: "middle", size: 10, plain: true, bg: true });
  }
  for (const [n, p] of Object.entries(pos)) nodeCircle(items, p, opts.names?.[n] ?? n, r, 11);
  return fitBox(items, pos, 70);
}

/** Два ряда вершин: ТП сверху, ДП снизу. */
export function rowsLayout(top: string[], bottom: string[], dx = 190, dy = 180): Record<string, P> {
  const pos: Record<string, P> = {};
  top.forEach((n, i) => (pos[n] = [(i - (top.length - 1) / 2) * dx, 0]));
  bottom.forEach((n, i) => (pos[n] = [(i - (bottom.length - 1) / 2) * dx, dy]));
  return pos;
}

/**
 * Схема по географии: вершины (ТО или КОК — ТО через «_») по координатам, ТО одного
 * кластера (ближе 0,2 км) разведены вокруг его центра.
 */
export function geoLayout(xy: XY, ids: string[], scale = 62, spread = 78): Record<string, P> {
  const raw = Object.fromEntries(
    ids.map((id) => {
      const ms = id.split("_");
      return [id, [ms.reduce((s, m) => s + xy[m][0], 0) / ms.length, ms.reduce((s, m) => s + xy[m][1], 0) / ms.length] as P];
    }),
  );
  const left = [...ids];
  const pos: Record<string, P> = {};
  while (left.length) {
    const a = left.shift()!;
    const g = [a, ...left.filter((b) => Math.hypot(raw[a][0] - raw[b][0], raw[a][1] - raw[b][1]) < 0.2)];
    for (const n of g.slice(1)) left.splice(left.indexOf(n), 1);
    const gx = g.reduce((s, n) => s + raw[n][0], 0) / g.length;
    const gy = g.reduce((s, n) => s + raw[n][1], 0) / g.length;
    if (g.length === 1) {
      pos[a] = [gx * scale, -gy * scale];
      continue;
    }
    const ang = g.map((n) => [Math.atan2(raw[n][1] - gy, raw[n][0] - gx), n] as [number, string]).sort((p, q) => p[0] - q[0]);
    ang.forEach(([, n], i) => {
      const t = ang[0][0] + (2 * Math.PI * i) / g.length;
      pos[n] = [gx * scale + spread * Math.cos(t), -(gy * scale + spread * Math.sin(t))];
    });
  }
  return pos;
}

/** Иерархия дерева: корень сверху, листья равномерно. */
export function treeLayout(edges: [string, string][], root: string, dx = 170, dy = 140): Record<string, P> {
  const adj = new Map<string, string[]>();
  for (const [a, b] of edges) {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  const children = new Map<string, string[]>([[root, []]]);
  const order = [root];
  for (const u of order)
    for (const w of [...(adj.get(u) ?? [])].sort())
      if (!children.has(w)) {
        children.get(u)!.push(w);
        children.set(w, []);
        order.push(w);
      }
  const width = new Map<string, number>();
  for (const u of [...order].reverse()) width.set(u, Math.max(1, children.get(u)!.reduce((s, c) => s + width.get(c)!, 0)));
  const pos: Record<string, P> = {};
  const place = (u: string, x0: number, depth: number) => {
    pos[u] = [x0 + (width.get(u)! * dx) / 2, depth * dy];
    let x = x0;
    for (const c of children.get(u)!) {
      place(c, x, depth + 1);
      x += width.get(c)! * dx;
    }
  };
  place(root, 0, 0);
  return pos;
}

/** Дерево КОК: рёбра с подписями (строки через «\n»), рядом с центральным — ЦБД. */
export function kokTree(pos: Record<string, P>, names: Record<string, string>, edges: [string, string, string][], opts: { r?: number; cbd?: string } = {}): Drawing {
  const r = opts.r ?? 26;
  const items: DrawItem[] = [];
  for (const [a, b, label] of edges) {
    let p = pos[a], q = pos[b];
    const arc = through(pos, a, b, r);
    if (arc && p[0] < q[0]) [p, q] = [q, p];
    const pts = edgePts(p, q, arc ? 0.3 : 0, r);
    items.push({ k: "line", pts, bold: true });
    const [mx, my] = bez(p, q, arc ? 0.3 : 0, 0.5);
    const lines = label.split("\n");
    lines.forEach((ln, i) => items.push({ k: "text", x: mx, y: my + 4 + (i - (lines.length - 1) / 2) * 12, text: ln, anchor: "middle", size: 10, plain: true, bg: true }));
  }
  for (const [n, p] of Object.entries(pos)) nodeCircle(items, p, names[n] ?? n, r, 10);
  if (opts.cbd) {
    const [x, y] = pos[opts.cbd];
    items.push({ k: "line", pts: [[x, y - r], [x, y - r - 22]] });
    items.push({ k: "rect", x: x - 24, y: y - r - 44, w: 48, h: 22, bold: true });
    items.push({ k: "text", x, y: y - r - 29, text: "ЦБД", anchor: "middle", size: 11, plain: true });
  }
  return fitBox(items, pos, 80);
}

/** Звезда: потоки от центральной вершины (БД) к объектам по кругу. */
export function star(center: string, values: [string, number][], f: (x: number) => string): Drawing {
  const R = 150, r = 22, rc = 40;
  const items: DrawItem[] = [];
  const pos: Record<string, P> = { [center]: [0, 0] };
  values.forEach(([n], i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / values.length;
    pos[n] = [R * Math.cos(a), R * Math.sin(a)];
  });
  for (const [n, v] of values) {
    const [x, y] = pos[n];
    const d = Math.hypot(x, y);
    items.push({ k: "line", pts: [[(x / d) * rc, (y / d) * rc], [(x / d) * (d - r), (y / d) * (d - r)]], arrow: true });
    items.push({ k: "text", x: x * 0.55, y: y * 0.55 + 4, text: f(v), anchor: "middle", size: 10, plain: true, bg: true });
  }
  for (const [n] of values) nodeCircle(items, pos[n], n, r, 11);
  nodeCircle(items, [0, 0], center, rc, 12);
  return fitBox(items, pos, 40);
}

/** Потоки от БД к заявкам двумя столбцами (рис. 4 методички ЛР6). */
export function fan(center: string, left: [string, number][], right: [string, number][], f: (x: number) => string): Drawing {
  const row = 24, bw = 64, bh = 18, W = 560;
  const n = Math.max(left.length, right.length);
  const H = n * row;
  const c: P = [W / 2, H / 2];
  const items: DrawItem[] = [];
  const column = (list: [string, number][], x: number, side: -1 | 1) => {
    const top = H / 2 - ((list.length - 1) * row) / 2;
    list.forEach(([name, v], i) => {
      const y = top + i * row;
      items.push({ k: "rect", x: x - bw / 2, y: y - bh / 2, w: bw, h: bh });
      items.push({ k: "text", x, y: y + 4, text: name, anchor: "middle", size: 10, plain: true });
      const end: P = [x - side * (bw / 2), y];
      const start: P = [c[0] + side * 30, c[1]];
      items.push({ k: "line", pts: [start, end], arrow: true });
      const t = 0.74;
      items.push({ k: "text", x: start[0] + t * (end[0] - start[0]), y: start[1] + t * (end[1] - start[1]) + 3, text: f(v), anchor: "middle", size: 9, plain: true, bg: true });
    });
  };
  column(left, bw / 2, -1);
  column(right, W - bw / 2, 1);
  items.push({ k: "rect", x: c[0] - 30, y: c[1] - 16, w: 60, h: 32, bold: true });
  items.push({ k: "text", x: c[0], y: c[1] + 5, text: center, anchor: "middle", size: 12, plain: true });
  return { w: W, h: H, items };
}

/**
 * Фрагмент информационно-функциональной структуры (рис. 1 методички ЛР6):
 * ланцюг ФПБ заявки, звертання перших кроків до масивів БД («частка*λ*обсяг»),
 * повідомлення до ДП і керуючий вплив на ТП.
 */
export function fragment(
  steps: ChainStep[],
  src: string,
  ctrlTo: string | null,
  lam: number,
  arrays: [string, number][],
  frac: (arr: string, f: number) => number,
  msgs: [string, number][],
  perDb = 2,
): Drawing {
  const gap = 62, r = 15;
  const items: DrawItem[] = [];
  const nodes = new Map<string, P>();
  let x = 70;
  let prev: P[] = [[40, 0]];
  steps.forEach((st, i) => {
    x += gap;
    const ys = st.terms.map((_, j) => 42 * ((st.terms.length - 1) / 2 - j));
    st.terms.forEach(([p, fb], j) => {
      const at: P = [x, ys[j]];
      nodes.set(`${i}:${fb}`, at);
      items.push({ k: "circle", x: at[0], y: at[1], r });
      items.push({ k: "text", x: at[0], y: at[1] + 4, text: String(fb), anchor: "middle", size: 11, plain: true });
      for (const q of prev) items.push({ k: "line", pts: [[q[0] + (q[0] > 40 ? r : 0), q[1]], [at[0] - r, at[1]]], arrow: true });
      if (st.terms.length > 1) items.push({ k: "text", x: at[0] - gap / 2, y: at[1] - 6, text: fmt(p, 2), anchor: "middle", size: 8, plain: true, bg: true });
    });
    prev = ys.map((y) => [x, y] as P);
  });
  const end: P = [x + gap * 0.8, 0];
  for (const q of prev) items.push({ k: "line", pts: [[q[0] + r, q[1]], end] });
  // источник
  items.push({ k: "rect", x: -10, y: -12, w: 50, h: 24 });
  items.push({ k: "text", x: 15, y: 4, text: src, anchor: "middle", size: 11, plain: true });
  items.push({ k: "text", x: 76, y: -6, text: fmt(lam, 2), anchor: "middle", size: 9, plain: true });
  // масивы БД
  const used = new Set<string>();
  steps.slice(0, perDb).forEach((st) => st.terms.forEach(([, fb]) => arrays.forEach(([a]) => frac(a, fb) && used.add(a))));
  const ay = -170;
  const apos = new Map<string, P>();
  arrays.forEach(([a, size], k) => {
    const ax = 110 + (k * (x - 110)) / Math.max(1, arrays.length - 1);
    apos.set(a, [ax, ay]);
    items.push({ k: "circle", x: ax, y: ay, r: 16, fill: false });
    items.push({ k: "text", x: ax, y: ay + 4, text: a, anchor: "middle", size: 10, plain: true, bold: used.has(a) });
    items.push({ k: "text", x: ax, y: ay - 22, text: `${size} Мб`, anchor: "middle", size: 9, plain: true });
  });
  steps.slice(0, perDb).forEach((st, i) =>
    st.terms.forEach(([, fb]) => {
      const from = nodes.get(`${i}:${fb}`)!;
      arrays.forEach(([a, size]) => {
        const fr = frac(a, fb);
        if (!fr) return;
        const to = apos.get(a)!;
        const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
        const s: P = [from[0] + ((to[0] - from[0]) / d) * r, from[1] + ((to[1] - from[1]) / d) * r];
        const e: P = [to[0] - ((to[0] - from[0]) / d) * 16, to[1] - ((to[1] - from[1]) / d) * 16];
        items.push({ k: "line", pts: [s, e], arrow: true });
        // подписи соседних масивов — на разной высоте, чтобы не сливались
        const t = arrays.findIndex(([x]) => x === a) % 2 ? 0.62 : 0.84;
        items.push({
          k: "text",
          x: s[0] + t * (e[0] - s[0]),
          y: s[1] + t * (e[1] - s[1]),
          text: `${share(fr)}*${fmt(lam, 2)}*${size}`,
          anchor: "middle",
          size: 8,
          plain: true,
          bg: true,
        });
      });
    }),
  );
  // повідомлення
  msgs.forEach(([dp, vol], k) => {
    const bx = end[0] - k * 120;
    items.push({ k: "rect", x: bx - 25, y: 92, w: 50, h: 24 });
    items.push({ k: "text", x: bx, y: 108, text: dp, anchor: "middle", size: 11, plain: true });
    items.push({ k: "line", pts: [end, [bx, 92]], arrow: true });
    items.push({ k: "text", x: bx + 8, y: 66, text: `${vol}*${fmt(lam, 2)}*8`, size: 9, plain: true, bg: true });
  });
  // керуючий вплив
  if (ctrlTo) {
    const yb = 150;
    items.push({ k: "line", pts: [end, [end[0] + 36, 0], [end[0] + 36, yb], [15, yb], [15, 12]], arrow: true });
    items.push({ k: "text", x: (15 + end[0]) / 2, y: yb + 16, text: `${ctrlTo !== src ? `на ${ctrlTo}: ` : ""}2*${fmt(lam, 2)}*8 = ${Math.round(16 * lam)} біт/с`, anchor: "middle", size: 10, plain: true });
  }
  const pos = { a: [-10, ay - 40] as P, b: [end[0] + 50, 180] as P };
  return fitBox(items, pos, 10);
}

/** Окончательная структура: прямоугольники КОК (строки), каналы с подписями, ЦБД над центральным. */
export function finalStructure(pos: Record<string, P>, boxes: Record<string, string[]>, edges: [string, string, string[]][], central: string): Drawing {
  const bw = 150, bh = 70;
  const items: DrawItem[] = [];
  for (const [a, b, lines] of edges) {
    const [x1, y1] = pos[a];
    const [x2, y2] = pos[b];
    items.push({ k: "line", pts: [[x1, y1 + bh / 2], [x2, y2 - bh / 2]], bold: true });
    // подпись ближе к дочернему КОК: у соседних ветвей подписи расходятся
    const mx = x1 + 0.62 * (x2 - x1), my = y1 + bh / 2 + 0.55 * (y2 - y1 - bh);
    lines.forEach((ln, i) => items.push({ k: "text", x: mx, y: my + 4 + (i - (lines.length - 1) / 2) * 12, text: ln, anchor: "middle", size: 9, plain: true, bg: true }));
  }
  for (const [n, [x, y]] of Object.entries(pos)) {
    items.push({ k: "rect", x: x - bw / 2, y: y - bh / 2, w: bw, h: bh, bold: n === central });
    const ls = boxes[n] ?? [n];
    ls.forEach((ln, i) => items.push({ k: "text", x, y: y + 4 + (i - (ls.length - 1) / 2) * 13, text: ln, anchor: "middle", size: 10, plain: true, bold: i === 0 }));
  }
  const [cx, cy] = pos[central];
  items.push({ k: "line", pts: [[cx, cy - bh / 2], [cx, cy - bh / 2 - 26]] });
  items.push({ k: "rect", x: cx - 26, y: cy - bh / 2 - 50, w: 52, h: 24, bold: true });
  items.push({ k: "text", x: cx, y: cy - bh / 2 - 34, text: "ЦБД", anchor: "middle", size: 11, plain: true });
  return fitBox(items, Object.fromEntries(Object.entries(pos).flatMap(([n, [x, y]]) => [[`${n}<`, [x - bw / 2, y - bh / 2 - 50] as P], [`${n}>`, [x + bw / 2, y + bh / 2] as P]])), 16);
}
