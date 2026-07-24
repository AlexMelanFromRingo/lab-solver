"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB2_VARIANTS } from "@/lib/data/variant-tables";
import { buildReport, encodeSequence, type SymbolProb } from "@/lib/algorithms/entropy-coding";

const mod = modules.find((m) => m.slug === "entropy-coding")!;
const accent = categories.theory.accent;
const SYMS = ["z1", "z2", "z3", "z4", "z5"];

function CodeTableView({ title, codes, items }: { title: string; codes: Record<string, string>; items: SymbolProb[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-ink-dim mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border text-ink-faint text-xs uppercase">
              <th className="text-left px-3 py-2">Символ</th>
              <th className="text-left px-3 py-2">p</th>
              <th className="text-left px-3 py-2">Код</th>
              <th className="text-left px-3 py-2">Длина</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.symbol} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5 text-ink">{s.symbol}</td>
                <td className="px-3 py-1.5 text-ink-dim">{s.p}</td>
                <td className="px-3 py-1.5 text-theory">{codes[s.symbol]}</td>
                <td className="px-3 py-1.5 text-ink-faint">{codes[s.symbol]?.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EntropyCodingPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = LAB2_VARIANTS.find((v) => v.variant === variantNum)!;

  const items: SymbolProb[] = useMemo(
    () => SYMS.map((s, i) => ({ symbol: s, p: variant.probs[i] })),
    [variant]
  );
  const report = useMemo(() => buildReport(items), [items]);
  const sfEncoded = useMemo(() => encodeSequence(variant.sequence, report.shannonFanoCodes), [variant, report]);
  const hfEncoded = useMemo(() => encodeSequence(variant.sequence, report.huffmanCodes), [variant, report]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Энтропия <code>H = −Σ pᵢ·log2(pᵢ)</code> — теоретический минимум среднего числа бит на
          символ. Шеннон-Фано делит символы (отсортированные по убыванию вероятности) пополам по
          накопленной вероятности рекурсивно; Хаффман строит дерево снизу вверх, каждый раз объединяя
          два наименее вероятных символа. Оба кода префиксные (ни один код не является началом другого),
          поэтому декодируются однозначно посимвольно.
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={12} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <span key={s.symbol} className="rounded-full border border-border px-3 py-1.5 text-sm font-mono text-ink-dim">
                  {s.symbol} = {s.p}
                </span>
              ))}
            </div>
            <OutputBlock label="Тестовая последовательность" value={variant.sequence.join(" ")} />
            <OutputBlock label="Энтропия источника H" value={report.H.toFixed(4) + " бит/символ"} />
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">Шеннон-Фано</h2>
              <CodeTableView title="Коды" codes={report.shannonFanoCodes} items={items} />
              <OutputBlock label="Средняя длина" value={report.shannonFanoAvgLength.toFixed(4) + " бит"} />
              <OutputBlock label="Избыточность (L − H)" value={report.shannonFanoRedundancy.toFixed(4)} />
              <OutputBlock label="Закодированная последовательность" value={sfEncoded} />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">Хаффман</h2>
              <CodeTableView title="Коды" codes={report.huffmanCodes} items={items} />
              <OutputBlock label="Средняя длина" value={report.huffmanAvgLength.toFixed(4) + " бит"} />
              <OutputBlock label="Избыточность (L − H)" value={report.huffmanRedundancy.toFixed(4)} />
              <OutputBlock label="Закодированная последовательность" value={hfEncoded} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
