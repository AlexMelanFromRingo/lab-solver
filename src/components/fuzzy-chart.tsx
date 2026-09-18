"use client";

import { humanName, membership, type Term, type Variable } from "@/lib/algorithms/fuzzy-mamdani";

/**
 * Графики функций принадлежности.
 *
 * В FLS это главное окно работы, и в отчёт идут именно его снимки, поэтому
 * здесь график — не украшение, а основное содержимое: по нему видно, какие
 * термы задеты входным значением и на что похожа аккумулированная фигура.
 *
 * Кривые строятся не по узлам, а выборкой через membership: у половины термов
 * методички точки не доходят до края универса, и за последней точкой функция
 * продолжается постоянной. По одним узлам этот хвост потерялся бы.
 */

const W = 720;
const H = 200;
const PAD = { top: 14, right: 16, bottom: 26, left: 34 };

/** Цвета термов: те же семь, что программа раздаёт кривым по порядку. */
export const TERM_COLORS = [
  "#f87171",
  "#4ade80",
  "#60a5fa",
  "#e879f9",
  "#2dd4bf",
  "#fbbf24",
  "#a78bfa",
];

const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

const sx = (x: number, lo: number, hi: number) => PAD.left + ((x - lo) / (hi - lo)) * plotW;
const sy = (mu: number) => PAD.top + (1 - mu) * plotH;

function curveOf(term: Term, lo: number, hi: number): string {
  // Узлы функции плюс равномерная сетка: изломы должны попасть в кривую точно,
  // иначе треугольник шириной меньше шага сетки нарисуется срезанным.
  const xs = new Set<number>();
  for (let i = 0; i <= 240; i++) xs.add(lo + ((hi - lo) * i) / 240);
  for (const [x] of term.points) if (x >= lo && x <= hi) xs.add(x);

  return [...xs]
    .sort((a, b) => a - b)
    .map((x, i) => `${i === 0 ? "M" : "L"}${sx(x, lo, hi).toFixed(2)},${sy(membership(term, x)).toFixed(2)}`)
    .join(" ");
}

/**
 * Круглые деления по оси.
 *
 * Универсы в заданиях какие угодно — [50, 100], [−0,5, 0,5], [1,5, 2,2], — и
 * если просто разделить их на шесть частей, под осью встанут подписи вроде
 * 58,33 и 66,67. Поэтому шаг берётся из ряда 1, 2, 2,5, 5 и степеней десяти, а
 * концы универса подписываются всегда: по ним читаются границы.
 */
function ticks(lo: number, hi: number): number[] {
  const rough = (hi - lo) / 6;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? rough;

  const out: number[] = [lo];
  for (let x = Math.ceil(lo / step) * step; x < hi; x += step) {
    // Ближе четверти шага к краю подпись слипнется с подписью края.
    if (x - lo > step / 4 && hi - x > step / 4) out.push(Number(x.toFixed(6)));
  }
  out.push(hi);

  return out;
}

const fmt = (v: number) => {
  const rounded = Math.round(v * 100) / 100;
  // Настоящий минус, а не дефис: на оси они заметно различаются.
  return String(rounded).replace(".", ",").replace("-", "\u2212");
};

function Frame({ lo, hi, children }: { lo: number; hi: number; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {/* сетка по уровням принадлежности */}
      {[0, 0.5, 1].map((mu) => (
        <g key={mu}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={sy(mu)}
            y2={sy(mu)}
            stroke="currentColor"
            strokeWidth={mu === 0 ? 1 : 0.5}
            className={mu === 0 ? "text-ink-faint" : "text-ink-faint/30"}
          />
          <text x={PAD.left - 7} y={sy(mu) + 3.5} textAnchor="end" className="fill-ink-faint text-[9px]">
            {mu === 0.5 ? "0,5" : mu}
          </text>
        </g>
      ))}

      {ticks(lo, hi).map((x) => (
        <text
          key={x}
          x={sx(x, lo, hi)}
          y={H - 9}
          textAnchor="middle"
          className="fill-ink-faint text-[9px]"
        >
          {fmt(x)}
        </text>
      ))}

      {children}
    </svg>
  );
}

/** Термы переменной; при заданном значении показаны его степени принадлежности. */
export function TermChart({
  variable,
  value,
  degrees,
}: {
  variable: Variable;
  value?: number;
  degrees?: Record<string, number>;
}) {
  const [lo, hi] = variable.universe;
  const inside = value !== undefined && Number.isFinite(value) && value >= lo && value <= hi;

  return (
    <div>
      <Frame lo={lo} hi={hi}>
        {variable.terms.map((term, i) => (
          <path
            key={term.name}
            d={curveOf(term, lo, hi)}
            fill="none"
            stroke={TERM_COLORS[i % TERM_COLORS.length]}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        ))}

        {inside && (
          <>
            <line
              x1={sx(value, lo, hi)}
              x2={sx(value, lo, hi)}
              y1={PAD.top}
              y2={sy(0)}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="text-ink-dim"
            />
            {variable.terms.map((term, i) => {
              const mu = degrees?.[term.name] ?? membership(term, value);
              if (mu <= 0.001) return null;
              return (
                <circle
                  key={term.name}
                  cx={sx(value, lo, hi)}
                  cy={sy(mu)}
                  r={3.2}
                  fill={TERM_COLORS[i % TERM_COLORS.length]}
                />
              );
            })}
          </>
        )}
      </Frame>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {variable.terms.map((term, i) => {
          const mu = value !== undefined ? (degrees?.[term.name] ?? membership(term, value)) : undefined;
          return (
            <span key={term.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: TERM_COLORS[i % TERM_COLORS.length] }}
              />
              <span className="text-ink-dim">
                {term.label ? `${term.name} · ${term.label}` : humanName(term.name)}
              </span>
              {mu !== undefined && (
                <span className="font-mono text-ink-faint">{mu.toFixed(3).replace(".", ",")}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Аккумулированное множество и точка, в которую оно дефазифицировано. */
export function ResultChart({
  curve,
  crisp,
  universe,
  accent,
}: {
  curve: { x: number; mu: number }[];
  crisp: number | null;
  universe: [number, number];
  accent: string;
}) {
  const [lo, hi] = universe;
  if (curve.length === 0) return null;

  const line = curve
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x, lo, hi).toFixed(2)},${sy(p.mu).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${sx(curve[curve.length - 1].x, lo, hi).toFixed(2)},${sy(0)} L${sx(curve[0].x, lo, hi).toFixed(2)},${sy(0)} Z`;

  return (
    <Frame lo={lo} hi={hi}>
      <path d={area} fill={accent} fillOpacity={0.16} />
      <path d={line} fill="none" stroke={accent} strokeWidth={1.8} strokeLinejoin="round" />

      {crisp !== null && (
        <>
          <line
            x1={sx(crisp, lo, hi)}
            x2={sx(crisp, lo, hi)}
            y1={PAD.top}
            y2={sy(0)}
            stroke={accent}
            strokeWidth={1.4}
          />
          <circle cx={sx(crisp, lo, hi)} cy={sy(0)} r={4} fill={accent} />
          <text
            x={sx(crisp, lo, hi)}
            y={PAD.top - 3}
            textAnchor="middle"
            className="text-[10px] font-mono"
            fill={accent}
          >
            {fmt(crisp)}
          </text>
        </>
      )}
    </Frame>
  );
}
