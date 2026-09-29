"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB7_VARIANTS } from "@/lib/data/variant-tables";
import { BARKER11, FIVE_B_CONTROL, barkerAcf, cck, chipText, encode4b5b, encodeLine, lineCodeFromName, parseBitString, piText, scramble, LINE_CODE_VERIFIED, type LineSample } from "@/lib/algorithms/line-coding";
import { OutputBlock } from "@/components/ui/output-block";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "line-coding")!;
const accent = categories.tik.accent;

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
  const bits = useMemo(() => parseBitString(variant.dataBits), [variant]);
  // название — как в таблице вариантов («Манчестер»), код — для расчёта
  const encodings = useMemo(
    () =>
      variant.wiredCodes.split(",").map((name) => {
        const code = lineCodeFromName(name);
        return { name: name.trim(), code, samples: encodeLine(bits, code) };
      }),
    [variant, bits],
  );

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

            {encodings.map(({ name, code, samples }) => {
              const verified = LINE_CODE_VERIFIED[code];
              return (
                <div key={code} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-ink">{name}</h3>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        verified ? "border-theory/30 bg-theory-soft text-theory" : "border-number/30 bg-number-soft text-number"
                      )}
                    >
                      {verified ? "стандартная схема" : "не сверено с отчётом"}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-[4px] border border-border bg-black/30 p-3 text-arch">
                    <Waveform samples={samples} color="currentColor" />
                  </div>
                </div>
              );
            })}
                    </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">4B/5B, скремблювання, код Баркера</h2>
            <OutputBlock
              label="П. 2.3 — логічне кодування 4B/5B і кадр"
              value={[
                ...encode4b5b(bits).map((x) => `${x.nibble} → ${x.code}`),
                "",
                `кадр: I ${FIVE_B_CONTROL.I} | J K ${FIVE_B_CONTROL.J} ${FIVE_B_CONTROL.K} | дані ${encode4b5b(bits).map((x) => x.code).join(" ")} | T R ${FIVE_B_CONTROL.T} ${FIVE_B_CONTROL.R} | I ${FIVE_B_CONTROL.I}`,
              ].join("\n")}
              wrap={false}
            />
            <OutputBlock
              label="П. 2.4 — скремблер bᵢ = aᵢ ⊕ bᵢ₋₃ ⊕ bᵢ₋₅ і відновлення cᵢ = bᵢ ⊕ bᵢ₋₃ ⊕ bᵢ₋₅"
              value={(() => {
                const r = scramble(bits);
                return [`a: ${bits.join(" ")}`, `b: ${r.b.join(" ")}`, `c: ${r.c.join(" ")}  ${r.c.join("") === bits.join("") ? "(= a ✓)" : ""}`].join("\n");
              })()}
              wrap={false}
            />
            <OutputBlock
              label={`П. 3.2 — автокореляція коду Баркера: «свій» (зсув 0) і «чужий» (циклічний зсув ${variant.hops})`}
              value={[
                `послідовність: ${BARKER11.map((x) => (x > 0 ? "+1" : "−1")).join(" ")}`,
                `R(0) = ${barkerAcf(0)} — «свій» сигнал`,
                `R(${variant.hops}) = ${barkerAcf(variant.hops)} — «чужий» сигнал`,
                `усі зсуви 1…10: ${Array.from({ length: 10 }, (_, k) => barkerAcf(k + 1)).join(", ")}`,
              ].join("\n")}
              wrap={false}
            />
            {[11, 5.5].map((rate) => {
              const syms = cck(bits, rate as 11 | 5.5);
              return (
                <OutputBlock
                  key={rate}
                  label={`П. 3.4 — CCK, ${String(rate).replace(".", ",")} Мбіт/с: фази й чіпи c0…c7 (дані варіанту по ${rate === 11 ? 8 : 4} біти)`}
                  value={syms
                    .map(
                      (y, k) =>
                        `Символ ${k + 1} (${k % 2 ? "непарний" : "парний"}), d = ${y.bits}\n` +
                        `  Δφ1 = ${piText(y.dphi1)}  φ1 = ${piText(y.phi[0])}  φ2 = ${piText(y.phi[1])}  φ3 = ${piText(y.phi[2])}  φ4 = ${piText(y.phi[3])}\n` +
                        `  фази чипів: ${y.chips.map(piText).join("  ")}\n` +
                        `  чипи c0…c7: ${y.chips.map(chipText).join("  ")}`,
                    )
                    .join("\n\n")}
                  wrap={false}
                />
              );
            })}
            <p className="text-sm text-ink-dim">
              Схема відновлення в методичці записана як «cᵢ = cᵢ + cᵢ₋₃ + cᵢ₋₅» — насправді дескремблер бере біти прийнятого потоку b:
              cᵢ = bᵢ ⊕ bᵢ₋₃ ⊕ bᵢ₋₅; тоді cᵢ = aᵢ. Біти до початку потоку вважаються нулями.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
