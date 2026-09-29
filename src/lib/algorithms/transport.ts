/**
 * Транспортная задача — «Комп'ютерна дискретна математика», практичне
 * заняття № 5/7. Опорный план методом наименьшей стоимости (как в примере
 * преподавателя) или северо-западного угла, затем оптимизация методом
 * потенциалов. Открытая задача закрывается фиктивным поставщиком или
 * потребителем с нулевыми стоимостями.
 */

export interface TransportInput {
  a: number[];
  b: number[];
  c: number[][];
}

export interface Allocation {
  /** x[i][j] — перевозка; null — клетка не в базисе. */
  x: (number | null)[][];
}

export interface Step {
  title: string;
  x: (number | null)[][];
  cost: number;
  u?: (number | null)[];
  v?: (number | null)[];
  /** Оценки Δij = ui + vj − cij свободных клеток. */
  delta?: (number | null)[][];
  cycle?: [number, number][];
  theta?: number;
}

export interface TransportResult {
  a: number[];
  b: number[];
  c: number[][];
  fictitious: "none" | "supplier" | "consumer";
  initial: Step[];
  potentials: Step[];
  optimal: (number | null)[][];
  cost: number;
}

const total = (x: (number | null)[][], c: number[][]) => x.reduce((s, r, i) => s + r.reduce<number>((t, v, j) => t + (v ?? 0) * c[i][j], 0), 0);
const clone = (x: (number | null)[][]) => x.map((r) => [...r]);

export function balance(inp: TransportInput): { a: number[]; b: number[]; c: number[][]; fictitious: TransportResult["fictitious"] } {
  const sa = inp.a.reduce((s, v) => s + v, 0);
  const sb = inp.b.reduce((s, v) => s + v, 0);
  if (sa === sb) return { a: [...inp.a], b: [...inp.b], c: inp.c.map((r) => [...r]), fictitious: "none" };
  if (sa < sb) return { a: [...inp.a, sb - sa], b: [...inp.b], c: [...inp.c.map((r) => [...r]), inp.b.map(() => 0)], fictitious: "supplier" };
  return { a: [...inp.a], b: [...inp.b, sa - sb], c: inp.c.map((r) => [...r, 0]), fictitious: "consumer" };
}

/** Опорный план с записью каждого шага: клетка, объём, остатки. */
function initialPlan(a0: number[], b0: number[], c: number[][], method: "least" | "northwest", fict: TransportResult["fictitious"]): { x: (number | null)[][]; log: string[] } {
  const a = [...a0];
  const b = [...b0];
  const m = a.length;
  const n = b.length;
  const x: (number | null)[][] = Array.from({ length: m }, () => Array(n).fill(null));
  const rowDone = Array(m).fill(false);
  const colDone = Array(n).fill(false);
  const log: string[] = [];
  let placed = 0;
  // нужно m + n − 1 базисных клеток: при вырождении ставится ноль
  while (placed < m + n - 1) {
    let bi = -1;
    let bj = -1;
    if (method === "northwest") {
      bi = rowDone.indexOf(false);
      bj = colDone.indexOf(false);
    } else {
      // фиктивная строка (столбец) с нулями заполняется в последнюю очередь
      const cost = (i: number, j: number) =>
        (fict === "supplier" && i === m - 1) || (fict === "consumer" && j === n - 1) ? 1e12 + c[i][j] : c[i][j];
      for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++) {
          if (rowDone[i] || colDone[j]) continue;
          if (bi < 0 || cost(i, j) < cost(bi, bj) || (cost(i, j) === cost(bi, bj) && Math.min(a[i], b[j]) > Math.min(a[bi], b[bj]))) {
            bi = i;
            bj = j;
          }
        }
    }
    if (bi < 0 || bj < 0) break;
    const q = Math.min(a[bi], b[bj]);
    x[bi][bj] = q;
    a[bi] -= q;
    b[bj] -= q;
    placed++;
    log.push(`x${bi + 1}${bj + 1} = min(${a[bi] + q}, ${b[bj] + q}) = ${q} (c${bi + 1}${bj + 1} = ${c[bi][bj]})`);
    // закрывается только одна линия, даже если обнулились обе (иначе потеряем базисную клетку)
    if (a[bi] === 0 && (b[bj] !== 0 || rowDone.filter((d) => !d).length > 1)) rowDone[bi] = true;
    else colDone[bj] = true;
  }
  return { x, log };
}

function potentialsOf(x: (number | null)[][], c: number[][]): { u: (number | null)[]; v: (number | null)[] } {
  const m = x.length;
  const n = x[0].length;
  const u: (number | null)[] = Array(m).fill(null);
  const v: (number | null)[] = Array(n).fill(null);
  u[0] = 0;
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        if (x[i][j] === null) continue;
        if (u[i] !== null && v[j] === null) {
          v[j] = c[i][j] - u[i]!;
          changed = true;
        } else if (v[j] !== null && u[i] === null) {
          u[i] = c[i][j] - v[j]!;
          changed = true;
        }
      }
  }
  return { u, v };
}

/** Цикл пересчёта от свободной клетки (r, s) по базисным клеткам (чередуя строку и столбец). */
function findCycle(x: (number | null)[][], r: number, s: number): [number, number][] | null {
  const m = x.length;
  const n = x[0].length;
  const inBasis = (i: number, j: number) => x[i][j] !== null || (i === r && j === s);
  const path: [number, number][] = [[r, s]];
  const seen = new Set<string>();
  function dfs(i: number, j: number, horizontal: boolean): boolean {
    if (horizontal) {
      for (let k = 0; k < n; k++) {
        if (k === j || !inBasis(i, k)) continue;
        if (i === r && k === s && path.length >= 4) return true;
        const key = `${i},${k}`;
        if (seen.has(key)) continue;
        seen.add(key);
        path.push([i, k]);
        if (dfs(i, k, false)) return true;
        path.pop();
        seen.delete(key);
      }
    } else {
      for (let k = 0; k < m; k++) {
        if (k === i || !inBasis(k, j)) continue;
        if (k === r && j === s && path.length >= 4) return true;
        const key = `${k},${j}`;
        if (seen.has(key)) continue;
        seen.add(key);
        path.push([k, j]);
        if (dfs(k, j, true)) return true;
        path.pop();
        seen.delete(key);
      }
    }
    return false;
  }
  return dfs(r, s, true) ? path : null;
}

export function solveTransport(inp: TransportInput, method: "least" | "northwest" = "least"): TransportResult {
  if (inp.c.length !== inp.a.length || inp.c.some((r) => r.length !== inp.b.length)) throw new Error("Размер матрицы стоимостей не совпадает с числом пунктов");
  const { a, b, c, fictitious } = balance(inp);
  const plan = initialPlan(a, b, c, method, fictitious);
  let x = plan.x;
  const initial: Step[] = [{ title: `Опорный план (${method === "least" ? "метод наименьшей стоимости" : "метод северо-западного угла"}): ${plan.log.join("; ")}`, x: clone(x), cost: total(x, c) }];
  const potentials: Step[] = [];
  for (let it = 1; it <= 50; it++) {
    const { u, v } = potentialsOf(x, c);
    const delta = x.map((r, i) => r.map((val, j) => (val !== null || u[i] === null || v[j] === null ? null : u[i]! + v[j]! - c[i][j])));
    let best: [number, number] | null = null;
    delta.forEach((r, i) => r.forEach((d, j) => {
      if (d !== null && d > 0 && (!best || d > delta[best[0]][best[1]]!)) best = [i, j];
    }));
    if (!best) {
      potentials.push({ title: `Итерация ${it}: все Δij ≤ 0 — план оптимален`, x: clone(x), cost: total(x, c), u, v, delta });
      break;
    }
    const [r, s] = best as [number, number];
    const cycle = findCycle(x, r, s);
    if (!cycle) throw new Error("Не удалось построить цикл пересчёта (вырожденный план)");
    const minus = cycle.filter((_, k) => k % 2 === 1);
    const theta = Math.min(...minus.map(([i, j]) => x[i][j] ?? 0));
    potentials.push({ title: `Итерация ${it}: max Δ = Δ${r + 1}${s + 1} = ${delta[r][s]} > 0, цикл ${cycle.map(([i, j], k) => `${k % 2 ? "−" : "+"}(${i + 1},${j + 1})`).join(" ")}, θ = ${theta}`, x: clone(x), cost: total(x, c), u, v, delta, cycle, theta });
    const nx = clone(x);
    cycle.forEach(([i, j], k) => {
      nx[i][j] = (nx[i][j] ?? 0) + (k % 2 ? -theta : theta);
    });
    // из базиса выходит одна клетка с нулём
    const out = minus.find(([i, j]) => nx[i][j] === 0)!;
    nx[out[0]][out[1]] = null;
    x = nx;
  }
  return { a, b, c, fictitious, initial, potentials, optimal: x, cost: total(x, c) };
}
