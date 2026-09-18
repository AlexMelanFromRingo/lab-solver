"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { TextField } from "@/components/ui/field";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import {
  defaultValues,
  taskByVariant,
  type TaskOutput,
} from "@/lib/algorithms/pismi-lab2-objects";

const mod = modules.find((m) => m.slug === "pismi-lab2-objects")!;
const accent = categories.pismi.accent;

export default function ObjectsPage() {
  const [variantNum, setVariantNum] = useState(1);
  const task = taskByVariant(variantNum);

  // Правки параметров хранятся по номеру варианта, поэтому переключение
  // возвращает значения по умолчанию само собой.
  const [edits, setEdits] = useState<Record<number, Record<string, string>>>({});
  const values = edits[variantNum] ?? defaultValues(task);

  const output = useMemo(() => task.build(values), [task, values]);

  const setParam = (name: string, value: string) =>
    setEdits((prev) => ({ ...prev, [variantNum]: { ...values, [name]: value } }));

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Тринадцать заданий второй программы, по одному на вариант. Методичка требует, чтобы
          задание выполнял созданный объект, поэтому вариант сам объявляет, какие параметры он
          читает и что из них строит, — форма ниже собрана из этого объявления и одинаково
          работает для любого варианта.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={13} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {task.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{task.statement}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {task.params.map((param) => (
                <TextField
                  key={param.name}
                  label={param.label}
                  hint={param.default}
                  value={values[param.name] ?? ""}
                  onChange={(e) => setParam(param.name, e.target.value)}
                />
              ))}
            </div>

            <Output output={output} accent={accent} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h3 className="text-sm font-medium text-ink-dim">Что показывает это задание</h3>
            <p className="text-sm leading-relaxed text-ink-dim">{task.conclusion}</p>
            {task.note && (
              <p
                className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}0f` }}
              >
                {task.note}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/** Результат задания: у каждого вида свой способ показа. */
function Output({ output, accent }: { output: TaskOutput; accent: string }) {
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
              {output.head.map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
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
          <p key={line} className="max-w-[70ch] text-sm leading-relaxed text-ink-dim"
             style={{ textAlign: output.align }}>
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
                className="rounded border px-2 py-1 font-mono text-xs whitespace-nowrap"
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
              {output.colHeaders.map((h) => (
                <th key={h} className="px-2 py-1 font-normal text-ink-faint">{h}</th>
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
