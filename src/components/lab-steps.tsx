"use client";

import type { ReactNode } from "react";
import { tr, type Loc } from "@/lib/i18n";
import { useLang } from "@/components/lang";

/**
 * Порядок запуска и грабли — разметка, общая для модулей лабораторных.
 *
 * Вынесено сюда, потому что повторяется в каждом модуле, где работа
 * разворачивается командами: шаги нумеруются, команды показываются моноширинно,
 * грабли идут отдельным списком.
 */

export interface LabStep {
  /** Без заголовка шаг — одна фраза (так записаны шаги в manifest.json курса). */
  title?: Loc;
  body?: Loc;
  commands?: string[];
  /** Дерево каталогов: там, где шаг о структуре проекта, его и надо видеть. */
  tree?: string[];
}

export function Steps({
  steps,
  accent,
  compact = false,
}: {
  steps: LabStep[];
  accent: string;
  /** Шаги-фразы без заголовков стоят плотнее. */
  compact?: boolean;
}) {
  const { lang } = useLang();
  return (
    <ol className={compact ? "space-y-3" : "space-y-6"}>
      {steps.map((step, i) => (
        <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="space-y-2">
            {step.title && <h3 className="font-medium text-ink">{tr(step.title, lang)}</h3>}
            {step.body && (
              <p className={step.title ? "text-sm leading-relaxed text-ink-dim" : "text-sm leading-relaxed text-ink"}>
                {tr(step.body, lang)}
              </p>
            )}
            {step.tree && (
              <pre
                className="overflow-x-auto rounded-[4px] border px-4 py-3 font-mono text-xs leading-relaxed text-ink-dim"
                style={{ borderColor: `${accent}33`, background: `${accent}0a` }}
              >
                {step.tree.join("\n")}
              </pre>
            )}
            {step.commands && (
              <pre className="overflow-x-auto rounded-[4px] border border-border bg-black/40 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
                {step.commands.join("\n")}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Pitfalls({
  items,
  accent,
  title,
}: {
  items: ReactNode[];
  accent: string;
  title?: Loc;
}) {
  const { lang } = useLang();
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">
        {tr(title ?? { uk: "Де спотикаються", ru: "Где спотыкаются" }, lang)}
      </h3>
      <ul className="space-y-2 text-sm text-ink-dim">
        {items.map((item, i) => (
          <li key={typeof item === "string" ? item : i} className="flex gap-2 leading-relaxed">
            <span style={{ color: accent }}>·</span>
            <div className="min-w-0">{item}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
