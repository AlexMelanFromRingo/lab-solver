/**
 * Порядок запуска и грабли — разметка, общая для модулей лабораторных.
 *
 * Вынесено сюда, потому что повторяется в каждом модуле, где работа
 * разворачивается командами: шаги нумеруются, команды показываются моноширинно,
 * грабли идут отдельным списком.
 */

export interface LabStep {
  title: string;
  body?: string;
  commands?: string[];
}

export function Steps({ steps, accent }: { steps: LabStep[]; accent: string }) {
  return (
    <ol className="space-y-6">
      {steps.map((step, i) => (
        <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="space-y-2">
            <h3 className="font-medium text-ink">{step.title}</h3>
            {step.body && <p className="text-sm leading-relaxed text-ink-dim">{step.body}</p>}
            {step.commands && (
              <pre className="overflow-x-auto rounded-xl border border-border bg-black/40 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
                {step.commands.join("\n")}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Pitfalls({ items, accent }: { items: string[]; accent: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">Где спотыкаются</h3>
      <ul className="space-y-2 text-sm text-ink-dim">
        {items.map((item) => (
          <li key={item} className="flex gap-2 leading-relaxed">
            <span style={{ color: accent }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
