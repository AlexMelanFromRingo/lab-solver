"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/cn";

/** З якого боку текст продовжується за межі видимої області. */
interface Edges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

const NONE: Edges = { top: false, bottom: false, left: false, right: false };

export function CodeBlock({ code, filename, className }: { code: string; filename: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  // Текст у блоці прокручується в обидва боки, і без позначки край виглядає
  // так, ніби рядок просто обрізано. Тому з того боку, де текст триває,
  // з'являється згасання.
  const pre = useRef<HTMLPreElement>(null);
  const [edges, setEdges] = useState<Edges>(NONE);

  const measure = useCallback(() => {
    const el = pre.current;
    if (!el) return;
    const slack = 2; // округлення розмірів при масштабуванні сторінки
    setEdges({
      top: el.scrollTop > slack,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - slack,
      left: el.scrollLeft > slack,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - slack,
    });
  }, []);

  useEffect(() => {
    const el = pre.current;
    if (!el) return;
    // Перший вимір робиться у зворотному виклику спостерігача, а не одразу:
    // на момент запуску ефекту розміри ще не остаточні.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, code]);

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
    <div className={cn("rounded-[4px] border border-border bg-black/40 overflow-hidden", className)}>
      {/* На узком экране длинное имя файла обрезается, а не выталкивает
          кнопки за край блока. */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="min-w-0 truncate text-xs font-mono text-ink-faint">{filename}</span>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
          >
            <Download size={13} />
            Скачать
          </button>
        </div>
      </div>
      <div className="relative">
        <pre
          ref={pre}
          onScroll={measure}
          className="max-h-[32rem] overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-ink"
        >
          {code}
        </pre>

        {edges.top && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent" />
        )}
        {edges.bottom && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/75 to-transparent" />
        )}
        {edges.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent" />
        )}
        {edges.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/70 to-transparent" />
        )}
      </div>
    </div>
  );
}
