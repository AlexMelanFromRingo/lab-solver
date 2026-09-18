"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import {
  FORMULA_VARIANTS,
  evaluateVariant,
  formatValue,
} from "@/lib/algorithms/pismi-lab2-formulas";

const mod = modules.find((m) => m.slug === "pismi-lab2-formulas")!;
const accent = categories.pismi.accent;

/** Подписи аргументов: в методичке они греческие, в коде — латиницей. */
const SYMBOLS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  a: "a",
  b: "b",
  x: "x",
  t: "t",
};

export default function FormulasPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = FORMULA_VARIANTS.find((v) => v.variant === variantNum)!;

  // Значения условия можно менять: тождество выполняется не только в точке
  // из таблицы, и это видно, если подставить своё число. Правки хранятся по
  // номеру варианта, поэтому переключение возвращает табличные значения само
  // собой — без эффекта, сбрасывающего состояние.
  const [edits, setEdits] = useState<Record<number, Record<string, number>>>({});
  const given = edits[variantNum] ?? variant.given;

  const setArgument = (key: string, value: number) =>
    setEdits((prev) => ({ ...prev, [variantNum]: { ...given, [key]: value } }));

  const result = useMemo(() => evaluateVariant(variant, given), [variant, given]);
  const changed = Object.keys(variant.given).some(
    (key) => given[key] !== variant.given[key]
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Задание варианта: посчитать два выражения и убедиться, что при заданном значении
          они совпадают. Совпадение не случайно — за каждой парой стоит конкретное
          тождественное преобразование. Оба выражения считаются прямо по условию, без
          упрощений: смысл как раз в том, чтобы сошлись два разных пути вычисления. Поэтому
          сравнение идёт не на точное равенство — двойная точность даёт расхождение в
          последних разрядах, и допуск берётся пропорциональным самой величине.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={15} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {variant.title}
              </h2>
            </div>

            <div className="rounded-xl border border-border bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink">
              <div>{variant.f1}</div>
              <div>{variant.f2}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Object.keys(variant.given).map((key) => (
                <NumberField
                  key={key}
                  label={SYMBOLS[key] ?? key}
                  hint={`из таблицы: ${variant.given[key]}`}
                  step="any"
                  value={Number.isFinite(given[key]) ? given[key] : ""}
                  onChange={(e) => setArgument(key, Number(e.target.value))}
                />
              ))}
            </div>

            {changed && (
              <p className="text-xs text-ink-faint">
                Значения отличаются от таблицы варианта. Тождество от этого не перестаёт
                выполняться — в этом и смысл проверки.
              </p>
            )}

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
                : `Значения разошлись на ${result.difference.toExponential(2)} — это больше допустимой погрешности вычислений.`}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h3 className="text-sm font-medium text-ink-dim">Журнал вычисления</h3>
            <p className="text-sm text-ink-faint">
              Промежуточные величины, из которых видно, как одно выражение переходит в
              другое. Набор величин у каждого варианта свой — его определяет то
              преобразование, что лежит в основе задания.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-ink-faint">
                    <th className="px-3 py-2 text-left">Величина</th>
                    <th className="px-3 py-2 text-right">Значение</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trace.map((step) => (
                    <tr key={step.label} className="border-b border-border/50 last:border-b-0">
                      <td className="px-3 py-2 text-ink-dim">{step.label}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                        {formatValue(step.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h3 className="text-sm font-medium text-ink-dim">Почему выражения равны</h3>
            <div className="rounded-xl border border-border bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink">
              {variant.identity.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">{variant.conclusion}</p>
            {variant.note && (
              <p
                className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}0f` }}
              >
                {variant.note}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
