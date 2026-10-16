/**
 * «Комп'ютерна схемотехніка», ЛР 11: ППА КР580ВВ55А на УМК. Очікувані
 * осцилограми трьох циклічних програм методички, змодельовані за машинними
 * циклами КР580ВМ80 (8080): M1 — вибірка коду (4 такти), читання пам'яті —
 * 3 такти, введення/виведення — 3 такти; CS — лише в циклі звернення до
 * портів 90H…93H, WR чи RD — у тактах T2–T3 цього циклу.
 */

import type { TimingFigure, TimingSignal } from "@/lib/figures";

export const BASE = 0x90;

interface Cycle {
  kind: "fetch" | "read" | "out" | "in";
  addr: number;
  data: number;
  t: number;
}

/** Машинні цикли одного проходу циклу програми. */
export function loopCycles(prog: 1 | 2 | 3, cw = 0x80, acc = 0x55, pb0 = 0): { cycles: Cycle[]; label: string } {
  const f = (addr: number, data: number): Cycle => ({ kind: "fetch", addr, data, t: 4 });
  const r = (addr: number, data: number): Cycle => ({ kind: "read", addr, data, t: 3 });
  if (prog === 1)
    return {
      label: "OUT 93H; JMP M1",
      cycles: [f(0x0802, 0xd3), r(0x0803, 0x93), { kind: "out", addr: 0x93, data: cw, t: 3 }, f(0x0804, 0xc3), r(0x0805, 0x02), r(0x0806, 0x08)],
    };
  if (prog === 2)
    return {
      label: "OUT 90H; RRC; JMP M2",
      cycles: [f(0x0806, 0xd3), r(0x0807, 0x90), { kind: "out", addr: 0x90, data: acc, t: 3 }, f(0x0808, 0x0f), f(0x0809, 0xc3), r(0x080a, 0x06), r(0x080b, 0x08)],
    };
  return {
    label: "IN 91H; JMP M3",
    cycles: [f(0x0804, 0xdb), r(0x0805, 0x91), { kind: "in", addr: 0x91, data: pb0 ? 0xff : 0xfe, t: 3 }, f(0x0806, 0xc3), r(0x0807, 0x04), r(0x0808, 0x08)],
  };
}

export const tStates = (cs: Cycle[]) => cs.reduce((s, c) => s + c.t, 0);

/** Осцилограма за `loops` проходів; такт — `tk` мкс. */
export function ppaTiming(prog: 1 | 2 | 3, opts: { cw?: number; pb0?: number; loops?: number; tk?: number } = {}): TimingFigure {
  const tk = opts.tk ?? 0.5;
  const loops = opts.loops ?? (prog === 2 ? 2 : 1);
  const cs: [number, number][] = [[0, 1]];
  const strobe: [number, number][] = [[0, 1]];
  const a0: [number, number][] = [];
  const a1: [number, number][] = [];
  const d0: [number, number][] = [];
  const pa0: [number, number][] = [];
  let acc = 0x55;
  let pa = 0x55 & 1;
  pa0.push([0, prog === 2 ? 1 - pa : 0]);
  let t = 0;
  for (let k = 0; k < loops; k++) {
    const { cycles } = loopCycles(prog, opts.cw ?? 0x80, acc, opts.pb0 ?? 0);
    for (const c of cycles) {
      a0.push([t, c.addr & 1]);
      a1.push([t, (c.addr >> 1) & 1]);
      d0.push([t, c.data & 1]);
      if (c.kind === "out" || c.kind === "in") {
        cs.push([t, 0], [t + c.t * tk, 1]);
        strobe.push([t + tk, 0], [t + c.t * tk, 1]);
        // порт A фіксує дані по закінченні WR
        if (prog === 2) {
          pa = c.data & 1;
          pa0.push([t + c.t * tk, pa]);
        }
      }
      if (prog === 2 && c.kind === "fetch" && c.data === 0x0f) acc = ((acc >> 1) | ((acc & 1) << 7)) & 0xff;
      t += c.t * tk;
    }
  }
  const signals: TimingSignal[] = [
    { name: "CS", changes: cs },
    { name: prog === 3 ? "RD" : "WR", changes: strobe },
    { name: "A0", changes: a0 },
    { name: "A1", changes: a1 },
    { name: "D0", changes: d0 },
  ];
  if (prog === 2) signals.push({ name: "PA0", changes: pa0 });
  if (prog === 3) signals.push({ name: "PB0", changes: [[0, opts.pb0 ?? 0]] });
  return { from: 0, to: t, unit: "мкс", signals };
}

/** Розбір керуючого слова режиму (D7 = 1). */
export function controlWord(cw: number): (string | number)[][] {
  const b = (i: number) => (cw >> i) & 1;
  return [
    ["D7", b(7), "1 — слово задання режимів"],
    ["D6 D5", `${b(6)}${b(5)}`, `режим групи A: ${b(6) ? "2" : b(5) ? "1" : "0"}`],
    ["D4", b(4), `порт A — ${b(4) ? "введення" : "виведення"}`],
    ["D3", b(3), `PC7–PC4 — ${b(3) ? "введення" : "виведення"}`],
    ["D2", b(2), `режим групи B: ${b(2)}`],
    ["D1", b(1), `порт B — ${b(1) ? "введення" : "виведення"}`],
    ["D0", b(0), `PC3–PC0 — ${b(0) ? "введення" : "виведення"}`],
  ];
}
