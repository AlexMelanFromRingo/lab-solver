"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";

export function VariantDial({
  value,
  min,
  max,
  onChange,
  accent,
  label = "Вариант",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accent: string;
  label?: string;
}) {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="inline-flex items-stretch rounded-2xl border border-border-strong bg-surface-2 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <button
        type="button"
        aria-label="Предыдущий вариант"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="px-3 flex items-center justify-center text-ink-dim hover:text-ink hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex flex-col items-center justify-center px-5 py-2 min-w-[7.5rem] border-x border-border">
        <label htmlFor={id} className="text-[10px] uppercase tracking-wider text-ink-faint font-medium">
          {label}
        </label>
        <div className="relative h-9 w-full flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="absolute font-display text-2xl font-semibold tabular-nums"
              style={{ color: accent }}
            >
              №&nbsp;{value}
            </motion.span>
          </AnimatePresence>
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="sr-only"
        />
      </div>

      <button
        type="button"
        aria-label="Следующий вариант"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="px-3 flex items-center justify-center text-ink-dim hover:text-ink hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
