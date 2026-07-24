"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/cn";

export function CodeBlock({ code, filename, className }: { code: string; filename: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn("rounded-xl border border-border bg-black/40 overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-mono text-ink-faint">{filename}</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
          >
            <Download size={13} />
            Скачать
          </button>
        </div>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-ink leading-relaxed overflow-x-auto max-h-[32rem] overflow-y-auto">
        {code}
      </pre>
    </div>
  );
}
