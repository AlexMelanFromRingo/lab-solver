"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock, StepList } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { rsDecodeAndCorrect, rsEncode } from "@/lib/algorithms/reed-solomon";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "reed-solomon")!;

export default function ReedSolomonPage() {
  const [text, setText] = useState("Hello!");
  const [nsym, setNsym] = useState(4);
  const [errorPositions, setErrorPositions] = useState<Set<number>>(new Set());

  const maxErrors = Math.floor(nsym / 2);
  const messageBytes = useMemo(() => Array.from(text).map((c) => c.charCodeAt(0) & 0xff), [text]);
  const encoded = useMemo(() => {
    if (messageBytes.length === 0) return [];
    try {
      return rsEncode(messageBytes, nsym);
    } catch {
      return [];
    }
  }, [messageBytes, nsym]);

  const received = useMemo(() => {
    const out = [...encoded];
    errorPositions.forEach((p) => {
      if (p < out.length) out[p] = (out[p] ^ 0xff) & 0xff;
    });
    return out;
  }, [encoded, errorPositions]);

  const result = useMemo(() => (received.length ? rsDecodeAndCorrect(received, nsym) : null), [received, nsym]);
  const decoded = result?.success ? result.corrected.slice(0, messageBytes.length).map((b) => String.fromCharCode(b)).join("") : "";

  function toggleError(pos: number) {
    const next = new Set(errorPositions);
    if (next.has(pos)) next.delete(pos);
    else if (next.size < maxErrors) next.add(pos);
    setErrorPositions(next);
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Работает над полем Галуа GF(2⁸) (примитивный многочлен x⁸+x⁴+x³+x²+1). Кодирование —
          систематическое (данные не меняются, к ним дописываются nsym проверочных байт). При
          ненулевых синдромах ищется полином-локатор ошибок (алгоритм Берлекэмпа-Мэсси), его корни
          (поиск Ченя) дают позиции ошибок, а величины — алгоритм Форни. Код исправляет до nsym/2
          ошибок.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Сообщение"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setErrorPositions(new Set());
                }}
              />
              <NumberField
                label="nsym (проверочных байт)"
                value={nsym}
                onChange={(e) => {
                  setNsym(Number(e.target.value));
                  setErrorPositions(new Set());
                }}
                min={2}
                max={16}
              />
            </div>
            <p className="text-xs text-ink-faint">Максимум исправимых ошибок: {maxErrors}. Кликните по байту ниже, чтобы испортить его.</p>

            <div className="flex flex-wrap gap-1.5">
              {encoded.map((_, i) => (
                <button
                  key={i}
                  onClick={() => toggleError(i)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border px-2.5 py-1.5 min-w-[3.2rem] font-mono text-xs transition-colors",
                    errorPositions.has(i) ? "border-codes bg-codes-soft text-codes" : "border-border bg-surface-2 text-ink hover:border-border-strong",
                    i >= messageBytes.length && "opacity-70"
                  )}
                >
                  <span className="text-[9px] text-ink-faint">{i < messageBytes.length ? "data" : "ecc"}</span>
                  {received[i]?.toString(16).padStart(2, "0").toUpperCase()}
                </button>
              ))}
            </div>

            {result && (
              <>
                <div
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm font-medium",
                    result.success ? "border-theory/30 bg-theory-soft text-theory" : "border-codes/30 bg-codes-soft text-codes"
                  )}
                >
                  {result.message}
                </div>
                <Card>
                  <CardBody className="pt-4">
                    <StepList steps={result.steps.map((s) => `${s.title}: ${s.description}${s.data ? " — " + s.data : ""}`)} />
                  </CardBody>
                </Card>
                {result.success && <OutputBlock label="Восстановленное сообщение" value={decoded} />}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
