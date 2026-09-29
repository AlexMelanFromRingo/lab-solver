"use client";

import { cn } from "@/lib/cn";

/** Переключатель из нескольких взаимоисключающих вариантов. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  accent,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-[3px] border border-border">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3.5 py-2 text-sm transition-colors",
              i > 0 && "border-l border-border",
              selected ? "text-ink" : "text-ink-faint hover:text-ink-dim",
            )}
            style={selected ? { boxShadow: `inset 0 -2px 0 ${accent}`, background: "rgba(255,255,255,0.03)" } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
