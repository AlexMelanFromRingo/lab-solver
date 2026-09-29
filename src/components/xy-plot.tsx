import { FigureFrame } from "@/components/figure-frame";
import { SubLabel } from "@/components/phasor-diagram";
import { fmtNum, niceUp, type PlotFigure } from "@/lib/figures";

/**
 * График зависимости по опытным точкам: оси от нуля, шаг делений 1–2–5,
 * у каждой оси обозначение величины и единица («B, Тл»), при очень больших
 * или малых значениях — множитель в подписи оси («Rм, ×10⁵ Гн⁻¹»). Точки
 * соединены плавной кривой (монотонный кубический сплайн — без выбросов
 * между точками) или ломаной.
 */

const W = 540;
const H = 330;
const PAD = { top: 16, right: 18, bottom: 52, left: 70 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;
const INK = "var(--ink)";
const DIM = "var(--ink-dim)";
const FAINT = "var(--ink-faint)";
const r2 = (v: number) => Math.round(v * 100) / 100;

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n: number) => String(n).replace(/./g, (c) => SUP[c] ?? c);

function axis(values: number[], zero = true, headroom = true) {
  const max = Math.max(...values.map(Math.abs), 0);
  const e = max >= 1e4 || (max > 0 && max < 0.1) ? Math.floor(Math.log10(max)) : 0;
  const k = 10 ** -e;
  const lo = (zero ? Math.min(0, ...values) : Math.min(...values)) * k;
  const hi = (zero ? Math.max(0, ...values) : Math.max(...values)) * k;
  const step = niceUp((hi - lo) / 6 || 1);
  const min = Math.floor(lo / step) * step;
  let top = Math.ceil(hi / step) * step || step;
  // Запас сверху, чтобы точка на максимуме и её подпись не упирались в край.
  if (headroom && top - hi < 0.04 * (top - min)) top += step;
  const ticks: number[] = [];
  for (let t = min; t <= top + step / 2; t += step) ticks.push(Number(t.toFixed(10)));
  return { e, k, min, max: top, ticks };
}

function monotone(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 3 || pts.some((p, i) => i > 0 && p[0] <= pts[i - 1][0])) return `M${pts.map((p) => p.join(" ")).join(" L")}`;
  const m = pts.slice(0, -1).map((p, i) => (pts[i + 1][1] - p[1]) / (pts[i + 1][0] - p[0]));
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      t[i] = (3 / Math.sqrt(s)) * a * m[i];
      t[i + 1] = (3 / Math.sqrt(s)) * b * m[i];
    }
  }
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (pts[i + 1][0] - pts[i][0]) / 3;
    d += ` C${r2(pts[i][0] + h)} ${r2(pts[i][1] + t[i] * h)} ${r2(pts[i + 1][0] - h)} ${r2(pts[i + 1][1] - t[i + 1] * h)} ${pts[i + 1][0]} ${pts[i + 1][1]}`;
  }
  return d;
}

function Marker({ x, y, kind }: { x: number; y: number; kind: number }) {
  const p = { fill: "var(--background)", stroke: INK, strokeWidth: 1.1 };
  switch (kind % 4) {
    case 0:
      return <circle cx={x} cy={y} r={3.2} {...p} />;
    case 1:
      return <rect x={x - 3} y={y - 3} width={6} height={6} {...p} />;
    case 2:
      return <polygon points={`${x},${y - 3.8} ${x + 3.6},${y + 2.8} ${x - 3.6},${y + 2.8}`} {...p} />;
    default:
      return <polygon points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`} {...p} />;
  }
}

/** Курсив — только для буквенных обозначений величин (B, Hст, μa), не для слов. */
const italic = (label: string) => (label.split("_")[0].length <= 2 ? "italic" : undefined);

const unitText = (unit: string, e: number) => (e ? `×10${sup(e)} ${unit}`.trim() : unit);

export function XYPlot({ fig, title }: { fig: PlotFigure; title: string }) {
  const pts = fig.series.flatMap((s) => s.points).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const ax = fig.xTicks
    ? { e: 0, k: 1, min: Math.min(...fig.xTicks.map((t) => t.at)) - 0.5, max: Math.max(...fig.xTicks.map((t) => t.at)) + 0.5, ticks: fig.xTicks.map((t) => t.at) }
    : axis(pts.map((p) => p[0]), fig.x.zero !== false, false);
  const ay = axis([...pts.map((p) => p[1]), ...(fig.hlines ?? []).map((h) => h.y)], fig.y.zero !== false);
  const xLabel = (t: number) => fig.xTicks?.find((x) => x.at === t)?.label ?? fmtNum(t, 4);
  const X = (v: number) => r2(PAD.left + ((v * ax.k - ax.min) / (ax.max - ax.min)) * PW);
  const Y = (v: number) => r2(PAD.top + PH - ((v * ay.k - ay.min) / (ay.max - ay.min)) * PH);
  // Легенда переносится на следующую строку, если не помещается по ширине
  const legend: { x: number; y: number }[] = [];
  let lx = PAD.left;
  let ly = H + 6;
  fig.series.forEach((s) => {
    const wItem = 62 + s.label.length * 5.8;
    if (lx > PAD.left && lx + wItem > W - 4) {
      lx = PAD.left;
      ly += 18;
    }
    legend.push({ x: lx, y: ly });
    lx += wItem;
  });
  const vh = H + (fig.series.length > 1 ? ly - H + 12 : 0);

  return (
    <FigureFrame title={title}>
      <svg viewBox={`0 0 ${W} ${vh}`} width={W} height={vh} role="img" aria-label={title} className="mx-auto h-auto w-full" style={{ maxWidth: W }}>
        <g stroke={FAINT} strokeOpacity={0.3} strokeWidth={0.5}>
          {ax.ticks.map((t) => (
            <line key={`vx${t}`} x1={X(t / ax.k)} x2={X(t / ax.k)} y1={PAD.top} y2={PAD.top + PH} />
          ))}
          {ay.ticks.map((t) => (
            <line key={`hy${t}`} x1={PAD.left} x2={PAD.left + PW} y1={Y(t / ay.k)} y2={Y(t / ay.k)} />
          ))}
        </g>
        {fig.shade?.map((sh, i) => (
          <g key={`sh${i}`}>
            <rect x={X(sh.from)} y={PAD.top} width={X(sh.to) - X(sh.from)} height={PH} fill={FAINT} fillOpacity={0.28} />
            {sh.label && (
              <text x={(X(sh.from) + X(sh.to)) / 2} y={PAD.top + 12} fontSize={10} fill={INK} textAnchor="middle">
                {sh.label}
              </text>
            )}
          </g>
        ))}
        <g stroke={DIM} strokeWidth={1}>
          <line x1={PAD.left} x2={PAD.left + PW} y1={PAD.top + PH} y2={PAD.top + PH} />
          <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + PH} />
          {ay.min < 0 && ay.max > 0 && <line x1={PAD.left} x2={PAD.left + PW} y1={Y(0)} y2={Y(0)} />}
          {!fig.xTicks && ax.min < 0 && ax.max > 0 && <line x1={X(0)} x2={X(0)} y1={PAD.top} y2={PAD.top + PH} />}
        </g>
        {fig.hlines?.map((h) => {
          // Подпись линии — у того края, где кривые дальше от неё.
          const sorted = [...pts].sort((a, b) => a[0] - b[0]);
          const gap = (p?: [number, number]) => (p ? Math.abs(p[1] - h.y) : Infinity);
          const left = gap(sorted[0]) >= gap(sorted[sorted.length - 1]);
          return (
            <g key={`hl${h.label}`}>
              <line x1={PAD.left} x2={PAD.left + PW} y1={Y(h.y)} y2={Y(h.y)} stroke={INK} strokeWidth={1.2} strokeDasharray="8 4" />
              <text x={left ? PAD.left + 6 : PAD.left + PW - 4} y={Y(h.y) - 5} fontSize={11} fill={INK} textAnchor={left ? "start" : "end"}>
                <SubLabel text={h.label} />
              </text>
            </g>
          );
        })}
        <g fontSize={10} fill={DIM}>
          {ax.ticks.map((t) => (
            <text key={`tx${t}`} x={X(t / ax.k)} y={PAD.top + PH + 14} textAnchor="middle">
              {xLabel(t)}
            </text>
          ))}
          {ay.ticks.map((t) => (
            <text key={`ty${t}`} x={PAD.left - 6} y={Y(t / ay.k) + 3.5} textAnchor="end">
              {fmtNum(t, 4)}
            </text>
          ))}
        </g>
        <text x={PAD.left + PW / 2} y={H - 12} fontSize={12} fill={INK} textAnchor="middle">
          <tspan fontStyle={italic(fig.x.label)}>
            <SubLabel text={fig.x.label} />
          </tspan>
          {unitText(fig.x.unit, ax.e) && `, ${unitText(fig.x.unit, ax.e)}`}
        </text>
        <text transform={`translate(16 ${PAD.top + PH / 2}) rotate(-90)`} fontSize={12} fill={INK} textAnchor="middle">
          <tspan fontStyle={italic(fig.y.label)}>
            <SubLabel text={fig.y.label} />
          </tspan>
          {unitText(fig.y.unit, ay.e) && `, ${unitText(fig.y.unit, ay.e)}`}
        </text>
        {fig.series.map((s, i) => {
          const sp = s.points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)).map(([x, y]) => [X(x), Y(y)] as [number, number]);
          const sorted = [...sp].sort((a, b) => a[0] - b[0]);
          return (
            <g key={s.label}>
              {sorted.length > 1 && s.line !== false && <path d={fig.smooth ? monotone(sorted) : `M${sorted.map((p) => p.join(" ")).join(" L")}`} fill="none" stroke={INK} strokeWidth={1.3} strokeDasharray={s.dashed ? "6 3" : undefined} />}
              {s.markers !== false &&
                sp.map(([x, y], j) => (
                  <Marker key={j} x={x} y={y} kind={i} />
                ))}
              {s.values &&
                s.points
                  .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
                  .map(([x, y], j) => (
                    <text key={`v${j}`} x={X(x) > PAD.left + PW - 30 ? X(x) - 5 : X(x) + 5} y={Y(y) - 7} fontSize={10} fill={INK} textAnchor={X(x) > PAD.left + PW - 30 ? "end" : "start"}>
                      {fmtNum(y, Math.abs(y) >= 100 ? 1 : 2)}
                    </text>
                  ))}
            </g>
          );
        })}
        {fig.series.length > 1 &&
          fig.series.map((s, i) => {
            const { x, y: ry } = legend[i];
            return (
              <g key={`lg${s.label}`} fontSize={11} fill={INK}>
                {s.line !== false && <line x1={x} x2={x + 30} y1={ry} y2={ry} stroke={INK} strokeWidth={1.3} strokeDasharray={s.dashed ? "6 3" : undefined} />}
                {s.markers !== false && <Marker x={x + 15} y={ry} kind={i} />}
                <text x={x + 38} y={ry + 4}>
                  <SubLabel text={s.label} />
                </text>
              </g>
            );
          })}
      </svg>
    </FigureFrame>
  );
}
