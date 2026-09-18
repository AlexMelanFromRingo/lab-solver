"use client";

import { buildFlsFile, encodeCp1251 } from "@/lib/algorithms/fls-file";
import { OutputBlock } from "@/components/ui/output-block";
import type { FuzzySystem, Methods } from "@/lib/algorithms/fuzzy-mamdani";

/**
 * Готовая система файлом .fls.
 *
 * Файл отдаётся в CP1251: в UTF-8 программа его откроет, но имена термов
 * превратятся в мусор. Браузер кодирует только в UTF-8, поэтому байты
 * собираются вручную и складываются в Blob как есть.
 */
export function FlsDownload({
  system,
  values,
  methods,
  filename,
  accent,
}: {
  system: FuzzySystem;
  values: Record<string, number>;
  methods: Methods;
  filename: string;
  accent: string;
}) {
  const text = buildFlsFile(system, values, methods);

  const download = () => {
    const blob = new Blob([encodeCp1251(text)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={download}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}44` }}
        >
          Скачать {filename}
        </button>
        <span className="text-xs text-ink-faint">
          кодировка CP1251, концы строк CRLF — как ждёт программа
        </span>
      </div>

      <details className="rounded-xl border border-border bg-black/20">
        <summary className="cursor-pointer px-4 py-2.5 text-sm text-ink-dim">
          Посмотреть содержимое файла
        </summary>
        <div className="border-t border-border p-4">
          <OutputBlock label={filename} value={text.replace(/\r\n/g, "\n")} wrap={false} />
        </div>
      </details>
    </div>
  );
}
