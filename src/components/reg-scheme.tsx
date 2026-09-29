import type { RegScheme, SchemeReg, SchemeWire } from "@/lib/algorithms/aks-schemes";
import { REG_H, regWidth } from "@/lib/algorithms/aks-schemes";

const U = 20; // px у клітинці сітки
const PAD = 1.2;

const INK = "var(--ink)";
const DIM = "var(--ink-dim)";
const FAINT = "var(--ink-faint)";
const ACC = "var(--cat-arch)";

function Reg({ r }: { r: SchemeReg }) {
  const cells = r.cells ?? [];
  const x0 = r.x * U;
  const y0 = r.y * U;
  const h = REG_H * U;
  const fx = (r.x + cells.length) * U;
  const fw = r.w * U;
  const mid = y0 + h / 2;
  return (
    <g>
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={x0 + i * U} y={y0} width={U} height={h} fill={c.mark ? "rgba(56,189,248,0.12)" : "none"} stroke={DIM} />
          {c.label && (
            <text x={x0 + i * U + U / 2} y={mid + 4} fontSize={10} textAnchor="middle" fill={DIM}>
              {c.label}
            </text>
          )}
          <text x={x0 + i * U + U / 2} y={y0 + h + 12} fontSize={10} textAnchor="middle" fill={FAINT} fontFamily="var(--font-mono, monospace)">
            {c.bit}
          </text>
        </g>
      ))}
      <rect x={fx} y={y0} width={fw} height={h} fill="none" stroke={DIM} />
      {r.markLo && <rect x={fx + fw - U * 0.8} y={y0} width={U * 0.8} height={h} fill="rgba(56,189,248,0.12)" stroke={DIM} />}
      {r.markHi && <rect x={fx} y={y0} width={U * 0.8} height={h} fill="rgba(56,189,248,0.12)" stroke={DIM} />}
      <text x={fx + (r.markHi ? U : 6)} y={mid + 4} fontSize={12} fill={INK} fontWeight={600}>
        {r.name}
      </text>
      {r.shift && (
        <g stroke={ACC} fill={ACC}>
          {r.shift === "right" ? (
            <>
              <line x1={fx + fw * 0.5} y1={mid} x2={fx + fw * 0.78} y2={mid} strokeWidth={1.5} />
              <path d={`M${fx + fw * 0.78} ${mid - 4} L${fx + fw * 0.78 + 8} ${mid} L${fx + fw * 0.78} ${mid + 4} Z`} />
            </>
          ) : (
            <>
              <line x1={fx + fw * 0.52} y1={mid} x2={fx + fw * 0.8} y2={mid} strokeWidth={1.5} />
              <path d={`M${fx + fw * 0.52} ${mid - 4} L${fx + fw * 0.52 - 8} ${mid} L${fx + fw * 0.52} ${mid + 4} Z`} />
            </>
          )}
          {r.shiftLabel && (
            <text x={fx + fw * 0.66} y={mid - 5} fontSize={9} textAnchor="middle" stroke="none">
              на {r.shiftLabel}
            </text>
          )}
        </g>
      )}
      <text x={fx + 2} y={y0 + h + 12} fontSize={10} fill={FAINT} fontFamily="var(--font-mono, monospace)">
        {r.hi}
      </text>
      <text x={fx + fw - 2} y={y0 + h + 12} fontSize={10} textAnchor="end" fill={FAINT} fontFamily="var(--font-mono, monospace)">
        {r.lo}
      </text>
      {r.caption && (
        <text x={(r.x + regWidth(r)) * U + 8} y={mid + 4} fontSize={11} fill={DIM} fontWeight={600}>
          {r.caption}
        </text>
      )}
    </g>
  );
}

function Wire({ w, id }: { w: SchemeWire; id: string }) {
  const pts = w.points.map(([x, y]) => `${x * U},${y * U}`).join(" ");
  const [sx, sy] = w.points[0];
  return (
    <g>
      <polyline points={pts} fill="none" stroke={DIM} strokeWidth={1.2} markerEnd={w.arrow ? `url(#${id})` : undefined} />
      {w.invert && <circle cx={sx * U} cy={sy * U - 3} r={3} fill="var(--background)" stroke={DIM} />}
      {w.label && w.labelAt && (
        <text x={w.labelAt[0] * U} y={w.labelAt[1] * U} fontSize={10} fill={DIM}>
          {w.label}
        </text>
      )}
    </g>
  );
}

/** Структурна схема пристрою: регістри з номерами розрядів, зв'язки, ЛчТ, «&», тригери. */
export function RegSchemeView({ scheme, title }: { scheme: RegScheme; title: string }) {
  const id = `arr-${title.replace(/[^A-Za-z0-9]/g, "").slice(0, 8)}-${scheme.w}-${scheme.h}`;
  const vw = (scheme.w + PAD * 2) * U;
  const vh = (scheme.h + PAD * 2) * U;
  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-[4px] border border-border bg-black/20 p-2">
        <svg viewBox={`${-PAD * U} ${-PAD * U} ${vw} ${vh}`} width={vw} height={vh} role="img" aria-label={title} className="max-w-none">
          <defs>
            <marker id={id} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 Z" fill={DIM} />
            </marker>
          </defs>
          {scheme.bus && (
            <g fill="none" stroke={DIM} strokeWidth={1.2}>
              <path
                d={`M${scheme.bus.x1 * U} ${scheme.bus.y * U} l${U * 0.8} ${-U * 0.6} v${U * 0.3} H${scheme.bus.x2 * U - U * 0.8} v${-U * 0.3} l${U * 0.8} ${U * 0.6} l${-U * 0.8} ${U * 0.6} v${-U * 0.3} H${scheme.bus.x1 * U + U * 0.8} v${U * 0.3} Z`}
              />
            </g>
          )}
          {scheme.wires.map((w, i) => (
            <Wire key={i} w={w} id={id} />
          ))}
          {scheme.boxes.map((b, i) => (
            <g key={i}>
              <rect x={b.x * U} y={b.y * U} width={b.w * U} height={b.h * U} fill="var(--background)" stroke={DIM} />
              <text x={(b.x + b.w / 2) * U} y={(b.y + b.h / 2) * U + 4} fontSize={11} textAnchor="middle" fill={INK} fontWeight={600}>
                {b.text}
              </text>
            </g>
          ))}
          {scheme.regs.map((r, i) => (
            <Reg key={i} r={r} />
          ))}
          {scheme.texts.map((t, i) => (
            <text key={i} x={t.x * U} y={t.y * U} fontSize={11} textAnchor={t.anchor ?? "start"} fill={t.bold ? INK : DIM} fontWeight={t.bold ? 700 : 400}>
              {t.text}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="text-xs text-ink-faint">{title}</figcaption>
    </figure>
  );
}
