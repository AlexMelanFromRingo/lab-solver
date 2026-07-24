"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { DEFAULT_H, beliefPropagation, channelLLR, computeGenerator, ldpcEncode, syndromeOf } from "@/lib/algorithms/ldpc";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "ldpc")!;

export default function LdpcPage() {
  const h = DEFAULT_H;
  const n = h[0].length;
  const m = h.length;
  const k = n - m;

  const [dataBits, setDataBits] = useState<number[]>([0, 0, 0, 0]);
  const [flipProb, setFlipProb] = useState(0.15);
  const [errorPositions, setErrorPositions] = useState<Set<number>>(new Set());

  const { G } = useMemo(() => computeGenerator(h), [h]);
  const codeword = useMemo(() => ldpcEncode(dataBits, G, n), [dataBits, G, n]);
  const codewordSyndrome = useMemo(() => syndromeOf(h, codeword), [h, codeword]);

  const received = useMemo(() => {
    const out = [...codeword];
    errorPositions.forEach((p) => {
      if (p < out.length) out[p] = 1 - out[p];
    });
    return out;
  }, [codeword, errorPositions]);

  const llr = useMemo(() => channelLLR(received, flipProb), [received, flipProb]);
  const iterations = useMemo(() => beliefPropagation(h, llr, 50), [h, llr]);
  const last = iterations[iterations.length - 1];
  const decoded = last?.decoded ?? received;
  const converged = last?.syndromeOk ?? false;
  const correct = decoded.every((v, i) => v === codeword[i]);

  function toggleData(i: number) {
    const next = [...dataBits];
    next[i] = 1 - next[i];
    setDataBits(next);
  }
  function toggleError(pos: number) {
    const next = new Set(errorPositions);
    if (next.has(pos)) next.delete(pos);
    else next.add(pos);
    setErrorPositions(next);
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Демонстрационная разреженная проверочная матрица H (код [8,4,3]: 8 переменных узлов,
          4 проверочных, вес столбцов 2-3, вес строк 5). Порождающая матрица G получена из H
          исключением Гаусса над GF(2) (H·Gᵀ=0). Декодирование — итеративный belief propagation
          (min-sum приближение): проверочные узлы обмениваются сообщениями с переменными, пока
          синдром не станет нулевым или не кончится лимит итераций.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Проверочная матрица H ({m}×{n})</h2>
            <div className="inline-block rounded-xl border border-border overflow-hidden font-mono text-sm">
              {h.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((v, j) => (
                    <div key={j} className={cn("w-9 h-9 flex items-center justify-center border-b border-r border-border last:border-r-0", v ? "text-theory" : "text-ink-faint")}>
                      {v}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <p className="text-xs text-ink-faint">Информационные биты ({k}), кликните, чтобы переключить:</p>
            <div className="flex gap-1.5">
              {dataBits.map((b, i) => (
                <button key={i} onClick={() => toggleData(i)} className="w-10 h-10 rounded-lg border border-border bg-surface-2 text-ink font-mono hover:border-border-strong transition-colors">
                  {b}
                </button>
              ))}
            </div>

            <OutputBlock label="Кодовое слово" value={codeword.join("")} />
            <OutputBlock label="Синдром H·cᵀ (должен быть нулевым)" value={codewordSyndrome.join("")} />

            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <NumberField label="Вероятность ошибки канала (для LLR)" value={flipProb} onChange={(e) => setFlipProb(Number(e.target.value))} min={0.01} max={0.49} step={0.01} />
            </div>

            <p className="text-xs text-ink-faint">Принятое слово (кликните по биту, чтобы внести ошибку):</p>
            <div className="flex gap-1.5">
              {received.map((b, i) => (
                <button
                  key={i}
                  onClick={() => toggleError(i)}
                  className={cn(
                    "w-10 h-10 rounded-lg border font-mono transition-colors",
                    errorPositions.has(i) ? "border-codes bg-codes-soft text-codes" : "border-border bg-surface-2 text-ink"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "rounded-xl border px-5 py-3 text-sm font-medium",
                converged && correct ? "border-theory/30 bg-theory-soft text-theory" : "border-codes/30 bg-codes-soft text-codes"
              )}
            >
              {iterations.length} итераций belief propagation — синдром {converged ? "нулевой" : "не сошёлся"},{" "}
              {correct ? "исходное слово восстановлено ✓" : "результат отличается от исходного слова"}
            </div>
            <OutputBlock label="Декодированное слово" value={decoded.join("")} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
