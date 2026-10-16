/**
 * Графики к работам по охране труда: КПО от расстояния до окна с линией
 * нормы (ЛР3, п. 6), уровни звукового давления Lвим и Lдоп по октавным
 * полосам с выделенными полосами превышения (ЛР4), производительность
 * вентустановки от загрязнения фильтра (ЛР6).
 */

import { fmtNum, type PlotFigure } from "@/lib/figures";
import type { Drawing, DrawItem } from "@/lib/drawing";

/** ЛР3: e(L) по точкам 1, 2, 3… м от окна и линия eнорм. */
export function lightPlot(e: number[], norm: number): PlotFigure {
  return {
    x: { label: "L", unit: "м" },
    y: { label: "e", unit: "%" },
    series: [{ label: "фактичний КПО", points: e.map((v, i) => [i + 1, v] as [number, number]), values: true }],
    hlines: [{ y: norm, label: `e_норм = ${fmtNum(norm, 2)} %` }],
    smooth: true,
  };
}

/** ЛР4: октавные полосы 31,5…8000 Гц — равный шаг по оси, как на логарифмической шкале частот. */
export function noisePlot(freq: string[], measured: number[], allowed: number[]): PlotFigure {
  const n = freq.length;
  const over = measured.slice(0, n).map((m, i) => m - allowed[i]);
  const shade: { from: number; to: number; label?: string }[] = [];
  for (let i = 0; i < n; i++) {
    if (over[i] <= 0) continue;
    let j = i;
    while (j + 1 < n && over[j + 1] > 0) j++;
    shade.push({ from: i - 0.5, to: j + 0.5, label: `+${Math.max(...over.slice(i, j + 1))} дБ` });
    i = j;
  }
  return {
    x: { label: "f", unit: "Гц" },
    y: { label: "L", unit: "дБ" },
    xTicks: freq.map((label, at) => ({ at, label })),
    series: [
      { label: "L_вим", points: measured.slice(0, n).map((v, i) => [i, v] as [number, number]) },
      { label: "L_доп", points: allowed.slice(0, n).map((v, i) => [i, v] as [number, number]), dashed: true },
    ],
    shade,
  };
}

/** ЛР6: L при загрязнении фильтра 0, 25 и 50 %. */
export function ventPlot(l: number[]): PlotFigure {
  return {
    x: { label: "Забруднення фільтра", unit: "%" },
    y: { label: "L", unit: "м³/год" },
    series: [{ label: "продуктивність", points: l.map((v, i) => [i * 25, v] as [number, number]), values: true }],
  };
}

/**
 * ЛР5, рис. 2.1: схеми електричної пожежної сигналізації — а) променева (кожен промінь — пара проводів,
 * 3–4 сповіщувачі між ними), б) кільцева (сповіщувачі послідовно в шлейфі, обидва кінці — на станції).
 * Позначення за методичкою: 1 — сповіщувачі, 2 — приймальна станція, 3 — живлення від мережі,
 * 4 — резервне живлення, 5 — перемикання живлення, 6 — лінії зв'язку.
 */
export function alarmSchemes(): Drawing {
  const items: DrawItem[] = [];
  const T = (x: number, y: number, text: string, o: Partial<{ anchor: "start" | "middle" | "end"; size: number; bold: boolean; italic: boolean }> = {}) =>
    items.push({ k: "text", x, y, text, plain: true, size: o.size ?? 11, anchor: o.anchor, bold: o.bold, italic: o.italic });
  const station = (x: number) => {
    items.push({ k: "rect", x, y: 40, w: 64, h: 150, bold: true });
    T(x + 32, 120, "2", { anchor: "middle", bold: true, size: 13 });
    // блоки живлення під станцією
    items.push({ k: "rect", x: x - 6, y: 214, w: 34, h: 26 });
    T(x + 11, 231, "3", { anchor: "middle" });
    items.push({ k: "rect", x: x + 36, y: 214, w: 34, h: 26 });
    T(x + 53, 231, "4", { anchor: "middle" });
    items.push({ k: "rect", x: x + 14, y: 196, w: 36, h: 12, soft: true });
    T(x + 32, 206, "5", { anchor: "middle", size: 9 });
    items.push({ k: "line", pts: [[x + 11, 214], [x + 11, 208], [x + 14, 208]] });
    items.push({ k: "line", pts: [[x + 53, 214], [x + 53, 208], [x + 50, 208]] });
    items.push({ k: "line", pts: [[x + 32, 196], [x + 32, 190]] });
  };
  // а) променева
  const ax = 30;
  station(ax);
  [62, 112, 162].forEach((y, r) => {
    const x0 = ax + 64;
    const x1 = 400;
    items.push({ k: "line", pts: [[x0, y - 8], [x1, y - 8]] });
    items.push({ k: "line", pts: [[x0, y + 8], [x1, y + 8]] });
    [170, 255, 340].forEach((cx) => {
      items.push({ k: "line", pts: [[cx, y - 8], [cx, y - 3]] });
      items.push({ k: "line", pts: [[cx, y + 3], [cx, y + 8]] });
      items.push({ k: "circle", x: cx, y, r: 6 });
    });
    if (r === 0) {
      T(178, y - 14, "1", { size: 10 });
      T(120, y - 14, "6", { size: 10 });
    }
  });
  T(215, 270, "а) променева: кожен промінь — окрема пара проводів", { anchor: "middle", italic: true });
  // б) кільцева
  const bx = 470;
  station(bx);
  const top = 70;
  const bottom = 160;
  const right = 850;
  items.push({ k: "line", pts: [[bx + 64, top], [right, top], [right, bottom], [bx + 64, bottom]] });
  [600, 700, 800].forEach((cx) => {
    items.push({ k: "circle", x: cx, y: top, r: 6 });
    items.push({ k: "circle", x: cx, y: bottom, r: 6 });
  });
  T(608, top - 12, "1", { size: 10 });
  T(560, top - 12, "6", { size: 10 });
  T(660, 270, "б) кільцева: шлейф до 50 сповіщувачів, початок і кінець — на станції", { anchor: "middle", italic: true });
  return { w: 880, h: 290, items };
}

/**
 * ЛР5, розділ 2: спринклерна установка (головки з легкоплавкими замками, мережа під водою або повітрям,
 * контрольно-сигнальний клапан) і дренчерна (головки відкриті, мережа суха, клапан групової дії
 * відкривається автоматично чи вручну, спускний вентиль).
 */
export function waterSystems(): Drawing {
  const items: DrawItem[] = [];
  const T = (x: number, y: number, text: string, o: Partial<{ anchor: "start" | "middle" | "end"; size: number; italic: boolean; bold: boolean }> = {}) =>
    items.push({ k: "text", x, y, text, plain: true, size: o.size ?? 11, anchor: o.anchor, italic: o.italic, bold: o.bold });
  const panel = (x: number, sprinkler: boolean) => {
    const y = 50;
    const riser = x + 40;
    // стеля
    items.push({ k: "line", pts: [[x, y - 18], [x + 360, y - 18]] });
    // розподільний трубопровід під стелею
    items.push({ k: "line", pts: [[riser, y], [x + 340, y]], bold: true, dashed: !sprinkler });
    for (let hx = riser + 50; hx <= x + 330; hx += 70) {
      items.push({ k: "line", pts: [[hx, y], [hx, y + 14]], bold: true });
      if (sprinkler) {
        items.push({ k: "rect", x: hx - 6, y: y + 14, w: 12, h: 8, fill: true });
      } else {
        items.push({ k: "line", pts: [[hx - 7, y + 22], [hx, y + 14], [hx + 7, y + 22]] });
      }
    }
    T(riser + 100, y + 42, sprinkler ? "головки закриті легкоплавкими замками (72, 93, 141, 182 °C)" : "головки постійно відкриті", { size: 10, italic: true });
    // стояк і клапан
    // вище клапана — мережа установки (у дренчерній суха), нижче — вода з водогону
    items.push({ k: "line", pts: [[riser, y], [riser, 150]], bold: true, dashed: !sprinkler });
    items.push({ k: "line", pts: [[riser, 180], [riser, 230]], bold: true });
    items.push({ k: "rect", x: riser - 14, y: 150, w: 28, h: 30, bold: true });
    T(riser + 22, 112, sprinkler ? "контрольно-сигнальний клапан:" : "клапан групової дії:", { size: 10 });
    T(riser + 22, 126, sprinkler ? "пропускає воду і подає звуковий сигнал" : "відкривається автоматично чи вручну, сигнал тривоги", { size: 10 });
    items.push({ k: "line", pts: [[riser, 230], [riser, 262]], bold: true });
    T(riser, 278, "водогін", { anchor: "middle", size: 10 });
    if (!sprinkler) {
      items.push({ k: "line", pts: [[riser, 143], [riser + 40, 143]], bold: true, dashed: true });
      items.push({ k: "rect", x: riser + 40, y: 136, w: 14, h: 14 });
      T(riser + 60, 147, "спускний вентиль", { size: 10 });
      items.push({ k: "circle", x: x + 330, y: 165, r: 7 });
      T(x + 342, 169, "1", { size: 10 });
      items.push({ k: "line", pts: [[x + 323, 165], [riser + 14, 165]], dashed: true, arrow: true });
      T(x + 210, 184, "пуск від сповіщувача", { size: 10, anchor: "middle", italic: true });
    }
    T(x + 180, 306, sprinkler ? "а) спринклерна: мережа під водою (повітрям — у неопалюваних)" : "б) дренчерна: мережа суха, вода — після відкриття клапана", { anchor: "middle", italic: true });
  };
  panel(10, true);
  panel(450, false);
  return { w: 830, h: 320, items };
}
