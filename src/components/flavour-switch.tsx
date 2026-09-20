"use client";

import { FileSet } from "@/components/ui/file-set";
import type { LabBundle } from "@/lib/pismi-files";

/**
 * Выбор сборки работы: строго по заданию или с оформлением.
 *
 * По умолчанию показывается первая. Смысл в том, что задание требует ровно
 * нескольких файлов, а всё остальное — удобство: общее начало документа,
 * отдельный файл стилей, основа для класса. Одинаковый набор таких файлов в
 * каждом варианте выглядит одинаково и сразу выдаёт, что работы собраны разом.
 */
export function FlavourSwitch({
  base,
  basic,
  extended,
  value,
  onChange,
  accent,
  basicNote,
  extendedNote,
}: {
  /** Путь к каталогу работы без имени сборки. */
  base: string;
  basic: LabBundle;
  extended: LabBundle;
  value: "basic" | "extended";
  onChange: (v: "basic" | "extended") => void;
  accent: string;
  basicNote: string;
  extendedNote: string;
}) {
  const bundle = value === "basic" ? basic : extended;

  return (
    <div className="space-y-5">
      <div className="inline-flex border border-border" style={{ borderRadius: 4 }}>
        {(
          [
            ["basic", "Строго по методичке"],
            ["extended", "С оформлением"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="px-4 py-2 text-sm transition-colors"
            style={
              value === key
                ? { background: `${accent}18`, color: accent }
                : { color: "var(--ink-faint)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-ink-dim">
        {value === "basic" ? basicNote : extendedNote}
      </p>

      <FileSet
        base={`${base}/${value === "basic" ? "basic" : "full"}`}
        files={bundle.files}
        archive={bundle.archive}
        accent={accent}
      />
    </div>
  );
}
