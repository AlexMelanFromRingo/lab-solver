"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { computeSyndrome, correct, encode, injectError, isPowerOfTwo } from "@/lib/algorithms/hamming";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "hamming")!;

function BitCell({
  value,
  label,
  active,
  error,
  onClick,
}: {
  value: number;
  label: string;
  active?: boolean;
  error?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 min-w-[3rem] transition-colors",
        error ? "border-codes bg-codes-soft" : active ? "border-codes/60 bg-codes-soft/50" : "border-border bg-surface-2",
        onClick && "cursor-pointer hover:border-border-strong"
      )}
    >
      <span className="text-[10px] text-ink-faint font-mono">{label}</span>
      <span className="font-mono text-base text-ink">{value}</span>
    </button>
  );
}

export default function HammingPage() {
  const [data, setData] = useState([1, 0, 1, 1]);
  const [extended, setExtended] = useState(false);
  const [errorPos, setErrorPos] = useState<number | null>(2);

  const encoded = useMemo(() => encode(data, extended), [data, extended]);
  const received = useMemo(() => injectError(encoded.codeword, errorPos), [encoded, errorPos]);
  const syndrome = useMemo(() => computeSyndrome(received, extended), [received, extended]);
  const result = useMemo(() => correct(received, extended), [received, extended]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Биты в степенях двойки (1,2,4,…) — контрольные, остальные — информационные. Каждый
          контрольный бит проверяет чётность своей группы позиций (двоичное представление номера
          позиции содержит его разряд). Синдром — это номер позиции ошибки: если он ненулевой,
          там и произошла инверсия. Расширенный вариант (8,4) добавляет общий бит чётности —
          он отличает одну ошибку (исправима) от двух (только детектируется).
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display text-lg font-semibold text-ink">Информационные биты</h2>
              <label className="flex items-center gap-2 text-sm text-ink-dim">
                <input
                  type="checkbox"
                  checked={extended}
                  onChange={(e) => setExtended(e.target.checked)}
                  className="accent-codes"
                />
                Расширенный код (8,4) SEC-DED
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {data.map((b, i) => (
                <BitCell
                  key={i}
                  value={b}
                  label={`d${i + 1}`}
                  onClick={() => {
                    const next = [...data];
                    next[i] ^= 1;
                    setData(next);
                    setErrorPos(null);
                  }}
                />
              ))}
            </div>

            <h2 className="font-display text-lg font-semibold text-ink pt-2">Закодированное слово</h2>
            <div className="flex gap-2 flex-wrap">
              {encoded.codeword.map((b, i) => {
                const pos = extended ? i : i + 1;
                const isParity = extended ? pos === 0 || isPowerOfTwo(pos) : isPowerOfTwo(pos);
                return (
                  <BitCell
                    key={i}
                    value={b}
                    label={isParity ? `p${pos}` : "d"}
                    active={isParity}
                    error={errorPos === i}
                    onClick={() => setErrorPos(errorPos === i ? null : i)}
                  />
                );
              })}
            </div>
            <p className="text-xs text-ink-faint">Кликните по биту принятого слова ниже, чтобы внести ошибку — синдром пересчитается автоматически.</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Принятое слово (с ошибкой)</h2>
            <div className="flex gap-2 flex-wrap">
              {received.map((b, i) => (
                <BitCell key={i} value={b} label={`r${i}`} error={errorPos === i} />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-lg border border-border bg-black/30 px-4 py-3">
                <div className="text-xs text-ink-faint mb-1">s1</div>
                <div className="font-mono text-ink">{syndrome.s1}</div>
              </div>
              <div className="rounded-lg border border-border bg-black/30 px-4 py-3">
                <div className="text-xs text-ink-faint mb-1">s2</div>
                <div className="font-mono text-ink">{syndrome.s2}</div>
              </div>
              <div className="rounded-lg border border-border bg-black/30 px-4 py-3">
                <div className="text-xs text-ink-faint mb-1">s4</div>
                <div className="font-mono text-ink">{syndrome.s4}</div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-xl border px-5 py-3 text-sm font-medium",
                result.errorAt === -1
                  ? "border-theory/30 bg-theory-soft text-theory"
                  : "border-codes/30 bg-codes-soft text-codes"
              )}
            >
              Синдром = {syndrome.value} — {result.message}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
