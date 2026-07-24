"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import {
  computeChannels,
  encodePolar,
  frozenSetOf,
  generateG,
  infoIndicesOf,
  mlDecode,
  scDecode,
} from "@/lib/algorithms/polar";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "polar")!;
const N = 8;
const logN = 3;

export default function PolarPage() {
  const [K, setK] = useState(4);
  const [erasureProb, setErasureProb] = useState(0.5);
  const [infoBits, setInfoBits] = useState<number[]>([1, 0, 1, 1]);
  const [errorPositions, setErrorPositions] = useState<Set<number>>(new Set());

  const G = useMemo(() => generateG(logN), []);
  const channels = useMemo(() => computeChannels(N, K, erasureProb), [K, erasureProb]);
  const infoIdx = useMemo(() => infoIndicesOf(channels), [channels]);
  const frozen = useMemo(() => frozenSetOf(channels), [channels]);

  const encoded = useMemo(() => encodePolar(infoBits, channels, G, N), [infoBits, channels, G]);
  const received = useMemo(() => {
    const out = [...encoded];
    errorPositions.forEach((p) => {
      if (p < out.length) out[p] = 1 - out[p];
    });
    return out;
  }, [encoded, errorPositions]);

  const decodedSC = useMemo(() => scDecode(received, frozen, N), [received, frozen]);
  const decodedML = useMemo(() => mlDecode(received, infoIdx, G, N, K), [received, infoIdx, G, K]);

  const scInfo = infoIdx.map((i) => decodedSC[i]);
  const mlInfo = infoIdx.map((i) => decodedML[i]);
  const scOk = infoBits.every((b, i) => b === (scInfo[i] ?? 0));
  const mlOk = infoBits.every((b, i) => b === (mlInfo[i] ?? 0));

  function toggleInfoBit(i: number) {
    const next = [...infoBits];
    next[i] = 1 - next[i];
    setInfoBits(next);
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
          Матрица кодирования G = F<sup>⊗log₂N</sup>, F=[[1,0],[1,1]] (произведение Кронекера).
          Каждый из N каналов получает параметр Батачария (рекурсивно: плохой канал W⁻=2z−z²,
          хороший W⁺=z²) — K самых надёжных становятся информационными, остальные замораживаются
          (жёстко фиксируются в 0). Декодирование — либо последовательное вычёркивание (SC,
          рекурсивно по «бабочке»), либо полный перебор по всем 2^K вариантам (ML, точнее, но
          годится только для маленьких кодов).
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="K (информационных бит из N=8)"
                value={K}
                onChange={(e) => {
                  const k = Number(e.target.value);
                  setK(k);
                  setInfoBits(Array.from({ length: k }, (_, i) => infoBits[i] ?? 0));
                }}
                min={1}
                max={7}
              />
              <NumberField
                label="Вероятность стирания канала (BEC)"
                value={erasureProb}
                onChange={(e) => setErasureProb(Number(e.target.value))}
                min={0.01}
                max={0.99}
                step={0.01}
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-border text-ink-faint text-xs uppercase">
                    <th className="text-left px-3 py-2">Канал</th>
                    <th className="text-left px-3 py-2">Z (Батачария)</th>
                    <th className="text-left px-3 py-2">Тип</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((c) => (
                    <tr key={c.index} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-ink-faint">u{c.index}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{c.bhattacharyya.toFixed(4)}</td>
                      <td className={cn("px-3 py-1.5", c.type === "info" ? "text-crypto" : "text-ink-faint")}>
                        {c.type === "info" ? "информационный" : "заморожен"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-ink-faint">Информационные биты (кликните, чтобы переключить):</p>
            <div className="flex gap-1.5">
              {infoBits.map((b, i) => (
                <button
                  key={i}
                  onClick={() => toggleInfoBit(i)}
                  className="w-10 h-10 rounded-lg border border-border bg-surface-2 text-ink font-mono hover:border-border-strong transition-colors"
                >
                  {b}
                </button>
              ))}
            </div>

            <OutputBlock label="Кодовое слово x = u·G (mod 2)" value={encoded.join("")} />

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={cn("rounded-xl border px-4 py-3", scOk ? "border-theory/30 bg-theory-soft" : "border-codes/30 bg-codes-soft")}>
                <div className="text-xs uppercase text-ink-faint mb-1">SC-декодер</div>
                <div className={cn("font-mono text-sm", scOk ? "text-theory" : "text-codes")}>{scInfo.join("")} {scOk ? "✓" : "✗"}</div>
              </div>
              <div className={cn("rounded-xl border px-4 py-3", mlOk ? "border-theory/30 bg-theory-soft" : "border-codes/30 bg-codes-soft")}>
                <div className="text-xs uppercase text-ink-faint mb-1">ML-декодер</div>
                <div className={cn("font-mono text-sm", mlOk ? "text-theory" : "text-codes")}>{mlInfo.join("")} {mlOk ? "✓" : "✗"}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
