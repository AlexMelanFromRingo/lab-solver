import { FigureFrame } from "@/components/figure-frame";
import { SubLabel } from "@/components/phasor-diagram";
import { fmtNum, niceUp, type TimingFigure } from "@/lib/figures";

/**
 * Временная диаграмма цифровых сигналов: одиночные линии — уровнями 0/1,
 * шины — «шестигранниками» со значением, как в окне PSpice; внизу ось
 * времени с делениями.
 */

const NAME = 64;
const W = 640;
const ROW = 30;
const INK = "var(--ink)";
const DIM = "var(--ink-dim)";
const FAINT = "var(--ink-faint)";
const r2 = (v: number) => Math.round(v * 100) / 100;

export function TimingDiagram({ fig, title }: { fig: TimingFigure; title: string }) {
  const X = (t: number) => r2(NAME + ((t - fig.from) / (fig.to - fig.from)) * W);
  const step = niceUp((fig.to - fig.from) / 10);
  const ticks = fig.ticks ?? Array.from({ length: Math.floor((fig.to - fig.from) / step + 1e-9) + 1 }, (_, i) => fig.from + i * step);
  const top = 8;
  const axisY = top + fig.signals.length * ROW + 4;
  const vh = axisY + 34;

  return (
    <FigureFrame title={title}>
      <svg viewBox={`0 0 ${NAME + W + 16} ${vh}`} width={NAME + W + 16} height={vh} role="img" aria-label={title} className="mx-auto h-auto w-full" style={{ maxWidth: NAME + W + 16 }}>
        <g stroke={FAINT} strokeOpacity={0.25} strokeWidth={0.5} data-screen-only="">
          {ticks.map((t) => (
            <line key={t} x1={X(t)} x2={X(t)} y1={top} y2={axisY} />
          ))}
        </g>
        {fig.signals.map((s, k) => {
          const y0 = top + k * ROW;
          const hi = y0 + 6;
          const lo = y0 + ROW - 8;
          const mid = (hi + lo) / 2;
          const ch = s.changes.filter(([t]) => t < fig.to).map(([t, v]) => [Math.max(t, fig.from), v] as [number, number | string]);
          const segs = ch.map(([t, v], i) => ({ a: X(t), b: X(i + 1 < ch.length ? ch[i + 1][0] : fig.to), v }));
          let body: React.ReactNode;
          if (s.bus) {
            const e = 3;
            body = segs.map((g, i) => (
              <g key={i}>
                <polygon
                  points={`${g.a},${mid} ${g.a + (i ? e : 0)},${hi} ${g.b - (i + 1 < segs.length ? e : 0)},${hi} ${g.b},${mid} ${g.b - (i + 1 < segs.length ? e : 0)},${lo} ${g.a + (i ? e : 0)},${lo}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.1}
                />
                {g.b - g.a > 14 && (
                  <text x={(g.a + g.b) / 2} y={mid + 3.5} fontSize={10} textAnchor="middle" fill={INK}>
                    {String(g.v)}
                  </text>
                )}
              </g>
            ));
          } else {
            const pts: string[] = [];
            segs.forEach((g) => {
              const y = Number(g.v) ? hi : lo;
              pts.push(`${g.a},${y}`, `${g.b},${y}`);
            });
            body = <polyline points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={1.3} />;
          }
          return (
            <g key={s.name}>
              <text x={NAME - 8} y={mid + 4} fontSize={11} textAnchor="end" fill={INK}>
                <SubLabel text={s.name} />
              </text>
              {body}
            </g>
          );
        })}
        <line x1={NAME} x2={NAME + W} y1={axisY} y2={axisY} stroke={DIM} />
        {ticks.map((t) => (
          <g key={`t${t}`}>
            <line x1={X(t)} x2={X(t)} y1={axisY} y2={axisY + 4} stroke={DIM} />
            <text x={X(t)} y={axisY + 15} fontSize={9.5} textAnchor="middle" fill={DIM}>
              {fmtNum(t, 4)}
            </text>
          </g>
        ))}
        <text x={NAME + W} y={axisY + 29} fontSize={11} textAnchor="end" fill={INK}>
          <tspan fontStyle="italic">t</tspan>, {fig.unit}
        </text>
      </svg>
    </FigureFrame>
  );
}
