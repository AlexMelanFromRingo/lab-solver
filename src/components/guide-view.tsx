"use client";

import { useMemo, useState } from "react";
import { AclBuilder } from "@/components/acl-builder";
import { MpsStructureCalc, PpiCalc } from "@/components/ppi-calc";
import { AccessSqlCalc, ErCalc, NormalizerCalc } from "@/components/db-calc";
import { GraphCalc } from "@/components/graph-calc";
import { KfsCalc } from "@/components/kfs-calc";
import { XYPlot } from "@/components/xy-plot";
import { DrawingView } from "@/components/drawing-view";
import { TimingDiagram } from "@/components/timing-diagram";
import { PhasorDiagram } from "@/components/phasor-diagram";
import { LightCalc } from "@/components/oop-calc";
import { Lab1Calc, Lab2Calc, Lab3Calc, MagnetCalc, RgrCalc } from "@/components/circuits-calc";
import { ApproxCalc, CauchyCalc, IterationCalc, RootsCalc, SlaeCalc } from "@/components/amo-calc";
import { Ethernet10Calc, FastEthernetCalc } from "@/components/lan-calc";
import { ModuleHeader } from "@/components/module-header";
import { RegSchemeView } from "@/components/reg-scheme";
import { FlowChartView } from "@/components/flow-chart";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { categories, modules } from "@/lib/modules";
import { guideBySlug } from "@/lib/data/guides";
import type { GuideCode, GuideTable } from "@/lib/data/guides/types";

function Table({ table }: { table: GuideTable }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">{table.title}</h3>
      <div className="overflow-x-auto rounded-[4px] border border-border">
        <table className="w-full font-mono text-sm">
          <thead className="border-b border-border text-xs text-ink-faint">
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="px-3 py-2 text-left align-bottom font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-dim">
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className={`px-3 py-1.5 align-top${table.nowrap ? " whitespace-nowrap" : ""}`}>
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

function codeBlocks(code: GuideCode[] | undefined) {
  return code?.map((c) => (
    <div key={c.title} className="space-y-1.5">
      <OutputBlock label={c.title} value={c.code} wrap={false} />
      {c.note && <p className="text-xs text-ink-faint">{c.note}</p>}
    </div>
  ));
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
  const [extra, setExtra] = useState<Record<string, string>>(() => Object.fromEntries((g.variant?.params ?? []).map((p) => [p.key, String(p.value)])));

  const computed = useMemo(() => {
    if (!g.variant) return g.computed ? { data: g.computed() } : null;
    const v = Number(raw);
    if (!Number.isInteger(v) || v < g.variant.min || v > g.variant.max) {
      return { error: `Номер — целое число от ${g.variant.min} до ${g.variant.max}` };
    }
    const defs = g.variant.params ?? [];
    const params = Object.fromEntries(defs.map((p) => [p.key, Number(extra[p.key])]));
    const bad = defs.find((p) => !Number.isInteger(params[p.key]) || params[p.key] < p.min || params[p.key] > p.max);
    if (bad) return { error: `${bad.label} — целое число от ${bad.min} до ${bad.max}` };
    try {
      return { data: g.variant.compute(v, params) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [g, raw, extra]);

  // номер варианта для калькуляторов, которые от него зависят (тема БД)
  const vNum = Number(raw);
  const topic = g.variant && Number.isInteger(vNum) && vNum >= g.variant.min && vNum <= g.variant.max ? vNum : undefined;

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
      {g.widget === "graph" && <GraphCalc accent={accent} />}
      {g.widget === "c-lab1" && <Lab1Calc />}
      {g.widget === "c-lab2" && <Lab2Calc />}
      {g.widget === "c-lab3" && <Lab3Calc />}
      {g.widget === "c-magnet" && <MagnetCalc />}
      {g.widget === "c-rgr" && <RgrCalc />}
      {g.widget === "oop-light" && <LightCalc />}
      {g.widget === "ppi" && <PpiCalc />}
      {g.widget === "mps-kr" && <MpsStructureCalc />}
      {g.widget === "kfs-l1" && <KfsCalc lab={1} accent={accent} />}
      {g.widget === "kfs-l2" && <KfsCalc lab={2} accent={accent} />}
      {g.widget === "kfs-l3" && <KfsCalc lab={3} accent={accent} />}
      {g.widget === "kfs-l4" && <KfsCalc lab={4} accent={accent} />}
      {g.widget === "kfs-l5" && <KfsCalc lab={5} accent={accent} />}
      {g.widget === "kfs-l6" && <KfsCalc lab={6} accent={accent} />}
      {g.widget === "kfs-l7" && <KfsCalc lab={7} accent={accent} />}
      {g.widget === "db-l3" && <AccessSqlCalc key={topic} lab={3} topic={topic} />}
      {g.widget === "db-l4" && <AccessSqlCalc key={topic} lab={4} topic={topic} />}
      {g.widget === "db-l5" && <AccessSqlCalc key={topic} lab={5} topic={topic} />}
      {g.widget === "db-l6" && <AccessSqlCalc key={topic} lab={6} topic={topic} />}
      {g.widget === "db-norm" && (
        <>
          <NormalizerCalc />
          <ErCalc />
        </>
      )}
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
                  {g.variant.params && (
                    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[repeat(auto-fill,12rem)]">
                      {g.variant.params.map((p) => (
                        <NumberField
                          key={p.key}
                          label={p.label}
                          value={extra[p.key] ?? ""}
                          min={p.min}
                          max={p.max}
                          onChange={(e) => setExtra((x) => ({ ...x, [p.key]: e.target.value }))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {"error" in computed ? (
                <p className="text-sm text-codes">{computed.error}</p>
              ) : (
                <>
                  {computed.data.codeFirst && computed.data.tables?.slice(0, 1).map((t) => <Table key={t.title} table={t} />)}
                  {computed.data.codeFirst && codeBlocks(computed.data.code)}
                  {(computed.data.codeFirst ? computed.data.tables?.slice(1) : computed.data.tables)?.map((t) => <Table key={t.title} table={t} />)}
                  {computed.data.figures?.map((f) => (
                    <div key={f.title} className="space-y-1.5">
                      {f.kind === "regs" && <RegSchemeView scheme={f.scheme} title={f.title} />}
                      {f.kind === "flow" && <FlowChartView chart={f.chart} title={f.title} />}
                      {f.kind === "plot" && <XYPlot fig={f.plot} title={f.title} />}
                      {f.kind === "phasor" && <PhasorDiagram fig={f.phasor} title={f.title} />}
                      {f.kind === "drawing" && <DrawingView drawing={f.drawing} title={f.title} />}
                      {f.kind === "timing" && <TimingDiagram fig={f.timing} title={f.title} />}
                      {f.note && <p className="text-xs text-ink-faint">{f.note}</p>}
                    </div>
                  ))}
                  {!computed.data.codeFirst && codeBlocks(computed.data.code)}
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
