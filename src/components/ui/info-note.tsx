import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

export function InfoNote({
  title = "Что и почему",
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white/[0.02] px-5 py-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2 text-ink-dim">
        <BookOpen size={14} />
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-ink-dim [&_strong]:text-ink [&_code]:font-mono [&_code]:text-ink [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  );
}
