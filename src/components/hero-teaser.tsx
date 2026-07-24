"use client";

import { useMemo, useState } from "react";
import { VariantDial } from "@/components/ui/variant-dial";
import { F1_NAMES, F23_NAMES, bitsToHex, encryptBlock, getVariant } from "@/lib/algorithms/feistel-variant";

const SAMPLE_KEY = 0b1010110011000101n;
const SAMPLE_BLOCK = 0b1100110011001100n;

export function HeroTeaser() {
  const [variantNum, setVariantNum] = useState(1);
  const spec = getVariant(variantNum);

  const enc = useMemo(() => {
    const key = SAMPLE_KEY & ((1n << BigInt(spec.k)) - 1n);
    const block = SAMPLE_BLOCK & ((1n << BigInt(spec.n)) - 1n);
    return encryptBlock(block, spec, key, Math.max(4, Math.ceil(spec.k / (spec.n / 2))));
  }, [spec]);

  return (
    <div className="rounded-2xl border border-border-strong bg-surface/70 backdrop-blur-xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Живой пример — сеть Фейстеля</p>
          <p className="text-sm text-ink-dim">
            n={spec.n}, K={spec.k} · F1: {F1_NAMES[spec.f1]}
          </p>
        </div>
        <VariantDial value={variantNum} min={1} max={24} onChange={setVariantNum} accent="var(--cat-crypto)" />
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="rounded-lg border border-border bg-black/30 px-3 py-2.5">
          <div className="text-[10px] text-ink-faint uppercase mb-1">Блок (hex)</div>
          <div className="text-ink">{bitsToHex(SAMPLE_BLOCK & ((1n << BigInt(spec.n)) - 1n), spec.n)}</div>
        </div>
        <div className="rounded-lg border border-crypto/30 bg-crypto-soft px-3 py-2.5">
          <div className="text-[10px] text-crypto uppercase mb-1">Шифротекст (hex)</div>
          <div className="text-crypto">{bitsToHex(enc.output, spec.n)}</div>
        </div>
      </div>
      <p className="text-xs text-ink-faint">
        F2: {F23_NAMES[spec.f2.id]}({spec.f2.param}) → F3: {F23_NAMES[spec.f3.id]}({spec.f3.param}) — меняя номер варианта,
        вы меняете саму конструкцию раунда, не только ключ.
      </p>
    </div>
  );
}
