"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB5_VARIANTS } from "@/lib/data/variant-tables";
import { bitsToString, checkAndCorrect, encode, flipBits, generatorBits, hexToBits } from "@/lib/algorithms/crc";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "crc")!;
const accent = categories.theory.accent;

export default function CrcPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = LAB5_VARIANTS.find((v) => v.variant === variantNum)!;

  const [inputChoice, setInputChoice] = useState<"nibble" | "byte">("byte");
  const data = useMemo(
    () => (inputChoice === "nibble" ? hexToBits(variant.nibbleHex, 4) : hexToBits(variant.byteHex, 8)),
    [variant, inputChoice]
  );
  const gen = useMemo(() => generatorBits(variant.generatorPoly), [variant]);

  const encoded = useMemo(() => encode(data, gen), [data, gen]);
  const [errPos, setErrPos] = useState<number[]>([]);
  const received = useMemo(() => flipBits(encoded.codeword, errPos), [encoded, errPos]);
  const check = useMemo(() => checkAndCorrect(received, gen), [received, gen]);

  function toggleBit(i: number) {
    setErrPos((prev) => (prev.includes(i) ? prev.filter((p) => p !== i) : [...prev, i]));
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Кодирование: к данным дописываются r=3 нулевых бита, результат делится на образующий
          многочлен g(x) по модулю 2 — остаток и есть проверочные биты (CRC). Приём: делится всё
          кодовое слово; нулевой остаток — ошибок нет; ненулевой — по таблице «синдром → позиция»
          ищется однократная ошибка (метод надёжен, пока длина слова не превышает 2ʳ−1=7; для
          8-битного варианта при некоторых синдромах возможна лишь детекция без коррекции — это
          отмечено ниже).
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={12} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <SelectField label="Данные варианта" value={inputChoice} onChange={(e) => setInputChoice(e.target.value as "nibble" | "byte")}>
                <option value="nibble">Ниббл: {variant.nibbleHex}</option>
                <option value="byte">Байт: {variant.byteHex}</option>
              </SelectField>
              <span className="text-sm text-ink-faint font-mono pt-5">g(x) = {variant.generatorPoly} = {bitsToString(gen)}</span>
            </div>

            <OutputBlock label="Кодовое слово (данные + CRC)" value={bitsToString(encoded.codeword)} />

            <div className="flex gap-1.5 flex-wrap">
              {received.map((b, i) => (
                <button
                  key={i}
                  onClick={() => toggleBit(i)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm transition-colors",
                    errPos.includes(i) ? "border-codes bg-codes-soft text-codes" : "border-border bg-surface-2 text-ink hover:border-border-strong",
                    i >= data.length && "opacity-70"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-faint">Кликните по биту, чтобы внести ошибку (можно несколько сразу).</p>

            <div
              className={cn(
                "rounded-xl border px-5 py-3 text-sm font-medium",
                check.status === "ok"
                  ? "border-theory/30 bg-theory-soft text-theory"
                  : check.status === "corrected"
                  ? "border-number/30 bg-number-soft text-number"
                  : "border-codes/30 bg-codes-soft text-codes"
              )}
            >
              Синдром = {bitsToString(check.syndrome)} —{" "}
              {check.status === "ok" && "ошибок нет"}
              {check.status === "corrected" && `ошибка в позиции ${check.errorPos} — исправлена`}
              {check.status === "uncorrectable" && "обнаружена ошибка, но однозначно исправить нельзя (коллизия синдромов)"}
            </div>
            {check.corrected && <OutputBlock label="Исправленное слово" value={bitsToString(check.corrected)} />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
