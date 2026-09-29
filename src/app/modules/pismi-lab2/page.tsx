"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
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
const procedure = LAB_GUIDES["pismi-lab2"];

/** Подписи аргументов: в методичке греческие, в коде латиницей. */
const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", a: "a", b: "b", x: "x", t: "t",
};

/** Наборы вариантов разной длины: 15 у первой программы, 13 у второй. */
const P1_COUNT = 15;
const P2_COUNT = 13;

/** Номер в списке группы → вариант набора длины m: за концом набора — второй круг. */
const wrap = (n: number, m: number) => ((n - 1) % m) + 1;

export default function PismiLab2Page() {
  // Методичка выдаёт варианты «за узгодженням з викладачем» — у каждой
  // программы свой, поэтому выбираются они независимо.
  const [variantNum, setVariantNum] = useState(1);
  const [taskNum, setTaskNum] = useState(1);
  const [listNum, setListNum] = useState("");
  const variant = FORMULA_VARIANTS.find((v) => v.variant === variantNum)!;
  const task = taskByVariant(taskNum);

  const [argEdits, setArgEdits] = useState<Record<number, Record<string, number>>>({});
  const given = argEdits[variantNum] ?? variant.given;
  const result = useMemo(() => evaluateVariant(variant, given), [variant, given]);

  const [taskEdits, setTaskEdits] = useState<Record<number, Record<string, string>>>({});
  const taskValues = taskEdits[taskNum] ?? defaultValues(task);
  const output = useMemo(() => task.build(taskValues), [task, taskValues]);

  const { index, failed } = usePismiIndex();
  const lab = index?.labs["2"];

  function byListNumber(raw: string) {
    setListNum(raw);
    const n = Math.trunc(Number(raw));
    if (raw.trim() === "" || !Number.isFinite(n) || n < 1) return;
    setVariantNum(wrap(n, P1_COUNT));
    setTaskNum(wrap(n, P2_COUNT));
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Работа состоит из двух программ: первая считает функции варианта и проверяет их
          равенство, вторая выполняет задание созданным объектом. Ниже — расчёт по любым
          вариантам и готовая работа: окружение и обе программы с вашими ПІБ и группой в
          коде, в выбранном оформлении.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Варианты</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-dim">
                Варианты выдаются по согласованию с преподавателем, у каждой программы свой: у
                первой их {P1_COUNT}, у второй {P2_COUNT}. Если вариант — номер в списке группы,
                впишите его справа: номер за пределами набора уходит на второй круг.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <VariantDial
                value={variantNum}
                min={1}
                max={P1_COUNT}
                onChange={setVariantNum}
                accent={accent}
                label="Программа № 1"
              />
              <VariantDial
                value={taskNum}
                min={1}
                max={P2_COUNT}
                onChange={setTaskNum}
                accent={accent}
                label="Программа № 2"
              />
              <div className="w-full sm:w-44">
                <NumberField
                  label="Номер в списке"
                  min={1}
                  value={listNum}
                  onChange={(e) => byListNumber(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* --- Программа 1 ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">Программа № 1 · вариант {variantNum}</p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {variant.title}
              </h2>
            </div>

            <div className="rounded-[4px] border border-border bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink">
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
              className="rounded-[4px] border px-4 py-3 text-sm"
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

            <details className="rounded-[4px] border border-border bg-black/20">
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
                <div className="rounded-[3px] border border-border bg-black/30 px-3 py-2 font-mono text-xs leading-relaxed text-ink">
                  {variant.identity.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-ink-dim">{variant.conclusion}</p>
                {variant.note && (
                  <p
                    className="rounded-[3px] border px-3 py-2 text-sm leading-relaxed"
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
              <p className="text-xs text-ink-faint">
                Программа № 2 · вариант {taskNum}
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
                className="rounded-[4px] border px-4 py-3 text-sm leading-relaxed"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}0f` }}
              >
                {task.note}
              </p>
            )}
          </CardBody>
        </Card>

        {/* --- Готовая работа -------------------------------------------- */}
        {lab && index ? (
          <>
            <PismiWork
              index={index}
              lab={lab}
              accent={accent}
              choice={{ v1: variantNum, v2: taskNum }}
              intro={
                <>
                  Программа № 1 — вариант {variantNum}, программа № 2 — вариант {taskNum} (выбраны
                  выше). Окружение — тот же docker-compose.yml, что в первой работе: порт 8080,
                  контейнер php_web.
                </>
              }
            />
            <PismiRun lab={lab} accent={accent} />
          </>
        ) : (
          <p className="text-sm text-ink-faint">
            {failed ? "Готовая работа не загрузилась. Обновите страницу." : "Загрузка готовой работы…"}
          </p>
        )}
      </div>
    </div>
  );
}
