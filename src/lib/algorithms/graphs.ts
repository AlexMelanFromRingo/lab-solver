/**
 * «Комп'ютерна дискретна математика», теорія графів: алгоритмы Флойда, Форда,
 * Дейкстры, Краскала и Прима — с промежуточными шагами, как их требуют в
 * расчётной работе (у Флойда — матрицы после каждого k и сам путь).
 */

export interface Edge {
  from: number;
  to: number;
  w: number;
}

/** Разбор списка рёбер: «1 2 7» или «x1 x2 7» — по одному в строке. */
export function parseEdges(text: string): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.replace(/[−–]/g, "-").replace(/[xX]/g, "").trim();
    if (!line || line.startsWith("#")) continue;
    const p = line.replace(/[,;→>]/g, " ").split(/\s+/).filter(Boolean).map(Number);
    if (p.length !== 3 || p.some((v) => !Number.isFinite(v)) || p[0] < 1 || p[1] < 1) {
      throw new Error(`Строка ${i + 1}: нужно «откуда куда вес», например «1 2 7»`);
    }
    edges.push({ from: p[0], to: p[1], w: p[2] });
  }
  if (!edges.length) throw new Error("Нет ни одного ребра");
  return { n: Math.max(...edges.flatMap((e) => [e.from, e.to])), edges };
}

export function weightMatrix(n: number, edges: Edge[], directed: boolean): number[][] {
  const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const e of edges) {
    m[e.from - 1][e.to - 1] = Math.min(m[e.from - 1][e.to - 1], e.w);
    if (!directed) m[e.to - 1][e.from - 1] = Math.min(m[e.to - 1][e.from - 1], e.w);
  }
  return m;
}

// ------------------------------------------------------------------- Флойд

export interface FloydResult {
  /** Матрицы расстояний D⁽⁰⁾…D⁽ⁿ⁾ и матрицы предшественников-«через». */
  d: number[][][];
  via: number[][][];
  negativeCycle: boolean;
}

export function floyd(w: number[][]): FloydResult {
  const n = w.length;
  let d = w.map((r) => [...r]);
  // via[i][j] — следующая вершина на пути из i в j (матрица маршрутов)
  let via = w.map((r, i) => r.map((v, j) => (v < Infinity && i !== j ? j : -1)));
  const ds = [d.map((r) => [...r])];
  const vs = [via.map((r) => [...r])];
  for (let k = 0; k < n; k++) {
    const nd = d.map((r) => [...r]);
    const nv = via.map((r) => [...r]);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] + d[k][j] < nd[i][j]) {
          nd[i][j] = d[i][k] + d[k][j];
          nv[i][j] = via[i][k];
        }
    d = nd;
    via = nv;
    ds.push(d.map((r) => [...r]));
    vs.push(via.map((r) => [...r]));
  }
  return { d: ds, via: vs, negativeCycle: d.some((r, i) => r[i] < 0) };
}

/** Путь по матрице маршрутов: i → via[i][j] → … → j (номера с 1). */
export function floydPath(via: number[][], from: number, to: number): number[] | null {
  let i = from - 1;
  const j = to - 1;
  if (via[i][j] < 0) return i === j ? [from] : null;
  const path = [from];
  for (let guard = 0; i !== j && guard < via.length + 1; guard++) {
    i = via[i][j];
    path.push(i + 1);
  }
  return i === j ? path : null;
}

// -------------------------------------------------------------------- Форд

export interface FordResult {
  /** Метки l(x) после каждого прохода по всем дугам. */
  passes: number[][];
  dist: number[];
  pred: number[];
  negativeCycle: boolean;
}

/** Алгоритм Форда (Беллмана–Форда): улучшение меток, пока они меняются. */
export function ford(n: number, edges: Edge[], source: number): FordResult {
  const dist = Array(n).fill(Infinity);
  const pred = Array(n).fill(-1);
  dist[source - 1] = 0;
  const passes = [[...dist]];
  for (let it = 0; it < n; it++) {
    let changed = false;
    for (const e of edges) {
      const a = e.from - 1;
      const b = e.to - 1;
      if (dist[a] + e.w < dist[b]) {
        dist[b] = dist[a] + e.w;
        pred[b] = a;
        changed = true;
      }
    }
    passes.push([...dist]);
    if (!changed) return { passes, dist, pred, negativeCycle: false };
  }
  return { passes, dist, pred, negativeCycle: true };
}

export function predPath(pred: number[], to: number): number[] {
  const path = [to];
  let v = to - 1;
  for (let guard = 0; pred[v] >= 0 && guard < pred.length; guard++) {
    v = pred[v];
    path.unshift(v + 1);
  }
  return path;
}

// ---------------------------------------------------------------- Дейкстра

export function dijkstra(w: number[][], source: number): { steps: { fixed: number; labels: number[] }[]; dist: number[]; pred: number[] } {
  const n = w.length;
  if (w.some((r) => r.some((v) => v < 0))) throw new Error("Дейкстра не работает с отрицательными весами — нужен Форд или Флойд");
  const dist = Array(n).fill(Infinity);
  const pred = Array(n).fill(-1);
  const done = Array(n).fill(false);
  dist[source - 1] = 0;
  const steps: { fixed: number; labels: number[] }[] = [];
  for (let s = 0; s < n; s++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (!done[v] && w[u][v] < Infinity && dist[u] + w[u][v] < dist[v]) {
        dist[v] = dist[u] + w[u][v];
        pred[v] = u;
      }
    }
    steps.push({ fixed: u + 1, labels: [...dist] });
  }
  return { steps, dist, pred };
}

// ------------------------------------------------------- Краскал и Прим

export interface KruskalStep {
  edge: Edge;
  taken: boolean;
}

export function kruskal(n: number, edges: Edge[]): { steps: KruskalStep[]; tree: Edge[]; weight: number; connected: boolean } {
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const sorted = [...edges].sort((a, b) => a.w - b.w || a.from - b.from || a.to - b.to);
  const steps: KruskalStep[] = [];
  const tree: Edge[] = [];
  for (const e of sorted) {
    if (tree.length === n - 1) break;
    const [a, b] = [find(e.from), find(e.to)];
    const taken = a !== b;
    if (taken) {
      parent[a] = b;
      tree.push(e);
    }
    steps.push({ edge: e, taken });
  }
  return { steps, tree, weight: tree.reduce((s, e) => s + e.w, 0), connected: tree.length === n - 1 };
}

export function prim(n: number, edges: Edge[], start = 1): { steps: { edge: Edge; inTree: number[] }[]; tree: Edge[]; weight: number; connected: boolean } {
  const inTree = new Set([start]);
  const tree: Edge[] = [];
  const steps: { edge: Edge; inTree: number[] }[] = [];
  while (inTree.size < n) {
    let best: Edge | null = null;
    for (const e of edges) {
      const crosses = inTree.has(e.from) !== inTree.has(e.to);
      if (crosses && (!best || e.w < best.w)) best = e;
    }
    if (!best) break;
    const nv = inTree.has(best.from) ? best.to : best.from;
    inTree.add(nv);
    tree.push(best);
    steps.push({ edge: best, inTree: [...inTree].sort((a, b) => a - b) });
  }
  return { steps, tree, weight: tree.reduce((s, e) => s + e.w, 0), connected: inTree.size === n };
}
