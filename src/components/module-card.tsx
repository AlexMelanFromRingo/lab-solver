"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { categories, type LabModule } from "@/lib/modules";
import { cn } from "@/lib/cn";

/**
 * Модуль в перечне.
 *
 * Карточка устроена как строка приборной панели: слева цветная насечка,
 * под которой название, внизу — показания. Надзаголовка с названием раздела
 * здесь нет: модули и так сгруппированы по разделам, и повторять название
 * на каждой карточке значит занимать место тем, что читатель уже знает.
 * Нет и стрелки в углу — ссылка и так ссылка.
 */

const SIZE_CLASSES: Record<LabModule["size"], string> = {
  lg: "sm:col-span-2 sm:row-span-2",
  md: "sm:col-span-1 sm:row-span-2",
  sm: "sm:col-span-1 sm:row-span-1",
};

/** Показания карточки: то, что читается как данные, а не как подпись. */
function Readout({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.6875rem] leading-none text-ink-faint">{label}</div>
      <div
        className="mt-1 truncate font-mono text-[0.8125rem] leading-none"
        style={{ color: accent ?? "var(--ink-dim)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function ModuleCard({ module, index }: { module: LabModule; index: number }) {
  const cat = categories[module.category];
  const big = module.size !== "sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.24) }}
      className={cn(SIZE_CLASSES[module.size])}
    >
      <Link
        href={`/modules/${module.slug}`}
        className="group relative flex h-full flex-col justify-between overflow-hidden border border-border bg-surface/70 px-5 pb-4 pt-5 transition-colors hover:border-border-strong hover:bg-surface"
        style={{ borderRadius: 4 }}
      >
        {/* насечка раздела: цвет отмечает принадлежность, не занимая строку */}
        <span
          className="absolute left-0 top-0 h-[2px] w-10 transition-all duration-300 group-hover:w-full"
          style={{ background: cat.accent }}
          aria-hidden="true"
        />

        <div className="min-w-0">
          <h3
            className={cn(
              "font-display font-semibold tracking-[-0.02em] text-ink",
              big ? "text-[1.35rem] leading-[1.15]" : "text-[1.0625rem] leading-[1.2]"
            )}
          >
            {module.title}
          </h3>

          {big && (
            <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-ink-dim">
              {module.description}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-x-7 gap-y-3">
          <Readout label="что считает" value={module.tagline} />
          {module.hasVariants && (
            <Readout
              label="вариантов"
              value={String(module.variantCount)}
              accent={cat.accent}
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
}
