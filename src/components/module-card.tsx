"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { categories, type LabModule } from "@/lib/modules";
import { cn } from "@/lib/cn";

const SIZE_CLASSES: Record<LabModule["size"], string> = {
  lg: "sm:col-span-2 sm:row-span-2",
  md: "sm:col-span-1 sm:row-span-2",
  sm: "sm:col-span-1 sm:row-span-1",
};

export function ModuleCard({ module, index }: { module: LabModule; index: number }) {
  const cat = categories[module.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 80, damping: 20, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={cn(SIZE_CLASSES[module.size])}
    >
      <Link
        href={`/modules/${module.slug}`}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-6 transition-colors hover:border-border-strong"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: cat.accent }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: cat.accent }}
            >
              {cat.title}
            </span>
            <ArrowUpRight
              size={16}
              className="text-ink-faint transition-all group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink mb-1.5">{module.title}</h3>
          <p className="text-xs text-ink-faint font-mono mb-3">{module.tagline}</p>
          {module.size !== "sm" && <p className="text-sm text-ink-dim leading-relaxed">{module.description}</p>}
        </div>
        {module.hasVariants && (
          <div className="relative mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.accent }} />
            {module.variantCount} вариантов
          </div>
        )}
      </Link>
    </motion.div>
  );
}
