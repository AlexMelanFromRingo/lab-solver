/**
 * Рисунки к работам по схемотехнике: логическая схема варианта в условных
 * обозначениях ДСТУ (ГОСТ 2.743-91: прямоугольник с «&», «1», кружок
 * инверсии на выходе), ожидаемые временные диаграммы (ЛР 3, ЛР 6) и
 * переходные процессы RC-цепочек (ЛР 2).
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import type { PlotFigure, TimingFigure, TimingSignal } from "@/lib/figures";
import { hex, sequence, transition, type Formula, type Gate, type Mode } from "./schematics";

const FN: Record<string, { sym: string; inv: boolean; f: (x: number[]) => number }> = {
  "7408": { sym: "&", inv: false, f: (x) => Number(x.every(Boolean)) },
  "7411": { sym: "&", inv: false, f: (x) => Number(x.every(Boolean)) },
  "7400": { sym: "&", inv: true, f: (x) => Number(!x.every(Boolean)) },
  "7410": { sym: "&", inv: true, f: (x) => Number(!x.every(Boolean)) },
  "7432": { sym: "1", inv: false, f: (x) => Number(x.some(Boolean)) },
  "7402": { sym: "1", inv: true, f: (x) => Number(!x.some(Boolean)) },
  "7427": { sym: "1", inv: true, f: (x) => Number(!x.some(Boolean)) },
  "7404": { sym: "1", inv: true, f: (x) => 1 - x[0] },
};

/** Значения всех кіл (входов, промежуточных, выхода) при данных входах. */
export function evalNets(f: Formula, gates: Gate[], inputs: number[]): Record<string, number> {
  const env: Record<string, number> = {};
  f.vars.forEach((v, i) => (env[v] = inputs[i]));
  for (const g of gates) env[g.output] = FN[g.part].f(g.inputs.map((x) => env[x]));
  return env;
}

/**
 * Логическая схема «лесенкой»: каждый элемент — в своей полосе по высоте,
 * по горизонтали — в столбце своей глубины. Так горизонтальные подводы ко
 * входам не пересекают чужие элементы. Входные переменные — вертикальные
 * шины слева.
 */
export function logicDiagram(f: Formula, gates: Gate[], label: (g: Gate) => string = (g) => `${g.ref} ${g.part}`): Drawing {
  const items: DrawItem[] = [];
  const RAIL = 22;
  const railX = (i: number) => 24 + i * RAIL;
  const x0 = railX(f.vars.length - 1) + 50;
  const COL = 120;
  const BW = 36;
  const PIN = 16;
  const depth: Record<string, number> = {};
  f.vars.forEach((v) => (depth[v] = 0));
  const outPos: Record<string, [number, number]> = {};
  const pins: { net: string; x: number; y: number; gate: number }[] = [];
  let y = 30;
  gates.forEach((g, gi) => {
    const d = 1 + Math.max(...g.inputs.map((i) => depth[i] ?? 0));
    depth[g.output] = d;
    const h = Math.max(g.inputs.length, 2) * PIN + 8;
    const x = x0 + (d - 1) * COL;
    const fn = FN[g.part];
    items.push({ k: "rect", x, y, w: BW, h });
    items.push({ k: "text", x: x + BW / 2, y: y + 14, text: fn.sym, anchor: "middle", size: 12 });
    items.push({ k: "text", x: x + BW / 2, y: y - 4, text: label(g), anchor: "middle", size: 9 });
    const oy = y + h / 2;
    const ox = x + BW + (fn.inv ? 7 : 0);
    if (fn.inv) items.push({ k: "circle", x: x + BW + 3.5, y: oy, r: 3.5 });
    items.push({ k: "line", pts: [[ox, oy], [x + BW + 16, oy]] });
    outPos[g.output] = [x + BW + 16, oy];
    const top = y + h / 2 - ((g.inputs.length - 1) * PIN) / 2;
    g.inputs.forEach((net, k) => {
      const py = top + k * PIN;
      items.push({ k: "line", pts: [[x - 10, py], [x, py]] });
      pins.push({ net, x: x - 10, y: py, gate: gi });
    });
    y += h + 26;
  });
  const bottom = y - 10;

  // Шины входных переменных
  f.vars.forEach((v, i) => {
    items.push({ k: "text", x: railX(i), y: 16, text: v, anchor: "middle", italic: true });
    items.push({ k: "line", pts: [[railX(i), 22], [railX(i), bottom]] });
  });

  // Подводы: от шины — горизонталь; от выхода элемента — через свой канал
  const channel: Record<string, number> = {};
  const perCol: Record<number, number> = {};
  for (const p of pins) {
    const vi = f.vars.indexOf(p.net);
    if (vi >= 0) {
      items.push({ k: "line", pts: [[railX(vi), p.y], [p.x, p.y]] });
      items.push({ k: "dot", x: railX(vi), y: p.y });
      continue;
    }
    const [sx, sy] = outPos[p.net];
    if (channel[p.net] === undefined) {
      const d = depth[p.net];
      perCol[d] = (perCol[d] ?? 0) + 1;
      channel[p.net] = sx + 6 + perCol[d] * 8;
    }
    const cx = channel[p.net];
    items.push({ k: "line", pts: [[sx, sy], [cx, sy], [cx, p.y], [p.x, p.y]] });
  }
  // Точки ветвления, где выход идёт на несколько входов
  for (const net of Object.keys(channel)) if (pins.filter((p) => p.net === net).length > 1) items.push({ k: "dot", x: channel[net], y: outPos[net][1] });

  // Промежуточные кола и выход
  let w = x0;
  for (const g of gates) {
    const [ox, oy] = outPos[g.output];
    w = Math.max(w, ox);
    if (g.output === f.out) {
      items.push({ k: "line", pts: [[ox, oy], [ox + 30, oy]] });
      items.push({ k: "text", x: ox + 34, y: oy + 4, text: f.out, italic: true });
      w = Math.max(w, ox + 50);
    } else items.push({ k: "text", x: ox - 2, y: oy - 6, text: g.output, anchor: "end", size: 9 });
  }
  return { w: w + 10, h: bottom + 6, items };
}

/** ЛР 3: входы — Clock с периодами T, T/2…, промежуточные кола и выход без задержек. */
export function lab3Timing(f: Formula, gates: Gate[], T: number): TimingFigure {
  const nv = f.vars.length;
  const slots = 1 << nv;
  const slot = T / slots;
  const states = Array.from({ length: slots }, (_, i) => evalNets(f, gates, f.vars.map((_, k) => (i >> (nv - 1 - k)) & 1)));
  const sig = (name: string, label: string): TimingSignal => {
    const changes: [number, number][] = [];
    states.forEach((st, i) => {
      if (i === 0 || st[name] !== states[i - 1][name]) changes.push([i * slot, st[name]]);
    });
    return { name: label, changes };
  };
  return {
    from: 0,
    to: T,
    unit: "мкс",
    signals: [...f.vars.map((v) => sig(v, v.toLowerCase())), ...gates.filter((g) => g.output !== f.out).map((g) => sig(g.output, g.output)), sig(f.out, f.out.toLowerCase())],
  };
}

/** ЛР 2: вход — меандр 0…v (первый полупериод — импульс), выходы интегрирующей и дифференцирующей цепочек. */
export function rcPlots(tau: number, period: number, m: number, v = 5): { int: PlotFigure; dif: PlotFigure } {
  const half = period / 2;
  const x: [number, number][] = [];
  const yi: [number, number][] = [];
  const yd: [number, number][] = [];
  let vc = 0;
  const N = 24;
  for (let h = 0; h < 2 * m; h++) {
    const lvl = h % 2 ? 0 : v;
    const t0 = h * half;
    x.push([t0, lvl], [t0 + half, lvl]);
    for (let j = 0; j <= N; j++) {
      const t = (j / N) * half;
      const c = lvl + (vc - lvl) * Math.exp(-t / tau);
      yi.push([t0 + t, c]);
      yd.push([t0 + t, lvl - c]);
    }
    vc = lvl + (vc - lvl) * Math.exp(-half / tau);
  }
  const axis = { x: { label: "t", unit: "мкс" }, y: { label: "U", unit: "В" } };
  const inp = { label: "X (вхід)", points: x, dashed: true, markers: false };
  return {
    int: { ...axis, series: [inp, { label: "Y (вихід)", points: yi, markers: false }] },
    dif: { ...axis, series: [inp, { label: "Y (вихід)", points: yd, markers: false }] },
  };
}

/** ЛР 6: Clk, Rst, Q і Y за 9 періодів (масштаб мкс — затримки в нс не видно). */
export function lab6Timing(mode: Mode, T: number, data: number[] = []): TimingFigure {
  const q = sequence(mode, 9, data);
  const edge = (k: number) => T / 2 + k * T;
  const y = (s: number) => hex(Number(transition("reg", s, s).at(-1)!.y));
  const clk: [number, number][] = [];
  for (let k = 0; k < 9; k++) clk.push([k * T, 0], [k * T + T / 2, 1]);
  const signals: TimingSignal[] = [
    { name: "Clk", changes: clk },
    { name: "Rst", changes: [[0, 0], [T / 4, 1]] },
  ];
  if (mode === "reg") {
    signals.push({ name: "D", bus: true, changes: data.slice(0, 9).map((d, k) => [k * T, String(d & 3)] as [number, string]) });
  }
  signals.push(
    { name: "Q", bus: true, changes: [[0, "0"], ...q.map((s, k) => [edge(k), String(s)] as [number, string])] },
    { name: "Y", bus: true, changes: [[0, "E"], ...q.map((s, k) => [edge(k), y(s)] as [number, string])] },
  );
  return { from: 0, to: 9 * T, unit: "мкс", signals };
}

/** ЛР 6: растянутый фрагмент у фронта Clk — хибні комбінації на шинах Q і Y (нс). */
export function lab6Zoom(mode: Mode, from: number, d = 0): TimingFigure {
  const steps = transition(mode, from, d);
  const end = Math.max(...steps.map((s) => s.t)) + 20;
  const dedup = (f: (s: (typeof steps)[number]) => string) =>
    steps.filter((s, i) => i === 0 || f(s) !== f(steps[i - 1])).map((s, i) => [i ? s.t : -10, f(s)] as [number, string]);
  return {
    from: -10,
    to: end,
    unit: "нс",
    signals: [
      { name: "Clk", changes: [[-10, 0], [0, 1]] },
      { name: "Q", bus: true, changes: dedup((s) => String(s.q)) },
      { name: "Y", bus: true, changes: dedup((s) => hex(s.y)) },
    ],
  };
}
