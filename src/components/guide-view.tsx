"use client";

import { useMemo, useState } from "react";
import { AclBuilder } from "@/components/acl-builder";
import { ApproxCalc, CauchyCalc, IterationCalc, RootsCalc, SlaeCalc } from "@/components/amo-calc";
import { Ethernet10Calc, FastEthernetCalc } from "@/components/lan-calc";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { categories, modules } from "@/lib/modules";
import { guideBySlug } from "@/lib/data/guides";
import type { GuideTable } from "@/lib/data/guides/types";

function Table({ table }: { table: GuideTable }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">{table.title}</h3>
      <div className="overflow-x-auto rounded-[4px] border border-border">
        <table className="w-full font-mono text-sm">
          <thead className="border-b border-border text-xs text-ink-faint">
            <tr>
              {table.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left align-bottom font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-dim">
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{table.note}</p>}
    </div>
  );
}

/**
 * Страница работы-инструкции: данные варианта, порядок по методичке, кадры,
 * состав отчёта и то, что должно получиться.
 */
export function GuideView({ slug }: { slug: string }) {
  const mod = modules.find((m) => m.slug === slug)!;
  const g = guideBySlug(slug)!;
  const accent = categories[mod.category].accent;
  const [raw, setRaw] = useState(String(Math.max(1, g.variant?.min ?? 1)));

  const computed = useMemo(() => {
    if (!g.variant) return g.computed ? { data: g.computed() } : null;
    const v = Number(raw);
    if (!Number.isInteger(v) || v < g.variant.min || v > g.variant.max) {
      return { error: `Номер — целое число от ${g.variant.min} до ${g.variant.max}` };
    }
    try {
      return { data: g.variant.compute(v) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [g, raw]);

  // калькулятор с вводом своих данных идёт первым, если у работы нет таблицы вариантов
  const widget = (
    <>
      {g.widget === "acl" && <AclBuilder accent={accent} />}
      {g.widget === "eth10" && <Ethernet10Calc accent={accent} />}
      {g.widget === "fast" && <FastEthernetCalc accent={accent} />}
      {g.widget === "slae" && <SlaeCalc />}
      {g.widget === "iter" && <IterationCalc />}
      {g.widget === "roots" && <RootsCalc />}
      {g.widget === "approx" && <ApproxCalc />}
      {g.widget === "cauchy" && <CauchyCalc />}
    </>
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <InfoNote>{g.intro}</InfoNote>

        {!g.variant && widget}

        {computed && (
          <Card>
            <CardBody className="space-y-6 pt-6">
              {g.variant && (
                <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
                  <NumberField
                    label={`Номер ${g.variant.label}`}
                    value={raw}
                    min={g.variant.min}
                    max={g.variant.max}
                    onChange={(e) => setRaw(e.target.value)}
                  />
                  <p className="text-sm leading-relaxed text-ink-faint">{g.variant.hint}</p>
                </div>
              )}

              {"error" in computed ? (
                <p className="text-sm text-codes">{computed.error}</p>
              ) : (
                <>
                  {computed.data.tables?.map((t) => <Table key={t.title} table={t} />)}
                  {computed.data.code?.map((c) => (
                    <div key={c.title} className="space-y-1.5">
                      <OutputBlock label={c.title} value={c.code} wrap={false} />
                      {c.note && <p className="text-xs text-ink-faint">{c.note}</p>}
                    </div>
                  ))}
                  {computed.data.notes?.map((n) => (
                    <p key={n} className="text-sm leading-relaxed text-ink-dim">
                      {n}
                    </p>
                  ))}
                </>
              )}
            </CardBody>
          </Card>
        )}

        {g.variant && widget}

        {g.errata && g.errata.length > 0 && (
          <Card>
            <CardBody className="space-y-3 pt-6">
              <h2 className="font-display text-lg font-semibold text-ink">Где методичка расходится с программой</h2>
              <ul className="space-y-2.5">
                {g.errata.map((e) => (
                  <li key={e} className="flex gap-2 text-sm leading-relaxed text-ink-dim">
                    <span style={{ color: accent }}>·</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        <LabProcedure guide={g.guide} accent={accent} />

        {g.findings && g.findings.length > 0 && (
          <Card>
            <CardBody className="space-y-4 pt-6">
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Что должно получиться</h2>
              {g.findings.map((f) => (
                <div key={f.title}>
                  <h3 className="text-sm font-medium text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-dim">{f.body}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
