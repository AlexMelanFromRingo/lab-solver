"use client";

import { useId } from "react";
import { FigureFrame } from "@/components/figure-frame";
import { SubLabel } from "@/components/phasor-diagram";
import type { Drawing } from "@/lib/drawing";

const INK = "var(--ink)";
const DIM = "var(--ink-dim)";

/** Чертёж из примитивов (lib/drawing): линии, прямоугольники, надписи, земля. */
export function DrawingView({ drawing, title }: { drawing: Drawing; title: string }) {
  const id = `dr${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pad = 10;
  return (
    <FigureFrame title={title}>
      <svg
        viewBox={`${-pad} ${-pad} ${drawing.w + 2 * pad} ${drawing.h + 2 * pad}`}
        width={drawing.w + 2 * pad}
        height={drawing.h + 2 * pad}
        role="img"
        aria-label={title}
        className="mx-auto h-auto max-w-full"
      >
        <defs>
          <marker id={id} viewBox="0 0 10 10" refX={10} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M0 1.5 L10 5 L0 8.5 Z" fill={INK} />
          </marker>
        </defs>
        {drawing.items.map((it, i) => {
          switch (it.k) {
            case "line":
              return (
                <polyline
                  key={i}
                  points={it.pts.map((p) => p.join(",")).join(" ")}
                  fill="none"
                  stroke={INK}
                  strokeWidth={it.bold ? 2 : 1.2}
                  strokeDasharray={it.dashed ? "6 4" : undefined}
                  markerEnd={it.arrow ? `url(#${id})` : undefined}
                  markerStart={it.arrowStart ? `url(#${id})` : undefined}
                />
              );
            case "rect":
              return (
                <rect
                  key={i}
                  x={it.x}
                  y={it.y}
                  width={it.w}
                  height={it.h}
                  fill={it.fill ? DIM : "var(--background)"}
                  stroke={INK}
                  strokeWidth={it.bold ? 2 : 1.2}
                  strokeDasharray={it.dashed ? "6 4" : undefined}
                />
              );
            case "circle":
              return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={it.fill ? INK : "var(--background)"} stroke={INK} strokeWidth={1.2} />;
            case "dot":
              return <circle key={i} cx={it.x} cy={it.y} r={2.6} fill={INK} />;
            case "text":
              return (
                <text
                  key={i}
                  x={it.x}
                  y={it.y}
                  fontSize={it.size ?? 12}
                  fill={INK}
                  textAnchor={it.anchor ?? "start"}
                  fontStyle={it.italic ? "italic" : undefined}
                  fontWeight={it.bold ? 700 : undefined}
                  textDecoration={it.underline ? "underline" : undefined}
                >
                  {it.plain ? it.text : <SubLabel text={it.text} />}
                </text>
              );
            case "diamond":
              return (
                <polygon
                  key={i}
                  points={`${it.x},${it.y - it.h / 2} ${it.x + it.w / 2},${it.y} ${it.x},${it.y + it.h / 2} ${it.x - it.w / 2},${it.y}`}
                  fill="var(--background)"
                  stroke={INK}
                  strokeWidth={1.2}
                />
              );
            case "ground": {
              const hatch: React.ReactNode[] = [];
              for (let x = it.x1 + 4; x <= it.x2; x += 10) hatch.push(<line key={x} x1={x} y1={it.y} x2={x - 7} y2={it.y + 8} />);
              return (
                <g key={i} stroke={INK} strokeWidth={1}>
                  <line x1={it.x1} x2={it.x2} y1={it.y} y2={it.y} strokeWidth={1.6} />
                  {hatch}
                </g>
              );
            }
          }
        })}
      </svg>
    </FigureFrame>
  );
}
