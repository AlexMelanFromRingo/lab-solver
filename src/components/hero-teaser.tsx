"use client";

import { useMemo, useState } from "react";
import { VariantDial } from "@/components/ui/variant-dial";
import { F1_NAMES, F23_NAMES, bitsToHex, encryptBlock, getVariant } from "@/lib/algorithms/feistel-variant";

const SAMPLE_KEY = 0b1010110011000101n;
const SAMPLE_BLOCK = 0b1100110011001100n;

/**
 * Первый экран: не картинка продукта, а работающий прибор.
 *
 * Показания стоят столбцами с подписями снизу, как на приборной панели, и
 * меняются от номера варианта. Смысл именно в том, чтобы это увидели: номер
 * меняет не ключ, а саму конструкцию раунда.
 */

function Line({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <span className="text-[0.8125rem] text-ink-faint">{name}</span>
      <span className="font-mono text-[0.8125rem] text-ink-dim">{value}</span>
    </div>
  );
}

export function HeroTeaser() {
  const [variantNum, setVariantNum] = useState(1);
  const spec = getVariant(variantNum);

  const enc = useMemo(() => {
    const key = SAMPLE_KEY & ((1n << BigInt(spec.k)) - 1n);
    const block = SAMPLE_BLOCK & ((1n << BigInt(spec.n)) - 1n);
    return encryptBlock(block, spec, key, Math.max(4, Math.ceil(spec.k / (spec.n / 2))));
  }, [spec]);

  const block = bitsToHex(SAMPLE_BLOCK & ((1n << BigInt(spec.n)) - 1n), spec.n);
  const cipher = bitsToHex(enc.output, spec.n);

  return (
    <div className="border border-border bg-surface/70 p-5" style={{ borderRadius: 4 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[26ch] text-sm leading-snug text-ink-dim">
          Номер варианта меняет не ключ, а саму конструкцию раунда.
        </p>
        <VariantDial value={variantNum} min={1} max={24} onChange={setVariantNum} accent="var(--cat-crypto)" />
      </div>

      <div
        className="mt-5 flex items-end gap-6 border-t pt-5"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0">
          <div className="font-mono text-2xl leading-none text-ink">{block}</div>
          <div className="mt-1.5 text-[0.6875rem] text-ink-faint">блок, hex</div>
        </div>
        <div className="pb-1 text-ink-faint">→</div>
        <div className="min-w-0">
          <div className="font-mono text-2xl leading-none text-crypto">{cipher}</div>
          <div className="mt-1.5 text-[0.6875rem] text-ink-faint">шифротекст, hex</div>
        </div>
      </div>

      <div className="mt-5">
        <Line name="размер блока и ключа" value={`n = ${spec.n}, K = ${spec.k}`} />
        <Line name="функция F1" value={F1_NAMES[spec.f1]} />
        <Line
          name="функции F2 и F3"
          value={`${F23_NAMES[spec.f2.id]}(${spec.f2.param}) · ${F23_NAMES[spec.f3.id]}(${spec.f3.param})`}
        />
      </div>
    </div>
  );
}
