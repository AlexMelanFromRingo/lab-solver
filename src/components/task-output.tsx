"use client";

import type { TaskOutput } from "@/lib/algorithms/pismi-lab2-objects";

/**
 * Результат задания второй программы.
 *
 * У заданий разная природа — поразрядный разбор адреса, календарь, шахматная
 * доска, текст, пирамида, — поэтому задание возвращает не готовую разметку, а
 * описание того, что показать. Разметку подбирает эта функция, и задания о ней
 * ничего не знают.
 */
export function TaskOutputView({ output, accent }: { output: TaskOutput; accent: string }) {
  if (output.kind === "binary") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-faint">
              <th className="px-3 py-2 text-left">Величина</th>
              <th className="px-3 py-2 text-left">Десятичная</th>
              <th className="px-3 py-2 text-left">Двоичная</th>
            </tr>
          </thead>
          <tbody>
            {output.rows.map((row) => (
              <tr key={row.label} className="border-b border-border/50 last:border-b-0">
                <td className="px-3 py-2 text-ink-dim">{row.label}</td>
                <td className="px-3 py-2 font-mono" style={row.accent ? { color: accent } : undefined}>
                  {row.decimal}
                </td>
                <td className="px-3 py-2 font-mono" style={row.accent ? { color: accent } : undefined}>
                  {row.binary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (output.kind === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-faint">
              {output.head.map((head) => (
                <th key={head} className="px-3 py-2 text-left">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {output.rows.map((row, i) => (
              <tr key={row.join()} className="border-b border-border/50 last:border-b-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-3 py-2 font-mono"
                    style={i === output.accentRow ? { color: accent } : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (output.kind === "readout") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {output.items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-black/30 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-ink-faint">{item.label}</div>
            <div className="mt-1 font-mono text-lg" style={{ color: accent }}>{item.value}</div>
          </div>
        ))}
      </div>
    );
  }

  if (output.kind === "lines") {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-black/30 px-5 py-4">
        {output.lines.map((line) => (
          <p
            key={line}
            className="max-w-[70ch] text-sm leading-relaxed text-ink-dim"
            style={{ textAlign: output.align }}
          >
            {line}
          </p>
        ))}
      </div>
    );
  }

  if (output.kind === "pyramid") {
    return (
      <div className="space-y-1.5 overflow-x-auto rounded-xl border border-border bg-black/30 px-4 py-4">
        {output.rows.map((count) => (
          <div key={count} className="flex justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded border px-2 py-1 font-mono text-xs"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}0f` }}
              >
                {output.cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Сетка: календарь, координаты ячейки, шахматы, таблица по цифрам.
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-black/20 p-4">
      <table className="border-collapse font-mono text-xs">
        {output.colHeaders && (
          <thead>
            <tr>
              {output.rowHeaders && <th className="w-8" />}
              {output.colHeaders.map((head) => (
                <th key={head} className="px-2 py-1 font-normal text-ink-faint">{head}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {output.rows.map((row, r) => (
            <tr key={r}>
              {output.rowHeaders && (
                <td className="pr-2 text-right text-ink-faint">{output.rowHeaders[r]}</td>
              )}
              {row.map((cell, c) => {
                const marked = output.marked?.row === r + 1 && output.marked?.col === c + 1;
                const light = output.checker ? (r + c) % 2 === 0 : false;

                return (
                  <td
                    key={c}
                    className="h-9 w-9 border border-border text-center align-middle text-ink-dim"
                    style={{
                      background: marked
                        ? `${accent}26`
                        : light
                          ? "rgba(255,255,255,0.07)"
                          : output.checker
                            ? "rgba(0,0,0,0.35)"
                            : undefined,
                      borderColor: marked ? accent : undefined,
                      color: marked ? accent : undefined,
                      fontWeight: marked ? 600 : undefined,
                    }}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
