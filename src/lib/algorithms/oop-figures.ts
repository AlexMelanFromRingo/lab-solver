/**
 * Графики к работам по охране труда: КПО от расстояния до окна с линией
 * нормы (ЛР3, п. 6), уровни звукового давления Lвим и Lдоп по октавным
 * полосам с выделенными полосами превышения (ЛР4), производительность
 * вентустановки от загрязнения фильтра (ЛР6).
 */

import { fmtNum, type PlotFigure } from "@/lib/figures";

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
