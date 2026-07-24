"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          // clipboard unavailable — silently ignore
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors",
        className
      )}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Скопировано" : "Копировать"}
    </button>
  );
}
