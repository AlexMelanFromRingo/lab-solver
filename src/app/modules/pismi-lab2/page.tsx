"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { FileSet } from "@/components/ui/file-set";
import { categories, modules } from "@/lib/modules";
import { usePismiIndex } from "@/lib/pismi-files";
import {
  FORMULA_VARIANTS,
  evaluateVariant,
  formatValue,
} from "@/lib/algorithms/pismi-lab2-formulas";
import { TaskOutputView } from "@/components/task-output";
import { defaultValues, taskByVariant } from "@/lib/algorithms/pismi-lab2-objects";

const mod = modules.find((m) => m.slug === "pismi-lab2")!;
const accent = categories.pismi.accent;

/** Подписи аргументов: в методичке греческие, в коде латиницей. */
const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", a: "a", b: "b", x: "x", t: "t",
};

export default function PismiLab2Page() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = FORMULA_VARIANTS.find((v) => v.variant === variantNum)!;

  // Наборов заданий два и они разной длины: 15 в первой программе и 13 во
  // второй. Номер, выходящий за набор, заходит на второй круг.
  const taskNum = ((variantNum - 1) % 13) + 1;
  const task = taskByVariant(taskNum);

  const [argEdits, setArgEdits] = useState<Record<number, Record<string, number>>>({});
  const given = argEdits[variantNum] ?? variant.given;
  const result = useMemo(() => evaluateVariant(variant, given), [variant, given]);

  const [taskEdits, setTaskEdits] = useState<Record<number, Record<string, string>>>({});
  const taskValues = taskEdits[taskNum] ?? defaultValues(task);
  const output = useMemo(() => task.build(taskValues), [task, taskValues]);

  const index = usePismiIndex();
  const bundle = index?.lab2.find((b) => b.variant === variantNum);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Работа состоит из двух программ: первая считает выражения варианта и проверяет их
          равенство, вторая выполняет задание созданным объектом. Ниже — расчёт по любому
          варианту и готовые файлы работы: описание окружения и исходники, которые
          достаточно положить в каталог и поднять одной командой.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={15} onChange={setVariantNum} accent={accent} />

        {/* --- Программа 1 ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">Программа № 1</p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {variant.title}
              </h2>
            </div>

            <div className="rounded-xl border border-border bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink">
              <div>{variant.f1}</div>
              <div>{variant.f2}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Object.keys(variant.given).map((key) => (
                <TextField
                  key={key}
                  label={SYMBOLS[key] ?? key}
                  hint={`из таблицы: ${variant.given[key]}`}
                  value={String(given[key] ?? "")}
                  onChange={(e) =>
                    setArgEdits((prev) => ({
                      ...prev,
                      [variantNum]: { ...given, [key]: Number(e.target.value) },
                    }))
                  }
                />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="y₁" value={formatValue(result.y1)} />
              <OutputBlock label="y₂" value={formatValue(result.y2)} />
            </div>

            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                color: result.matched ? "#34d399" : "#fb7185",
                borderColor: result.matched ? "#34d39955" : "#fb718555",
                background: result.matched ? "#34d3990f" : "#fb71850f",
              }}
            >
              {result.matched
                ? `Значения совпали; расхождение ${result.difference.toExponential(2)} не превышает погрешности двойной точности.`
                : `Значения разошлись на ${result.difference.toExponential(2)}.`}
            </div>

            <details className="rounded-xl border border-border bg-black/20">
              <summary className="cursor-pointer px-4 py-2.5 text-sm text-ink-dim">
                Журнал вычисления и разбор тождества
              </summary>
              <div className="space-y-4 border-t border-border px-4 py-4">
                <table className="w-full text-sm">
                  <tbody>
                    {result.trace.map((step) => (
                      <tr key={step.label} className="border-b border-border/50 last:border-b-0">
                        <td className="py-1.5 pr-4 text-ink-dim">{step.label}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-ink">
                          {formatValue(step.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-lg border border-border bg-black/30 px-3 py-2 font-mono text-xs leading-relaxed text-ink">
                  {variant.identity.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-ink-dim">{variant.conclusion}</p>
                {variant.note && (
                  <p
                    className="rounded-lg border px-3 py-2 text-sm leading-relaxed"
                    style={{ color: accent, borderColor: `${accent}55`, background: `${accent}0f` }}
                  >
                    {variant.note}
                  </p>
                )}
              </div>
            </details>
          </CardBody>
        </Card>

        {/* --- Программа 2 ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">
                Программа № 2 · задание {taskNum}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
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
                  value={taskValues[param.name] ?? ""}
                  onChange={(e) =>
                    setTaskEdits((prev) => ({
                      ...prev,
                      [taskNum]: { ...taskValues, [param.name]: e.target.value },
                    }))
                  }
                />
              ))}
            </div>

            <TaskOutputView output={output} accent={accent} />

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

        {/* --- Файлы ------------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Готовые файлы работы · вариант {variantNum}
              </h2>
              <p className="mt-1.5 text-sm text-ink-dim">
                Положить рядом, выполнить <code>docker compose up -d</code> и открыть
                localhost:{bundle?.port ?? 8100 + variantNum}. Общие файлы из{" "}
                <code>_shared</code> лежат в модуле лабы 1.
              </p>
            </div>
            {bundle ? (
              <FileSet
                base={`../../pismi/lab2/v${String(variantNum).padStart(2, "0")}`}
                files={bundle.files}
                accent={accent}
              />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
