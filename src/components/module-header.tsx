import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryBadge } from "@/components/ui/badge";
import type { LabModule } from "@/lib/modules";

export function ModuleHeader({ module }: { module: LabModule }) {
  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-ink-faint hover:text-ink-dim transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Все модули
        </Link>
        <CategoryBadge category={module.category} />
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
          {module.title}
        </h1>
        <p className="mt-2 text-ink-dim max-w-2xl">{module.description}</p>
        <p className="mt-3 text-xs font-mono text-ink-faint">источник: {module.source}</p>
      </div>
    </div>
  );
}
