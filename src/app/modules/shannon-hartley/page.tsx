"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB6_VARIANTS } from "@/lib/data/variant-tables";
import { buildChannelReport } from "@/lib/algorithms/shannon-hartley";

const mod = modules.find((m) => m.slug === "shannon-hartley")!;
const accent = categories.theory.accent;

export default function ShannonHartleyPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = LAB6_VARIANTS.find((v) => v.variant === variantNum)!;

  const reportMin = useMemo(
    () => buildChannelReport(variant.powerMw, variant.noisePe1, variant.noisePe2, variant.bandwidthMin),
    [variant]
  );
  const reportMax = useMemo(
    () => buildChannelReport(variant.powerMw, variant.noisePe1, variant.noisePe2, variant.bandwidthMax),
    [variant]
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Формула подтверждена численно по реальному отчёту (Лаба 6, «Сливець КБ2211 926
          Лабораторна 6.DOCX» + инструмент расчёта в той же папке — совпадение с точностью до
          3-4 значащих цифр на двух независимых строках примера): <code>S/N = Px/(pe·Δf)</code>{" "}
          (числа берутся как есть — мВт, мкВт/Гц, МГц, без перевода в СИ, именно так считает
          инструмент курса), далее <code>Iс = log2(1+S/N)</code> бит/сигнал и{" "}
          <code>C = Δf·Iс</code> Мбит/с. pe1/pe2 — два уровня плотности шума из варианта,
          считаются отдельно, как и в отчёте.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={12} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">Px = {variant.powerMw} мВт</span>
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">pe1 = {variant.noisePe1} мкВт/Гц</span>
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">pe2 = {variant.noisePe2} мкВт/Гц</span>
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">Δfmin = {variant.bandwidthMin} МГц</span>
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">dfk = {variant.bandwidthMax} МГц</span>
              <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">Imin = {variant.imin} бит/сигн, Cmin = {variant.cmin} Мбіт/с</span>
              <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">{variant.modulation1} / {variant.modulation2}, доп. ошибка {variant.targetErrorProb}</span>
            </div>

            {[
              { label: `Δf = Δfmin = ${variant.bandwidthMin} МГц`, r: reportMin },
              { label: `Δf = dfk = ${variant.bandwidthMax} МГц`, r: reportMax },
            ].map(({ label, r }) => (
              <div key={label} className="space-y-3">
                <h3 className="text-sm font-medium text-ink-dim">{label}</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-border text-ink-faint text-xs uppercase">
                        <th className="text-left px-3 py-2">pe</th>
                        <th className="text-left px-3 py-2">X = 1+S/N</th>
                        <th className="text-left px-3 py-2">Iс, бит/сигн</th>
                        <th className="text-left px-3 py-2">C, Мбит/с</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="px-3 py-2 text-ink">pe1 = {variant.noisePe1}</td>
                        <td className="px-3 py-2 text-ink-dim">{r.pe1.snrPlusOne.toFixed(3)}</td>
                        <td className="px-3 py-2 text-ink-dim">{r.pe1.bitsPerSignal.toFixed(3)}</td>
                        <td className="px-3 py-2 text-theory">{r.pe1.capacityMbitPerSec.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-ink">pe2 = {variant.noisePe2}</td>
                        <td className="px-3 py-2 text-ink-dim">{r.pe2.snrPlusOne.toFixed(3)}</td>
                        <td className="px-3 py-2 text-ink-dim">{r.pe2.bitsPerSignal.toFixed(3)}</td>
                        <td className="px-3 py-2 text-theory">{r.pe2.capacityMbitPerSec.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <OutputBlock
              label="Сравнение с целевым Cmin"
              value={`Cmin из варианта = ${variant.cmin} Мбіт/с — сравните с посчитанными C выше при интересующей вас полосе и pe`}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
