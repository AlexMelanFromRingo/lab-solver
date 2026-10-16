"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/components/lang";
import { errRange, tr, ui } from "@/lib/i18n";
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
import { BiometricsCalc } from "@/components/biometrics-calc";
import { Lab1Calc, Lab2Calc, Lab3Calc, MagnetCalc, RgrCalc } from "@/components/circuits-calc";
import { ApproxCalc, CauchyCalc, IterationCalc, QuadCalc, RootsCalc, SlaeCalc } from "@/components/amo-calc";
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
  const { lang } = useLang();
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">{tr(table.title, lang)}</h3>
      <div className="overflow-x-auto rounded-[4px] border border-border">
        <table className="w-full font-mono text-sm">
          <thead className="border-b border-border text-xs text-ink-faint">
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="px-3 py-2 text-left align-bottom font-normal">
                  {tr(c, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-dim">
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className={`px-3 py-1.5 align-top${table.nowrap ? " whitespace-nowrap" : ""}`}>
                    {typeof cell === "number" ? cell : tr(cell, lang)}
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

function CodeBlocks({ code }: { code: GuideCode[] | undefined }) {
  const { lang } = useLang();
  return (
    <>
      {code?.map((c, i) => (
        <div key={i} className="space-y-1.5">
          <OutputBlock label={tr(c.title, lang)} value={c.code} wrap={false} />
          {c.note && <p className="text-xs text-ink-faint">{tr(c.note, lang)}</p>}
        </div>
      ))}
    </>
  );
}

/**
 * Страница работы-инструкции: данные варианта, порядок по методичке, кадры,
 * состав отчёта и то, что должно получиться.
 */
export function GuideView({ slug }: { slug: string }) {
  const { lang } = useLang();
  const mod = modules.find((m) => m.slug === slug)!;
  const g = guideBySlug(slug)!;
  const accent = categories[mod.category].accent;
  const [raw, setRaw] = useState(String(Math.max(1, g.variant?.min ?? 1)));
  const [extra, setExtra] = useState<Record<string, string>>(() => Object.fromEntries((g.variant?.params ?? []).map((p) => [p.key, String(p.value)])));

  const computed = useMemo(() => {
    if (!g.variant) return g.computed ? { data: g.computed() } : null;
    const v = Number(raw);
    if (!Number.isInteger(v) || v < g.variant.min || v > g.variant.max) {
      return { error: errRange(lang === "uk" ? "Номер" : "Номер", g.variant.min, g.variant.max, lang) };
    }
    const defs = g.variant.params ?? [];
    const params = Object.fromEntries(defs.map((p) => [p.key, Number(extra[p.key])]));
    const bad = defs.find((p) => !Number.isInteger(params[p.key]) || params[p.key] < p.min || params[p.key] > p.max);
    if (bad) return { error: errRange(tr(bad.label, lang), bad.min, bad.max, lang) };
    try {
      return { data: g.variant.compute(v, params) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [g, raw, extra, lang]);

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
      {g.widget === "quad" && <QuadCalc />}
      {g.widget === "graph" && <GraphCalc accent={accent} />}
      {g.widget === "c-lab1" && <Lab1Calc />}
      {g.widget === "c-lab2" && <Lab2Calc />}
      {g.widget === "c-lab3" && <Lab3Calc />}
      {g.widget === "c-magnet" && <MagnetCalc />}
      {g.widget === "c-rgr" && <RgrCalc />}
      {g.widget === "oop-light" && <LightCalc />}
      {g.widget === "ppi" && <PpiCalc />}
      {g.widget === "biometrics" && <BiometricsCalc />}
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
        <InfoNote>{tr(g.intro, lang)}</InfoNote>

        {!g.variant && widget}

        {computed && (
          <Card>
            <CardBody className="space-y-6 pt-6">
              {g.variant && (
                <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
                  <NumberField
                    label={`Номер ${tr(g.variant.label, lang)}`}
                    value={raw}
                    min={g.variant.min}
                    max={g.variant.max}
                    onChange={(e) => setRaw(e.target.value)}
                  />
                  <p className="text-sm leading-relaxed text-ink-faint">{tr(g.variant.hint, lang)}</p>
                  {g.variant.params && (
                    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[repeat(auto-fill,12rem)]">
                      {g.variant.params.map((p) => (
                        <NumberField
                          key={p.key}
                          label={tr(p.label, lang)}
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
                  {computed.data.codeFirst && computed.data.tables?.slice(0, 1).map((t, ti) => <Table key={ti} table={t} />)}
                  {computed.data.codeFirst && <CodeBlocks code={computed.data.code} />}
                  {(computed.data.codeFirst ? computed.data.tables?.slice(1) : computed.data.tables)?.map((t, ti) => <Table key={ti} table={t} />)}
                  {computed.data.figures?.map((f, fi) => (
                    <div key={fi} className="space-y-1.5">
                      {f.kind === "regs" && <RegSchemeView scheme={f.scheme} title={tr(f.title, lang)} />}
                      {f.kind === "flow" && <FlowChartView chart={f.chart} title={tr(f.title, lang)} />}
                      {f.kind === "plot" && <XYPlot fig={f.plot} title={tr(f.title, lang)} />}
                      {f.kind === "phasor" && <PhasorDiagram fig={f.phasor} title={tr(f.title, lang)} />}
                      {f.kind === "drawing" && <DrawingView drawing={f.drawing} title={tr(f.title, lang)} />}
                      {f.kind === "timing" && <TimingDiagram fig={f.timing} title={tr(f.title, lang)} />}
                      {f.note && <p className="text-xs text-ink-faint">{tr(f.note, lang)}</p>}
                    </div>
                  ))}
                  {!computed.data.codeFirst && <CodeBlocks code={computed.data.code} />}
                  {computed.data.notes?.map((n, ni) => (
                    <p key={ni} className="text-sm leading-relaxed text-ink-dim">
                      {tr(n, lang)}
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
              <h2 className="font-display text-lg font-semibold text-ink">{ui("errata", lang)}</h2>
              <ul className="space-y-2.5">
                {g.errata.map((e, ei) => (
                  <li key={ei} className="flex gap-2 text-sm leading-relaxed text-ink-dim">
                    <span style={{ color: accent }}>·</span>
                    <span>{tr(e, lang)}</span>
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
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{ui("result", lang)}</h2>
              {g.findings.map((f, fi) => (
                <div key={fi}>
                  <h3 className="text-sm font-medium text-ink">{tr(f.title, lang)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-dim">{tr(f.body, lang)}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
