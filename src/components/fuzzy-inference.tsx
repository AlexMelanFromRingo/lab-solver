"use client";

import { useMemo } from "react";
import { ResultChart, TermChart } from "@/components/fuzzy-chart";
import {
  METHOD_LABELS,
  humanName,
  infer,
  type FuzzySystem,
  type Methods,
} from "@/lib/algorithms/fuzzy-mamdani";

/**
 * Ход нечёткого вывода по этапам.
 *
 * Методичка требует показать в отчёте каждый этап отдельно и сделать вывод по
 * каждому, поэтому здесь не один ответ, а вся цепочка: степени принадлежности
 * входов, сила каждого правила, аккумулированная фигура и точка, в которую она
 * дефазифицирована.
 */

/** Запятая как разделитель дробной части и настоящий минус, а не дефис. */
const ru = (v: string) => v.replace(".", ",").replace("-", "\u2212");

const fmt3 = (v: number) => ru(v.toFixed(3));

function Stage({
  number,
  title,
  note,
  accent,
  children,
}: {
  number: number;
  title: string;
  note: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
      <div
        className="hidden h-8 w-8 items-center justify-center rounded-lg font-mono text-sm sm:flex"
        style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}33` }}
      >
        {number}
      </div>
      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-dim">{note}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function FuzzyInference({
  system,
  values,
  methods,
  accent,
}: {
  system: FuzzySystem;
  values: Record<string, number>;
  methods: Methods;
  accent: string;
}) {
  const result = useMemo(() => infer(system, values, methods), [system, values, methods]);

  const degreesOf = (variable: string) =>
    Object.fromEntries(
      result.fuzzified.filter((f) => f.variable === variable).map((f) => [f.term, f.degree])
    );

  const firedCount = result.fired.filter((r) => r.strength > 1e-6).length;
  const unit = system.output.unit ? ` ${system.output.unit}` : "";

  return (
    <div className="space-y-8">
      <Stage
        number={1}
        title="Фазификация"
        note="Для каждой входной переменной берётся значение функции принадлежности каждого её терма в заданной точке."
        accent={accent}
      >
        <div className="space-y-6">
          {system.inputs.map((variable) => (
            <div key={variable.name}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink">{variable.label}</span>
                <span className="font-mono text-xs text-ink-faint">
                  {variable.name} = {ru(String(values[variable.name] ?? "—"))}
                  {variable.unit ? ` ${variable.unit}` : ""}
                </span>
              </div>
              <TermChart
                variable={variable}
                value={values[variable.name]}
                degrees={degreesOf(variable.name)}
              />
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        number={2}
        title="Агрегирование посылок"
        note={`Сила правила — свёртка степеней его посылок. Связка конъюнктивная, способ построения — ${METHOD_LABELS[methods.conj]}.`}
        accent={accent}
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-ink-faint">
                <th className="px-3 py-2 text-left font-medium">Правило</th>
                <th className="px-3 py-2 text-left font-medium">Посылки</th>
                <th className="px-3 py-2 text-right font-medium">Сила</th>
                <th className="px-3 py-2 text-left font-medium">Заключение</th>
              </tr>
            </thead>
            <tbody>
              {result.fired.map((rule) => {
                const active = rule.strength > 1e-6;
                return (
                  <tr
                    key={rule.index}
                    className="border-b border-border/50 last:border-b-0"
                    style={active ? { background: `${accent}0b` } : undefined}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink-faint">{rule.index + 1}</td>
                    <td className="px-3 py-2">
                      <span className={active ? "text-ink" : "text-ink-faint"}>
                        {rule.antecedents.map((a, i) => (
                          <span key={a.variable}>
                            {i > 0 && (
                              <span className="text-ink-faint">
                                {rule.op === "or" ? " или " : " и "}
                              </span>
                            )}
                            {humanName(a.variable)} — {humanName(a.term)}
                            <span className="font-mono text-xs text-ink-faint"> ({fmt3(a.degree)})</span>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2 text-right font-mono"
                      style={active ? { color: accent } : undefined}
                    >
                      <span className={active ? "" : "text-ink-faint"}>{fmt3(rule.strength)}</span>
                    </td>
                    <td className={`px-3 py-2 ${active ? "text-ink" : "text-ink-faint"}`}>
                      {humanName(rule.then)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-dim">
          {firedCount === 0
            ? "Ни одно правило не сработало: база не покрывает это сочетание входных значений."
            : `Сработало правил: ${firedCount} из ${result.fired.length}.`}
        </p>
      </Stage>

      <Stage
        number={3}
        title="Активизация и аккумуляция"
        note={`Каждое заключение ограничивается силой своего правила (${METHOD_LABELS[methods.impl]}), затем заключения всех правил сводятся в одну фигуру (${METHOD_LABELS[methods.accum]}).`}
        accent={accent}
      >
        <ResultChart
          curve={result.curve}
          crisp={result.crisp}
          universe={system.output.universe}
          accent={accent}
        />
        <p className="text-sm text-ink-dim">
          Наибольшее значение аккумулированной функции — {fmt3(result.peak)}.
        </p>
      </Stage>

      <Stage
        number={4}
        title="Дефазификация"
        note={`Переход к чёткому числу способом «${METHOD_LABELS[methods.defuzz]}».`}
        accent={accent}
      >
        <div
          className="rounded-xl border px-5 py-4"
          style={{ borderColor: `${accent}44`, background: `${accent}0d` }}
        >
          <div className="text-xs uppercase tracking-wide text-ink-faint">
            {system.output.label}
          </div>
          <div className="mt-1 font-mono text-2xl" style={{ color: accent }}>
            {result.crisp === null
              ? "нет вывода"
              : `${ru(result.crisp.toFixed(2))}${unit}`}
          </div>
          {result.crisp === null && (
            <p className="mt-2 text-sm text-ink-dim">
              Аккумулированное множество пусто. Сама FLS в этом случае показывает −1.
            </p>
          )}
        </div>
      </Stage>
    </div>
  );
}
