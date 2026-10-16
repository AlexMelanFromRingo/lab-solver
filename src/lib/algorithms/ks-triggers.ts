/**
 * «Комп'ютерна схемотехніка», ЛР 5 «Тригери»: очікувані часові діаграми
 * тригерів з методички (RS на 2І-НІ і 2АБО-НІ, синхронний RS, D «прозорий»
 * і DFF, JK, T) на однакових стимулах і перехід RS-тригера в наносекундах
 * з типовими затримками моделей 7400 і 7402 бібліотеки OrCAD.
 */

import type { TimingFigure, TimingSignal } from "@/lib/figures";

/** Типові затримки моделей PSpice (як у довідникових даних TI), нс. */
export const DELAYS = {
  "7400": { tPLH: 11, tPHL: 7 },
  "7402": { tPLH: 12, tPHL: 8 },
} as const;

type Lv = number | "X";

/** Сигнал з послідовності рівнів з кроком dt. */
const wave = (name: string, levels: Lv[], dt: number): TimingSignal => ({ name, changes: levels.map((v, i) => [i * dt, v] as [number, Lv]) });

// Асинхронний RS: 8 інтервалів по 1 мкс — скидання, зберігання, установка, зберігання, скидання, зберігання, 1-1, 0-0
const RS_S = [0, 0, 1, 0, 0, 0, 1, 0];
const RS_R = [1, 0, 0, 0, 1, 0, 1, 0];

/** Стан Q, Q̄ асинхронного RS-тригера по інтервалах; після забороненої комбінації — X. */
function rsStates(nand: boolean) {
  const q: Lv[] = [];
  const qn: Lv[] = [];
  let cur: Lv = 0;
  let forbidden = false;
  for (let i = 0; i < RS_S.length; i++) {
    const s = RS_S[i];
    const r = RS_R[i];
    if (s && r) {
      // 2АБО-НІ: обидва виходи 0; 2І-НІ (інверсні входи = 0): обидва 1
      q.push(nand ? 1 : 0);
      qn.push(nand ? 1 : 0);
      forbidden = true;
      continue;
    }
    if (s) cur = 1;
    else if (r) cur = 0;
    else if (forbidden) cur = "X";
    forbidden = false;
    q.push(cur);
    qn.push(cur === "X" ? "X" : 1 - cur);
  }
  return { q, qn };
}

export function rsTiming(nand: boolean): TimingFigure {
  const { q, qn } = rsStates(nand);
  const inv = (xs: number[]) => xs.map((x) => 1 - x);
  return {
    from: 0,
    to: RS_S.length,
    unit: "мкс",
    signals: nand
      ? [wave("S̄", inv(RS_S), 1), wave("R̄", inv(RS_R), 1), wave("Q", q, 1), wave("Q̄", qn, 1)]
      : [wave("S", RS_S, 1), wave("R", RS_R, 1), wave("Q", q, 1), wave("Q̄", qn, 1)],
  };
}

/** Таблиця інтервалів асинхронного RS для звіту. */
export function rsRows(nand: boolean): (string | number)[][] {
  const { q, qn } = rsStates(nand);
  const what = ["скидання", "зберігання", "установка", "зберігання", "скидання", "зберігання", "заборонена", "невизначений стан"];
  return RS_S.map((s, i) => [`${i}–${i + 1}`, nand ? 1 - s : s, nand ? 1 - RS_R[i] : RS_R[i], String(q[i]), String(qn[i]), what[i]]);
}

// Синхронні тригери: крок 0,5 мкс, 16 кроків = 8 мкс; C — меандр з періодом 1 мкс (0 у першій половині)
const DT = 0.5;
const C = Array.from({ length: 16 }, (_, i) => i % 2);
const SR_S = [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0];
const SR_R = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0];
// JK: значення на період (2 кроки), спрацювання — за спадом C (74107)
const J_IN = [0, 1, 0, 1, 1, 0, 1, 0];
const K_IN = [0, 0, 1, 1, 1, 0, 0, 1];

export function syncRsTiming(): TimingFigure {
  const q: number[] = [];
  let cur = 0;
  for (let i = 0; i < C.length; i++) {
    if (C[i]) {
      if (SR_S[i]) cur = 1;
      else if (SR_R[i]) cur = 0;
    }
    q.push(cur);
  }
  return { from: 0, to: 8, unit: "мкс", signals: [wave("C", C, DT), wave("S", SR_S, DT), wave("R", SR_R, DT), wave("Q", q, DT)] };
}

// D-тригери: крок 0,25 мкс, C високий у другій половині кожної мікросекунди; D змінюється й посеред C = 1
const DQ = 0.25;
const C4 = Array.from({ length: 32 }, (_, i) => (i % 4 >= 2 ? 1 : 0));
const D4 = [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0];

export function dTiming(): TimingFigure {
  const latch: number[] = [];
  const ff: number[] = [];
  let l = 0;
  let f = 0;
  for (let i = 0; i < C4.length; i++) {
    if (C4[i]) l = D4[i];
    if (C4[i] && !C4[i - 1]) f = D4[i];
    latch.push(l);
    ff.push(f);
  }
  return {
    from: 0,
    to: 8,
    unit: "мкс",
    signals: [wave("C", C4, DQ), wave("D", D4, DQ), { ...wave("Q", latch, DQ), name: "Q_D" }, { ...wave("Q", ff, DQ), name: "Q_DFF" }],
  };
}

/** Інтервали рівня 1 для Stimulus Editor: «з 0,5 до 1,5 мкс, …». */
function ones(levels: number[], dt: number) {
  const out: string[] = [];
  for (let i = 0; i < levels.length; i++) {
    if (!levels[i] || levels[i - 1]) continue;
    let j = i;
    while (j + 1 < levels.length && levels[j + 1]) j++;
    out.push(`з ${String(i * dt).replace(".", ",")} до ${String((j + 1) * dt).replace(".", ",")}`);
  }
  return `1 ${out.join(", ")} мкс, інакше 0`;
}

/** Стимули всіх діаграм — тим самим текстом, що й на рисунках. */
export function stimuliText(): string[] {
  return [
    "Асинхронний RS (Digital, Signal; час моделювання 8 мкс):",
    `  S: ${ones(RS_S, 1)}`,
    `  R: ${ones(RS_R, 1)}`,
    "  для 2І-НІ — інверсні значення (S̄, R̄)",
    "Синхронні тригери (час моделювання 8 мкс), C: Clock, період 1 мкс, скважність 50 %, початкове 0:",
    `  S: ${ones(SR_S, DT)}`,
    `  R: ${ones(SR_R, DT)}`,
    `  D: ${ones(D4, DQ)}`,
    `  J і K — значення на кожну мікросекунду: J = ${J_IN.join(" ")}, K = ${K_IN.join(" ")}`,
  ];
}

/** JK (і T при J = K = 1) за спадом C, як 74107. */
export function jkTiming(): TimingFigure {
  const j: number[] = [];
  const k: number[] = [];
  const q: number[] = [];
  const t: number[] = [];
  let cur = 0;
  let tq = 0;
  for (let i = 0; i < C.length; i++) {
    const p = Math.floor(i / 2);
    j.push(J_IN[p]);
    k.push(K_IN[p]);
    // спад: перехід 1 → 0 на початку періоду; J і K — з попереднього періоду
    if (i > 0 && C[i - 1] === 1 && C[i] === 0) {
      const jj = J_IN[p - 1];
      const kk = K_IN[p - 1];
      cur = jj && kk ? 1 - cur : jj ? 1 : kk ? 0 : cur;
      tq = 1 - tq;
    }
    q.push(cur);
    t.push(tq);
  }
  return { from: 0, to: 8, unit: "мкс", signals: [wave("C", C, DT), wave("J", j, DT), wave("K", k, DT), wave("Q", q, DT), { ...wave("Q", t, DT), name: "Q_T" }] };
}

/** Рядки «спад C → дія» для JK. */
export function jkRows(): (string | number)[][] {
  const rows: (string | number)[][] = [];
  let cur = 0;
  for (let p = 0; p < J_IN.length - 1; p++) {
    const jj = J_IN[p];
    const kk = K_IN[p];
    const next = jj && kk ? 1 - cur : jj ? 1 : kk ? 0 : cur;
    rows.push([`${p + 1}`, jj, kk, cur, next, jj && kk ? "перемикання" : jj ? "установка" : kk ? "скидання" : "зберігання"]);
    cur = next;
  }
  return rows;
}

/** Перехід асинхронного RS у нс: від зміни входу до встановлення обох виходів. */
export function rsZoom(nand: boolean): { fig: TimingFigure; tMin: number } {
  const d = DELAYS[nand ? "7400" : "7402"];
  // 2АБО-НІ, S: 0 → 1 — спершу падає Q̄ (tPHL), потім росте Q (tPLH)
  // 2І-НІ, S̄: 1 → 0 — спершу росте Q (tPLH), потім падає Q̄ (tPHL)
  const t1 = nand ? d.tPLH : d.tPHL;
  const tMin = d.tPLH + d.tPHL;
  const sig: TimingSignal[] = nand
    ? [
        { name: "S̄", changes: [[-10, 1], [0, 0]] },
        { name: "Q", changes: [[-10, 0], [t1, 1]] },
        { name: "Q̄", changes: [[-10, 1], [tMin, 0]] },
      ]
    : [
        { name: "S", changes: [[-10, 0], [0, 1]] },
        { name: "Q̄", changes: [[-10, 1], [t1, 0]] },
        { name: "Q", changes: [[-10, 0], [tMin, 1]] },
      ];
  return { fig: { from: -10, to: 40, unit: "нс", signals: sig, ticks: [-10, 0, 10, 20, 30, 40] }, tMin };
}
