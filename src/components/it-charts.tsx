"use client";

import { ru, type Table } from "@/lib/algorithms/it-table";

/**
 * Три типа диаграмм, которые требует первая лабораторная.
 *
 * Здесь они не вместо табличного процессора, а до него: по ним заранее видно,
 * что получится из набранных данных. По точечной сразу заметно, легли ли
 * значения на кривую; по круговой — различимы ли доли вообще, потому что при
 * близких значениях она превращается в ровный круг и ничего не показывает.
 */

const W = 720;
const H = 260;
const PAD = { top: 18, right: 54, bottom: 36, left: 58 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / power) * power;
}

function Grid({
  yTicks,
  xTicks,
  xLabel,
  yLabel,
  y2Label,
  y2Ticks,
  accent,
}: {
  yTicks: { at: number; text: string }[];
  xTicks: { at: number; text: string }[];
  xLabel: string;
  yLabel: string;
  y2Label?: string;
  y2Ticks?: { at: number; text: string }[];
  accent: string;
}) {
  return (
    <>
      {yTicks.map((t) => (
        <g key={`y${t.at}`}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={t.at}
            y2={t.at}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-ink-faint/25"
          />
          <text x={PAD.left - 8} y={t.at + 3.5} textAnchor="end" className="fill-ink-faint text-[9px]">
            {t.text}
          </text>
        </g>
      ))}

      {y2Ticks?.map((t) => (
        <text key={`y2${t.at}`} x={W - PAD.right + 8} y={t.at + 3.5} className="text-[9px]" fill={accent} opacity={0.75}>
          {t.text}
        </text>
      ))}

      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={PAD.top + plotH}
        y2={PAD.top + plotH}
        stroke="currentColor"
        className="text-ink-faint"
      />

      {xTicks.map((t) => (
        <text key={t.text + t.at} x={t.at} y={H - 18} textAnchor="middle" className="fill-ink-faint text-[9px]">
          {t.text}
        </text>
      ))}

      <text x={W - PAD.right} y={H - 4} textAnchor="end" className="fill-ink-faint text-[9px]">
        {xLabel}
      </text>
      <text x={4} y={PAD.top - 6} className="fill-ink-faint text-[9px]">
        {yLabel}
      </text>
      {y2Label && (
        <text x={W - PAD.right + 6} y={PAD.top - 6} className="text-[9px]" fill={accent} opacity={0.75}>
          {y2Label}
        </text>
      )}
    </>
  );
}

/** Точечная: первый столбец по оси абсцисс, второй по оси ординат. */
export function ScatterChart({ table, accent }: { table: Table; accent: string }) {
  const rows = table.rows;
  if (rows.length < 2) return null;

  const xs = rows.map((r) => r[0]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMax = niceMax(Math.max(...rows.map((r) => r[1])));

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const sy = (y: number) => PAD.top + (1 - y / yMax) * plotH;

  const every = Math.max(1, Math.ceil(rows.length / 10));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <Grid
        accent={accent}
        xLabel={table.headers[0]}
        yLabel={table.headers[1]}
        yTicks={[0, 0.25, 0.5, 0.75, 1].map((f) => ({ at: sy(yMax * f), text: ru(yMax * f, 0) }))}
        xTicks={rows.filter((_, i) => i % every === 0).map((r) => ({ at: sx(r[0]), text: ru(r[0], 0) }))}
      />
      {rows.map((r, i) => (
        <circle key={i} cx={sx(r[0])} cy={sy(r[1])} r={3.4} fill={accent} />
      ))}
    </svg>
  );
}

/** Вертикальная комбинированная: второй столбец столбцами, третий линией. */
export function ComboChart({ table, accent }: { table: Table; accent: string }) {
  const rows = table.rows;
  if (rows.length === 0) return null;

  const bMax = niceMax(Math.max(...rows.map((r) => r[1])));
  const cMax = niceMax(Math.max(...rows.map((r) => r[2])));
  const slot = plotW / rows.length;
  const barW = Math.max(4, slot * 0.55);

  const cx = (i: number) => PAD.left + slot * (i + 0.5);
  const syB = (v: number) => PAD.top + (1 - v / bMax) * plotH;
  const syC = (v: number) => PAD.top + (1 - v / cMax) * plotH;

  const path = rows.map((r, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${syC(r[2]).toFixed(1)}`).join(" ");
  const every = Math.max(1, Math.ceil(rows.length / 10));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <Grid
        accent={accent}
        xLabel={table.headers[0]}
        yLabel={table.headers[1]}
        y2Label={table.headers[2]}
        yTicks={[0, 0.5, 1].map((f) => ({ at: syB(bMax * f), text: ru(bMax * f, 0) }))}
        y2Ticks={[0, 0.5, 1].map((f) => ({ at: syC(cMax * f), text: ru(cMax * f, 1) }))}
        xTicks={rows.filter((_, i) => i % every === 0).map((r, i) => ({ at: cx(i * every), text: ru(r[0], 0) }))}
      />
      {rows.map((r, i) => (
        <rect
          key={i}
          x={cx(i) - barW / 2}
          y={syB(r[1])}
          width={barW}
          height={PAD.top + plotH - syB(r[1])}
          fill="#60a5fa"
          fillOpacity={0.5}
        />
      ))}
      <path d={path} fill="none" stroke={accent} strokeWidth={1.8} />
      {rows.map((r, i) => (
        <rect key={`p${i}`} x={cx(i) - 2.5} y={syC(r[2]) - 2.5} width={5} height={5} fill={accent} />
      ))}
    </svg>
  );
}

/** Круговая: доли третьего столбца от общей суммы. */
export function PieChart({ table, total }: { table: Table; total: number }) {
  const rows = table.rows;
  if (rows.length === 0 || total <= 0) return null;

  const R = 92;
  const cx = 110;
  const cy = 110;
  let angle = -Math.PI / 2;

  const slices = rows.map((r, i) => {
    const share = r[2] / total;
    const start = angle;
    const end = angle + share * 2 * Math.PI;
    angle = end;

    const large = end - start > Math.PI ? 1 : 0;
    const d = [
      `M${cx},${cy}`,
      `L${(cx + R * Math.cos(start)).toFixed(2)},${(cy + R * Math.sin(start)).toFixed(2)}`,
      `A${R},${R} 0 ${large} 1 ${(cx + R * Math.cos(end)).toFixed(2)},${(cy + R * Math.sin(end)).toFixed(2)}`,
      "Z",
    ].join(" ");

    // Оттенки одного тона: доли обычно различаются на проценты, и пёстрая
    // палитра создаёт впечатление, будто разница велика.
    const light = 32 + (i / Math.max(1, rows.length - 1)) * 40;
    return { d, fill: `hsl(205 70% ${light}%)`, row: r, share };
  });

  const spread = Math.max(...slices.map((s) => s.share)) - Math.min(...slices.map((s) => s.share));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-6">
        <svg viewBox="0 0 220 220" className="h-52 w-52 shrink-0" role="img">
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.fill} stroke="#0a0a0a" strokeWidth={1} />
          ))}
        </svg>
        <ul className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          {slices.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.fill }} />
              <span className="truncate text-ink-dim">{ru(s.row[0], 0)}</span>
              <span className="font-mono text-ink-faint">{ru(s.share * 100, 1)} %</span>
            </li>
          ))}
        </ul>
      </div>

      {spread < 0.04 && (
        <p className="text-xs leading-relaxed text-ink-faint">
          Доли различаются меньше чем на четыре процента — круговая диаграмма на таких данных
          выглядит ровным кругом. Без подписей данных по ней ничего не прочитать.
        </p>
      )}
    </div>
  );
}
