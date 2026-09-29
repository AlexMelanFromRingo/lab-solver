/**
 * Рисунки к работам по ПЛІС: логическая схема варианта (ЛР 1–2), ожидаемые
 * временные диаграммы стендов (ЛР 2–4, КР), функциональная схема упрощённого
 * вычислителя и диаграмма состояний его автомата (КР).
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import type { TimingFigure, TimingSignal } from "@/lib/figures";
import { truthTable } from "./schematics";
import { RG, cpuLayout, cpuProgram, formula, lab3Expected, lab4Expected, periodNs } from "./vhdl";

const hex = (x: number) => x.toString(16).toUpperCase();

/** ЛР 2: стенд перебирает комбинации — младший вход каждые 10 нс, старший — каждые 10·2ⁿ⁻¹ нс. */
export function lab2Timing(v: number): TimingFigure {
  const f = formula(v);
  const rows = truthTable(f);
  const sig = (name: string, val: (i: number) => number): TimingSignal => {
    const changes: [number, number][] = [];
    rows.forEach((_, i) => {
      if (i === 0 || val(i) !== val(i - 1)) changes.push([i * 10, val(i)]);
    });
    return { name, changes };
  };
  return {
    from: 0,
    to: 10 * rows.length,
    unit: "нс",
    signals: [...f.vars.map((x, k) => sig(x, (i) => rows[i].inputs[k])), sig(f.out, (i) => rows[i].out)],
  };
}

/** ЛР 3: такт 40 нс (фронты 20, 60…), Rst до 30 нс, D или Din — как в стенде, Q — по фронтам. */
export function lab3Timing(odd: boolean): TimingFigure {
  const clk: [number, number][] = [];
  for (let t = 0; t < 320; t += 40) clk.push([t, 0], [t + 20, 1]);
  const exp = lab3Expected(odd);
  // Процесс со сбросом в списке чувствительности выполняется и в момент 0: при Rst = 1 Q = 0 сразу.
  const q: [number, string][] = [[0, odd ? "00" : "000"], ...exp.map((e) => [e.t, e.q] as [number, string])];
  const data: TimingSignal = odd
    ? { name: "D", bus: true, changes: [[0, "00"], [50, "01"], [130, "10"], [210, "11"], [290, "00"]] }
    : { name: "Din", changes: [[0, 0], [50, 1], [90, 0], [130, 1], [210, 0]] };
  return {
    from: 0,
    to: 320,
    unit: "нс",
    signals: [{ name: "Clk", changes: clk }, { name: "Rst", changes: [[0, 1], [30, 0]] }, data, { name: "Q", bus: true, changes: q }],
  };
}

/** ЛР 4: стенд универсального регистра или счётчика по варианту (полярности входов — из таблицы). */
export function lab4Timing(v: number, unit: "rg" | "ct"): TimingFigure {
  const r = RG[v - 1];
  const T = periodNs(r.mhz);
  const e = lab4Expected(v);
  const act = (p: boolean) => (p ? 1 : 0);
  const clk: [number, number][] = [];
  for (let k = 0; k <= 10; k++) clk.push([k * T, r.clk ? 0 : 1], [k * T + T / 2, r.clk ? 1 : 0]);
  const edge = (k: number) => T / 2 + (k - 1) * T;
  const signals: TimingSignal[] = [
    { name: "Clk", changes: clk },
    { name: "Rst", changes: [[0, act(r.rst)], [T / 4, 1 - act(r.rst)]] },
    { name: "Load", changes: [[0, 1 - act(r.load)], [T / 4, act(r.load)], [T + T / 4, 1 - act(r.load)]] },
    { name: "Direct", changes: [[0, act(r.direct)], [5 * T + T / 4, 1 - act(r.direct)]] },
    { name: "En", changes: [[0, act(r.en)], [9 * T + T / 4, 1 - act(r.en)]] },
    { name: "Q", bus: true, changes: [[0, "0"], ...e.rows.map((x) => [edge(x.k), hex(unit === "rg" ? x.rg : x.ct)] as [number, string])] },
  ];
  return { from: 0, to: 10.5 * T, unit: "нс", signals };
}

/** КР: такт 20 нс, Rst до 15 нс; на команду три фронта — FETCH, EXEC, NEXT_ADDR. */
export function cpuTiming(v: number, commands = 3): TimingFigure {
  const c = cpuLayout(v);
  const prog = cpuProgram(v);
  const word = (i: number) => (prog[i].code << (2 * c.k)) | (prog[i].a << c.k) | prog[i].b;
  const end = 30 + commands * 60 + 10;
  const clk: [number, number][] = [];
  for (let t = 0; t < end; t += 20) clk.push([t, 0], [t + 10, 1]);
  const state: [number, string][] = [[0, "FETCH"]];
  const pc: [number, string][] = [[0, "0"]];
  const ir: [number, string][] = [[0, "U"]];
  const y: [number, string][] = [[0, "0"]];
  for (let i = 0; i < commands; i++) {
    const t = 30 + i * 60;
    state.push([t, "EXEC"], [t + 20, "NEXT_ADDR"], [t + 40, "FETCH"]);
    ir.push([t, hex(word(i % c.n))]);
    y.push([t + 20, hex(prog[i % c.n].y)]);
    pc.push([t + 40, String((i + 1) % c.n)]);
  }
  return {
    from: 0,
    to: end,
    unit: "нс",
    signals: [
      { name: "Clk", changes: clk },
      { name: "Rst", changes: [[0, 1], [15, 0]] },
      { name: "state", bus: true, changes: state },
      { name: "PC", bus: true, changes: pc },
      { name: "IR", bus: true, changes: ir },
      { name: "Y", bus: true, changes: y },
    ],
  };
}

/** КР: диаграмма состояний — три состояния по кругу, переходы по фронту Clk, сброс в FETCH. */
export function cpuStates(): Drawing {
  const items: DrawItem[] = [];
  const R = 34;
  const S = [
    { x: 250, y: 70, name: "FETCH", act: ["IR ← ROM(PC)"] },
    { x: 400, y: 230, name: "EXEC", act: ["Y ← ALP(KOP, Op1, Op2)"] },
    { x: 100, y: 230, name: "NEXT_ADDR", act: ["PC ← PC + 1", "(після N−1 — 0)"] },
  ];
  S.forEach((s) => {
    items.push({ k: "circle", x: s.x, y: s.y, r: R });
    items.push({ k: "text", x: s.x, y: s.y + 4, text: s.name, anchor: "middle", size: s.name.length > 6 ? 9.5 : 11, bold: true, plain: true });
  });
  const arc = (a: (typeof S)[number], b: (typeof S)[number]) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const ux = dx / d;
    const uy = dy / d;
    items.push({ k: "line", pts: [[a.x + ux * R, a.y + uy * R], [b.x - ux * (R + 2), b.y - uy * (R + 2)]], arrow: true });
    return [(a.x + b.x) / 2, (a.y + b.y) / 2] as [number, number];
  };
  const m1 = arc(S[0], S[1]);
  const m2 = arc(S[1], S[2]);
  const m3 = arc(S[2], S[0]);
  items.push({ k: "text", x: m1[0] + 10, y: m1[1] - 6, text: "Clk↑", italic: true, size: 11 });
  items.push({ k: "text", x: m2[0], y: m2[1] + 16, text: "Clk↑", italic: true, size: 11, anchor: "middle" });
  items.push({ k: "text", x: m3[0] - 10, y: m3[1] - 6, text: "Clk↑", italic: true, size: 11, anchor: "end" });
  // Сброс
  items.push({ k: "line", pts: [[250, 8], [250, 70 - R - 2]], arrow: true });
  items.push({ k: "text", x: 256, y: 20, text: "Rst = 1 (асинхронно, PC ← 0, Y ← 0)", size: 10 });
  // Действия
  items.push({ k: "text", x: 250 + R + 8, y: 74, text: S[0].act[0], size: 10 });
  items.push({ k: "text", x: 400, y: 230 + R + 16, text: S[1].act[0], size: 10, anchor: "middle" });
  items.push({ k: "text", x: 100, y: 230 + R + 16, text: S[2].act[0], size: 10, anchor: "middle" });
  items.push({ k: "text", x: 100, y: 230 + R + 29, text: S[2].act[1], size: 10, anchor: "middle" });
  return { w: 500, h: 310, items };
}

/** КР: функциональная схема — PC адресует ROM, команда в IR, поля KOP/Op1/Op2 в АЛП, результат — Y; автомат управляет. */
export function cpuScheme(v: number): Drawing {
  const c = cpuLayout(v);
  const items: DrawItem[] = [];
  const box = (x: number, y: number, w: number, h: number, title: string, sub?: string) => {
    items.push({ k: "rect", x, y, w, h, bold: true });
    items.push({ k: "text", x: x + w / 2, y: y + h / 2 + (sub ? -2 : 4), text: title, anchor: "middle", bold: true, size: 12 });
    if (sub) items.push({ k: "text", x: x + w / 2, y: y + h / 2 + 13, text: sub, anchor: "middle", size: 9.5 });
  };
  box(20, 150, 80, 50, "PC", `${c.pcBits} біт`);
  box(150, 140, 110, 70, "ROM", `${c.n} × ${c.m} біт`);
  box(310, 140, 90, 70, "IR", `${c.m} біт`);
  box(470, 130, 110, 90, "АЛП", `${c.ops.length} операцій`);
  box(630, 150, 70, 50, "Y", `${c.k} біт`);
  box(250, 20, 150, 56, "Автомат", "FETCH → EXEC → NEXT");
  const ln = (pts: [number, number][], text?: string, tx?: number, ty?: number) => {
    items.push({ k: "line", pts, arrow: true });
    if (text) items.push({ k: "text", x: tx ?? pts[0][0], y: ty ?? pts[0][1] - 5, text, size: 9.5 });
  };
  ln([[100, 175], [150, 175]], "адреса", 104, 169);
  ln([[260, 175], [310, 175]], "команда", 262, 169);
  ln([[400, 150], [470, 150]], `KOP (${c.opBits})`, 404, 145);
  ln([[400, 175], [470, 175]], `Op1 (${c.k})`, 404, 170);
  ln([[400, 200], [470, 200]], `Op2 (${c.k})`, 404, 195);
  ln([[580, 175], [630, 175]]);
  ln([[700, 175], [740, 175]], "Y", 728, 169);
  // Управление от автомата
  ln([[270, 76], [270, 110], [355, 110], [355, 140]], "завантаження IR", 290, 104);
  ln([[380, 76], [380, 96], [525, 96], [525, 130]], "виконання, запис Y", 430, 90);
  ln([[250, 48], [60, 48], [60, 150]], "PC + 1", 70, 42);
  items.push({ k: "text", x: 410, y: 28, text: "Clk, Rst", size: 10 });
  items.push({ k: "line", pts: [[460, 36], [402, 36]], arrow: true });
  return { w: 750, h: 240, items };
}
