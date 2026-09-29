import type { FlowChart } from "@/lib/algorithms/flowchart";

const DIM = "var(--ink-dim)";
const INK = "var(--ink)";

/** Блок-схема алгоритму: термінатори, введення-виведення, процеси, рішення. */
export function FlowChartView({ chart, title }: { chart: FlowChart; title: string }) {
  const id = `fa-${Math.round(chart.w)}-${Math.round(chart.h)}`;
  const pad = 16;
  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-[4px] border border-border bg-black/20 p-2">
        <svg
          viewBox={`${-pad} ${-pad} ${chart.w + 2 * pad} ${chart.h + 2 * pad}`}
          width={chart.w + 2 * pad}
          height={chart.h + 2 * pad}
          role="img"
          aria-label={title}
          className="mx-auto max-w-none"
        >
          <defs>
            <marker id={id} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 Z" fill={DIM} />
            </marker>
          </defs>
          {chart.shapes.map((s, i) => {
            if (s.k === "line")
              return <polyline key={i} points={s.pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={DIM} strokeWidth={1.2} markerEnd={s.arrow ? `url(#${id})` : undefined} />;
            if (s.k === "label")
              return (
                <text key={i} x={s.x} y={s.y} fontSize={10} fill={DIM} textAnchor={s.anchor ?? "start"}>
                  {s.text}
                </text>
              );
            const { x, y, w, h } = s;
            const shape =
              s.k === "term" ? (
                <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="var(--background)" stroke={DIM} />
              ) : s.k === "op" ? (
                <rect x={x} y={y} width={w} height={h} fill="var(--background)" stroke={DIM} />
              ) : s.k === "io" ? (
                <polygon points={`${x + 14},${y} ${x + w},${y} ${x + w - 14},${y + h} ${x},${y + h}`} fill="var(--background)" stroke={DIM} />
              ) : (
                <polygon points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} fill="var(--background)" stroke={DIM} />
              );
            const top = y + h / 2 - ((s.lines.length - 1) * 14) / 2 + 4;
            return (
              <g key={i}>
                {shape}
                {s.lines.map((l, j) => (
                  <text key={j} x={x + w / 2} y={top + j * 14} fontSize={11} textAnchor="middle" fill={INK} fontFamily="var(--font-mono, monospace)">
                    {l}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="text-xs text-ink-faint">{title}</figcaption>
    </figure>
  );
}
