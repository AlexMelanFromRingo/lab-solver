import { CopyButton } from "./copy-button";
import { cn } from "@/lib/cn";

export function OutputBlock({
  label,
  value,
  mono = true,
  wrap = true,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-black/30", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
        <CopyButton value={value} />
      </div>
      <div
        className={cn(
          "px-4 py-3 text-sm leading-relaxed text-ink",
          mono && "font-mono",
          wrap ? "break-all whitespace-pre-wrap" : "overflow-x-auto whitespace-pre"
        )}
      >
        {value || <span className="text-ink-faint">—</span>}
      </div>
    </div>
  );
}

export function StepList({ steps }: { steps: (string | number)[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 text-sm font-mono text-ink-dim">
          <span className="text-ink-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-ink">{s}</span>
        </li>
      ))}
    </ol>
  );
}
