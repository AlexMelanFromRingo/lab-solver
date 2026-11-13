"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/components/lang";
import { tr } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { XYPlot } from "@/components/xy-plot";
import { physLab } from "@/lib/physics";
import type { PhysLab, PhysTableOut } from "@/lib/physics/types";

const num = (s: string) => Number(String(s).trim().replace(",", ".").replace(/[−–]/g, "-"));
const show = (v: number) => String(v).replace(".", ",");

function OutTable({ table }: { table: PhysTableOut }) {
  const { lang } = useLang();
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">{tr(table.title, lang)}</h3>
      <div className="overflow-x-auto rounded-[4px] border border-border">
        <table className="w-full font-mono text-sm">
          <thead className="border-b border-border text-xs text-ink-faint">
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2 text-left align-bottom font-normal">
                  {tr(c, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-dim">
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-3 py-1.5 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{tr(table.note, lang)}</p>}
    </div>
  );
}

function initial(lab: PhysLab, v?: number) {
  const pick = v != null && lab.variants ? lab.variants.pick(v) : {};
  const params = Object.fromEntries(lab.params.map((p) => [p.key, show(pick.params?.[p.key] ?? p.value)]));
  const rows = (pick.rows ?? lab.rows ?? []).map((r) => r.map(show));
  return { params, rows };
}

/**
 * Калькулятор лабораторної з фізики: сталі установки і таблиця вимірювань
 * редагуються (за замовчуванням — дані викладача), нижче — таблиці методички,
 * підстановка у формули, графіки й висновок.
 */
export function PhysCalc({ slug }: { slug: string }) {
  const { lang } = useLang();
  const t = (uk: string, ru: string) => (lang === "uk" ? uk : ru);
  const lab = physLab(slug)!;
  const [variant, setVariant] = useState(String(lab.variants?.min ?? 1));
  const [state, setState] = useState(() => initial(lab, lab.variants?.min));

  const result = useMemo(() => {
    const p = Object.fromEntries(Object.entries(state.params).map(([k, v]) => [k, num(v)]));
    const bad = Object.entries(p).find(([, v]) => !Number.isFinite(v));
    if (bad) return { error: t(`Невірне значення: ${bad[0]}`, `Неверное значение: ${bad[0]}`) };
    const rows = state.rows.filter((r) => r.some((c) => c.trim() !== "")).map((r) => r.map(num));
    if (lab.columns && (!rows.length || rows.some((r) => r.some((x) => !Number.isFinite(x))))) {
      return { error: t("Заповніть усі клітинки таблиці вимірювань числами.", "Заполните все ячейки таблицы измерений числами.") };
    }
    try {
      return { out: lab.compute(p, rows, lang) };
    } catch (e) {
      return { error: (e as Error).message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, lang, lab]);

  const setParam = (k: string, v: string) => setState((s) => ({ ...s, params: { ...s.params, [k]: v } }));
  const setCell = (i: number, j: number, v: string) =>
    setState((s) => ({ ...s, rows: s.rows.map((r, ri) => (ri === i ? r.map((c, cj) => (cj === j ? v : c)) : r)) }));
  const width = lab.columns?.length ?? 0;

  const pickVariant = (raw: string) => {
    setVariant(raw);
    const v = Number(raw);
    if (lab.variants && Number.isInteger(v) && v >= lab.variants.min && v <= lab.variants.max) setState(initial(lab, v));
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardBody className="space-y-5 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">{t("Дані досліду", "Данные опыта")}</h2>
            <button
              type="button"
              onClick={() => setState(initial(lab, lab.variants ? Number(variant) : undefined))}
              className="rounded-[3px] border border-border px-3 py-1.5 text-xs text-ink-dim transition-colors hover:border-border-strong hover:text-ink"
            >
              {t("Повернути дані викладача", "Вернуть данные преподавателя")}
            </button>
          </div>
          {lab.dataNote && <p className="text-sm leading-relaxed text-ink-faint">{tr(lab.dataNote, lang)}</p>}

          {lab.variants && (
            <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
              <NumberField label={`Номер ${tr(lab.variants.label, lang)}`} value={variant} min={lab.variants.min} max={lab.variants.max} onChange={(e) => pickVariant(e.target.value)} />
              <p className="text-sm leading-relaxed text-ink-faint">{tr(lab.variants.hint, lang)}</p>
            </div>
          )}

          {lab.params.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {lab.params.map((p) => (
                <label key={p.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-dim">{tr(p.label, lang)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={state.params[p.key]}
                    onChange={(e) => setParam(p.key, e.target.value)}
                    className="w-full rounded-[3px] border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-ink focus:border-border-strong focus:outline-none"
                  />
                </label>
              ))}
            </div>
          )}

          {lab.columns && (
            <div>
              <div className="overflow-x-auto rounded-[4px] border border-border">
                <table className="w-full font-mono text-sm">
                  <thead className="border-b border-border text-xs text-ink-faint">
                    <tr>
                      <th className="px-2 py-2 text-left font-normal">№</th>
                      {lab.columns.map((c) => (
                        <th key={c.key} className="whitespace-nowrap px-2 py-2 text-left font-normal">
                          {tr(c.label, lang)}
                        </th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-2 py-1 text-ink-faint">{i + 1}</td>
                        {r.map((c, j) => (
                          <td key={j} className="px-1 py-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`${tr(lab.columns![j].label, lang)}, ${i + 1}`}
                              value={c}
                              onChange={(e) => setCell(i, j, e.target.value)}
                              className="w-24 rounded-[3px] border border-transparent bg-surface-2 px-2 py-1 text-ink focus:border-border-strong focus:outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            aria-label={t("Видалити рядок", "Удалить строку")}
                            onClick={() => setState((s) => ({ ...s, rows: s.rows.filter((_, ri) => ri !== i) }))}
                            className="px-2 text-ink-faint hover:text-ink"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, rows: [...s.rows, Array.from({ length: width }, (_, j) => s.rows[s.rows.length - 1]?.[j] ?? "")] }))}
                className="mt-2 text-xs text-ink-dim underline-offset-4 hover:text-ink hover:underline"
              >
                {t("+ рядок", "+ строка")}
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-6 pt-6">
          <h2 className="font-display text-lg font-semibold text-ink">{t("Результати для звіту", "Результаты для отчёта")}</h2>
          {"error" in result ? (
            <p className="text-sm text-codes">{result.error}</p>
          ) : (
            <>
              {result.out!.tables.map((tb, i) => (
                <OutTable key={i} table={tb} />
              ))}
              {result.out!.steps?.map((s, i) => (
                <OutputBlock key={i} label={tr(s.title, lang)} value={s.lines.join("\n")} wrap={false} />
              ))}
              {result.out!.plots?.map((pl, i) => (
                <XYPlot key={i} fig={pl.fig} title={tr(pl.title, lang)} />
              ))}
              {result.out!.conclusion && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-ink-dim">{t("Висновок", "Вывод")}</h3>
                  {result.out!.conclusion.map((c, i) => (
                    <p key={i} className="text-sm leading-relaxed text-ink-dim">
                      {tr(c, lang)}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
