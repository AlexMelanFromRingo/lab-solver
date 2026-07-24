"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB7_VARIANTS } from "@/lib/data/variant-tables";
import { encodeLine, parseBitString, LINE_CODE_VERIFIED, type LineCode, type LineSample } from "@/lib/algorithms/line-coding";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "line-coding")!;
const accent = categories.theory.accent;

function Waveform({ samples, color }: { samples: LineSample[]; color: string }) {
  const w = 24;
  const h = 60;
  const levels = samples.map((s) => s.level);
  const maxAbs = Math.max(1, ...levels.map((l) => Math.abs(l)));
  const y = (level: number) => h / 2 - (level / maxAbs) * (h / 2 - 6);

  let d = "";
  samples.forEach((s, i) => {
    const x0 = i * w;
    const x1 = x0 + w;
    const yy = y(s.level);
    d += i === 0 ? `M ${x0} ${yy} ` : `L ${x0} ${yy} `;
    d += `L ${x1} ${yy} `;
  });

  return (
    <svg width={samples.length * w} height={h} className="min-w-full">
      <line x1={0} y1={h / 2} x2={samples.length * w} y2={h / 2} stroke="currentColor" strokeOpacity={0.15} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export default function LineCodingPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = LAB7_VARIANTS.find((v) => v.variant === variantNum)!;
  const wiredCodes = variant.wiredCodes.split(",").map((c) => c.trim()) as LineCode[];

  const bits = useMemo(() => parseBitString(variant.dataBits), [variant]);
  const encodings = useMemo(() => wiredCodes.map((code) => ({ code, samples: encodeLine(bits, code) })), [wiredCodes, bits]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          NRZ/RZ/Манчестер/NRZI/MLT-3 — однозначные стандартные схемы кодирования, здесь
          воспроизведены по общепринятому определению. Для B2Q1 и PAM5 (обе — многоуровневые,
          пара бит на символ) для этой лабы не нашлось отчёта с проверочным числовым примером —
          использовано стандартное учебное отображение, но <strong>сверьте с методичкой</strong>,
          прежде чем сдавать: они помечены жёлтым.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={12} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-6">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">Данные: {variant.dataBits}</span>
              <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">Ethernet: {variant.ethernetStandard}</span>
              <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">Wi-Fi: {variant.wifiStandard}, переходов: {variant.hops}</span>
            </div>

            {encodings.map(({ code, samples }) => {
              const verified = LINE_CODE_VERIFIED[code];
              return (
                <div key={code} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-ink">{code}</h3>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        verified ? "border-theory/30 bg-theory-soft text-theory" : "border-number/30 bg-number-soft text-number"
                      )}
                    >
                      {verified ? "стандартная схема" : "не сверено с отчётом"}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border bg-black/30 p-3 text-arch">
                    <Waveform samples={samples} color="currentColor" />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
