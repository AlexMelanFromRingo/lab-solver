"use client";

import { useId } from "react";
import { FigureFrame } from "@/components/figure-frame";
import { fmtNum, niceUp, type PhasorFigure } from "@/lib/figures";

/**
 * Векторная диаграмма на «миллиметровке»: клетка — 1 см, масштаб каждой
 * группы векторов (mU, mI, mZ…) подобран шагом 1–2–5 так, чтобы самый
 * длинный вектор занимал до восьми клеток, и подписан под диаграммой.
 */

const CELL = 28;
const INK = "var(--ink)";
const DIM = "var(--ink-dim)";
const FAINT = "var(--ink-faint)";
/** Округление координат: Math.sin/cos на сервере и в браузере расходятся в последних знаках — иначе ошибка гидратации. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** «U_Rк» → U с нижним индексом Rк; индекс — до первого пробела («e_норм = 1 %»). */
export function SubLabel({ text, underline }: { text: string; underline?: boolean }) {
  const i = text.indexOf("_");
  const deco = underline ? "underline" : undefined;
  if (i < 0) return <tspan textDecoration={deco}>{text}</tspan>;
  const sp = text.indexOf(" ", i);
  const end = sp < 0 ? text.length : sp;
  return (
    <>
      <tspan textDecoration={deco}>{text.slice(0, i)}</tspan>
      <tspan baselineShift="sub" fontSize="0.75em">
        {text.slice(i + 1, end)}
      </tspan>
      {end < text.length && <tspan>{text.slice(end)}</tspan>}
    </>
  );
}

export function PhasorDiagram({ fig, title }: { fig: PhasorFigure; title: string }) {
  const id = `ph${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const per: Record<string, number> = {};
  for (const s of fig.scales) {
    const own = fig.phasors.filter((p) => p.scale === s.key).flatMap((p) => [p.to, p.from ?? [0, 0]]);
    per[s.key] = niceUp(Math.max(...own.map(([x, y]) => Math.hypot(x, y)), 0) / (s.cells ?? 8), true);
  }
  const pt = ([x, y]: [number, number], key: string): [number, number] => [r2((x / per[key]) * CELL), r2((-y / per[key]) * CELL)];
  const segs = fig.phasors.map((p) => ({ p, a: pt(p.from ?? [0, 0], p.scale), b: pt(p.to, p.scale) }));

  const ends = segs.flatMap((s) => [s.a, s.b]);
  const cx = ends.reduce((t, e) => t + e[0], 0) / Math.max(ends.length, 1);
  const cy = ends.reduce((t, e) => t + e[1], 0) / Math.max(ends.length, 1);
  const xs = [0, ...segs.flatMap((s) => [s.a[0], s.b[0]])];
  const ys = [0, ...segs.flatMap((s) => [s.a[1], s.b[1]])];
  const x0 = (Math.floor(Math.min(...xs) / CELL) - 1) * CELL;
  const x1 = (Math.ceil(Math.max(...xs) / CELL) + 1) * CELL;
  const y0 = (Math.floor(Math.min(...ys) / CELL) - 1) * CELL;
  const y1 = (Math.ceil(Math.max(...ys) / CELL) + 1) * CELL;
  const legend = fig.scales.map((s) => ({ name: s.name, rest: ` = ${fmtNum(per[s.key], 4)} ${s.unit}/см` }));
  const legendLen = legend.reduce((t, l) => t + l.name.length + l.rest.length + 3, 0);
  const vh = y1 - y0 + 26;
  const vw = Math.max(x1 - x0, legendLen * 6.2);

  const grid: React.ReactNode[] = [];
  for (let x = x0; x <= x1; x += CELL) grid.push(<line key={`gx${x}`} x1={x} x2={x} y1={y0} y2={y1} />);
  for (let y = y0; y <= y1; y += CELL) grid.push(<line key={`gy${y}`} x1={x0} x2={x1} y1={y} y2={y} />);

  return (
    <FigureFrame title={title} pxPerCm={CELL}>
      <svg viewBox={`${x0} ${y0} ${vw} ${vh}`} width={vw} height={vh} role="img" aria-label={title} className="mx-auto h-auto max-w-full">
        <defs>
          <marker id={id} viewBox="0 0 10 10" refX={10} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
            <path d="M0 1.5 L10 5 L0 8.5 Z" fill={INK} />
          </marker>
          <marker id={`${id}a`} viewBox="0 0 10 10" refX={10} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M0 2 L10 5 L0 8 Z" fill={DIM} />
          </marker>
        </defs>
        <g stroke={FAINT} strokeOpacity={0.22} strokeWidth={0.5} data-screen-only="">
          {grid}
        </g>
        {fig.axes && (
          <g stroke={DIM} strokeWidth={0.8} fill={DIM} fontSize={11}>
            <line x1={x0} y1={0} x2={x1 - 2} y2={0} markerEnd={`url(#${id}a)`} />
            <line x1={0} y1={y1} x2={0} y2={y0 + 2} markerEnd={`url(#${id}a)`} />
            <text x={x1 - 4} y={-6} textAnchor="end" stroke="none">
              +1
            </text>
            <text x={6} y={y0 + 12} stroke="none">
              +j
            </text>
          </g>
        )}
        {segs.some((g) => !g.p.from) && fig.phasors.some((p) => p.arrow !== false) && (
          <text x={-6} y={14} fontSize={11} fill={DIM} textAnchor="end">
            0
          </text>
        )}
        {fig.arcs?.map((a, i) => {
          const r = 30 + i * 12;
          const rad = (d: number) => (d * Math.PI) / 180;
          const p = (d: number) => [r2(r * Math.cos(rad(d))), r2(-r * Math.sin(rad(d)))];
          const [ax, ay] = p(a.from);
          const [bx, by] = p(a.to);
          const large = Math.abs(a.to - a.from) > 180 ? 1 : 0;
          const sweep = a.to > a.from ? 0 : 1;
          const mid = (a.from + a.to) / 2;
          if (Math.abs(a.to - a.from) < 1) return null;
          return (
            <g key={`arc${i}`}>
              <path d={`M${ax} ${ay} A${r} ${r} 0 ${large} ${sweep} ${bx} ${by}`} fill="none" stroke={DIM} strokeWidth={0.8} />
              <text x={r2((r + 9) * Math.cos(rad(mid)))} y={r2(-(r + 9) * Math.sin(rad(mid)) + 4)} fontSize={11} fill={INK} textAnchor="middle" fontStyle="italic">
                <SubLabel text={a.label} />
              </text>
            </g>
          );
        })}
        {segs.map(({ p, a, b }, i) => {
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const len = Math.hypot(dx, dy);
          if (len < 0.5) return null;
          const at = p.at ?? 0.55;
          // Без явной стороны — та, что дальше от центра рисунка: подпись уходит наружу.
          const mx = a[0] + dx * at;
          const my = a[1] + dy * at;
          const sgn = p.side ? (p.side === "r" ? -1 : 1) : (mx + dy / len - cx) ** 2 + (my - dx / len - cy) ** 2 >= (mx - dy / len - cx) ** 2 + (my + dx / len - cy) ** 2 ? 1 : -1;
          const nx = (dy / len) * sgn;
          const ny = (-dx / len) * sgn;
          const lx = r2(a[0] + dx * at + nx * 11);
          const ly = r2(a[1] + dy * at + ny * 11 + 4);
          return (
            <g key={i}>
              <line
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={INK}
                strokeWidth={1.4}
                strokeDasharray={p.dashed ? "5 3" : undefined}
                markerEnd={p.arrow === false ? undefined : `url(#${id})`}
              />
              <text x={lx} y={ly} fontSize={12} fill={INK} textAnchor="middle" fontStyle="italic">
                <SubLabel text={p.label} underline={fig.complex && p.arrow !== false} />
              </text>
            </g>
          );
        })}
        <text x={x0 + 4} y={y1 + 18} fontSize={11} fill={DIM}>
          {legend.map((l, i) => (
            <tspan key={l.name}>
              {i > 0 && ";   "}
              <SubLabel text={l.name} />
              {l.rest}
            </tspan>
          ))}
        </text>
      </svg>
    </FigureFrame>
  );
}
