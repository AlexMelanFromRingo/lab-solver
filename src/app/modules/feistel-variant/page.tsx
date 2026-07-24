"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { CodeBlock } from "@/components/ui/code-block";
import { categories, modules } from "@/lib/modules";
import { generateFeistelCpp } from "@/lib/codegen/feistel-cpp";
import {
  F1_NAMES,
  F23_NAMES,
  VARIANTS,
  bitsToHex,
  decryptBlock,
  defaultRounds,
  encryptBlock,
  encryptText,
  decryptTextFromHex,
  getVariant,
} from "@/lib/algorithms/feistel-variant";

const mod = modules.find((m) => m.slug === "feistel-variant")!;
const accent = categories.crypto.accent;

function toBig(v: string): bigint {
  const t = v.trim();
  if (t === "") return 0n;
  if (/^0x/i.test(t)) return BigInt(t);
  if (/^[01]+$/.test(t) && t.length > 3) return BigInt("0b" + t);
  return BigInt(t);
}

export default function FeistelVariantPage() {
  const [variantNum, setVariantNum] = useState(19);
  const spec = getVariant(variantNum);
  const halfWidth = spec.n / 2;

  const [roundsStr, setRoundsStr] = useState(String(defaultRounds(spec)));
  const rounds = Math.max(1, Math.min(32, parseInt(roundsStr, 10) || defaultRounds(spec)));

  const [keyStr, setKeyStr] = useState("101010101010101");
  const [blockStr, setBlockStr] = useState("1100110011001100".slice(0, spec.n));
  const [text, setText] = useState("Привет!");

  const key = useMemo(() => {
    try {
      return toBig(keyStr) & ((1n << BigInt(spec.k)) - 1n);
    } catch {
      return 0n;
    }
  }, [keyStr, spec.k]);

  const block = useMemo(() => {
    try {
      return toBig(blockStr) & ((1n << BigInt(spec.n)) - 1n);
    } catch {
      return 0n;
    }
  }, [blockStr, spec.n]);

  const enc = useMemo(() => encryptBlock(block, spec, key, rounds), [block, spec, key, rounds]);
  const dec = useMemo(() => decryptBlock(enc.output, spec, key, rounds), [enc, spec, key, rounds]);

  const textEnc = useMemo(() => {
    try {
      return encryptText(text, spec, key, rounds);
    } catch {
      return { hex: "", padded: 0 };
    }
  }, [text, spec, key, rounds]);
  const textDec = useMemo(() => {
    try {
      return decryptTextFromHex(textEnc.hex, spec, key, rounds, textEnc.padded);
    } catch {
      return "";
    }
  }, [textEnc, spec, key, rounds]);

  const cppCode = useMemo(
    () => generateFeistelCpp(spec, key.toString(2).padStart(spec.k, "0")),
    [spec, key]
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Каждый вариант из методички задаёт три вещи: размер блока <code>n</code>, размер ключа{" "}
          <code>K</code> и тройку функций раунда F1 → F2 → F3. Раунд устроен так:{" "}
          <code>t = F3(F2(F1(R, roundKey)))</code>, затем <code>R&apos; = L ⊕ t</code>, <code>L&apos; = R</code>.
          При n=16 полу-блоки занимают 8 бит, а не 4 — поэтому S-box (F-функция №6), рассчитанный на
          4-битный вход в методичке, здесь применяется <strong>по ниблам</strong>: полу-блок режется на
          4-битные куски, каждый подставляется отдельно. Раундовые ключи — куски ключа по{" "}
          {halfWidth} бит, используются циклически.
        </InfoNote>

        <div className="flex flex-wrap items-center gap-4">
          <VariantDial value={variantNum} min={1} max={24} onChange={setVariantNum} accent={accent} />
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">n = {spec.n}</span>
            <span className="rounded-full border border-border px-3 py-1.5 font-mono text-ink-dim">K = {spec.k}</span>
            <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">F1: {F1_NAMES[spec.f1]}</span>
            <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">
              F2: {F23_NAMES[spec.f2.id]} ({spec.f2.param})
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 text-ink-dim">
              F3: {F23_NAMES[spec.f3.id]} ({spec.f3.param})
            </span>
          </div>
        </div>
        {spec.note && (
          <p className="text-xs text-number bg-number-soft border border-number/20 rounded-lg px-4 py-2">{spec.note}</p>
        )}

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Ключ" hint={`до ${spec.k} бит, dec/0x.../бинарно`} value={keyStr} onChange={(e) => setKeyStr(e.target.value)} />
              <TextField label="Блок" hint={`${spec.n} бит`} value={blockStr} onChange={(e) => setBlockStr(e.target.value)} />
              <NumberField label="Раундов" hint={`по умолчанию K/(n/2)=${defaultRounds(spec)}`} value={roundsStr} onChange={(e) => setRoundsStr(e.target.value)} min={1} max={32} />
            </div>
            <p className="text-xs text-ink-faint">
              Число раундов не зафиксировано методичкой одинаково для всех реализаций — в разных
              отчётах встречаются и K/(n/2), и константа 4. Меняйте под свой отчёт.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="Ключ (hex)" value={bitsToHex(key, spec.k)} />
              <OutputBlock label="Блок (hex)" value={bitsToHex(block, spec.n)} />
              <OutputBlock label="Шифротекст блока (hex)" value={bitsToHex(enc.output, spec.n)} />
              <OutputBlock
                label="Проверка расшифрования"
                value={bitsToHex(dec.output, spec.n) === bitsToHex(block, spec.n) ? "совпадает с исходным блоком ✓" : bitsToHex(dec.output, spec.n)}
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-border text-ink-faint text-xs uppercase">
                    <th className="text-left px-3 py-2">Раунд</th>
                    <th className="text-left px-3 py-2">Ключ</th>
                    <th className="text-left px-3 py-2">L</th>
                    <th className="text-left px-3 py-2">R</th>
                    <th className="text-left px-3 py-2">после F1</th>
                    <th className="text-left px-3 py-2">после F2</th>
                    <th className="text-left px-3 py-2">после F3</th>
                  </tr>
                </thead>
                <tbody>
                  {enc.trace.map((r) => (
                    <tr key={r.round} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-ink-faint">{r.round}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{bitsToHex(r.roundKey, halfWidth)}</td>
                      <td className="px-3 py-1.5 text-ink">{bitsToHex(r.lIn, halfWidth)}</td>
                      <td className="px-3 py-1.5 text-ink">{bitsToHex(r.rIn, halfWidth)}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{bitsToHex(r.afterF1, halfWidth)}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{bitsToHex(r.afterF2, halfWidth)}</td>
                      <td className="px-3 py-1.5 text-crypto">{bitsToHex(r.afterF3, halfWidth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Произвольный текст</h2>
            <p className="text-xs text-ink-faint">
              UTF-8 байты режутся на блоки по {spec.n / 8} байт, последний блок дополняется нулями
              (учтено при расшифровании).
            </p>
            <TextField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
            <OutputBlock label="Шифротекст (hex)" value={textEnc.hex} />
            <OutputBlock label="Проверка расшифрования" value={textDec} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Готовая программа (C++)</h2>
            <p className="text-xs text-ink-faint">
              Не просто ответ, а компилируемая программа под этот вариант: шифрует/дешифрует
              блок и целый файл (положите <code>input.txt</code> рядом с бинарником). Использует
              текущий ключ сверху. Сгенерированный код скомпилирован и сверен с расчётами этой
              страницы на нескольких вариантах — совпадает побитово.
            </p>
            <CodeBlock code={cppCode} filename={`feistel_variant_${variantNum}.cpp`} />
          </CardBody>
        </Card>

        <details className="text-sm text-ink-faint">
          <summary className="cursor-pointer text-ink-dim hover:text-ink">Все 24 варианта таблицы</summary>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-ink-faint uppercase">
                  <th className="text-left px-3 py-2">№</th>
                  <th className="text-left px-3 py-2">n</th>
                  <th className="text-left px-3 py-2">K</th>
                  <th className="text-left px-3 py-2">F1</th>
                  <th className="text-left px-3 py-2">F2</th>
                  <th className="text-left px-3 py-2">F3</th>
                </tr>
              </thead>
              <tbody>
                {VARIANTS.map((v) => (
                  <tr key={v.variant} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-1.5 text-ink-faint">{v.variant}</td>
                    <td className="px-3 py-1.5 text-ink">{v.n}</td>
                    <td className="px-3 py-1.5 text-ink">{v.k}</td>
                    <td className="px-3 py-1.5 text-ink-dim">{v.f1}</td>
                    <td className="px-3 py-1.5 text-ink-dim">{v.f2.id}({v.f2.param})</td>
                    <td className="px-3 py-1.5 text-ink-dim">{v.f3.id}({v.f3.param})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
