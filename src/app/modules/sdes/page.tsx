"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { bitsToString, encryptByte, decryptByte, type RoundTrace } from "@/lib/algorithms/sdes";
import { CopyButton } from "@/components/ui/copy-button";

const mod = modules.find((m) => m.slug === "sdes")!;

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2 border-b border-border/60 last:border-0 font-mono text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function RoundLines({ r, n }: { r: RoundTrace; n: 1 | 2 }) {
  return (
    <>
      <Line label={`E/P (раунд ${n})`} value={bitsToString(r.ep)} />
      <Line label={`SUM (раунд ${n})`} value={bitsToString(r.sum)} />
      <Line label={`S0, S1 (раунд ${n})`} value={`${bitsToString(r.s0Out)}, ${bitsToString(r.s1Out)}`} />
      <Line label={`Результат после P4 (раунд ${n})`} value={bitsToString(r.p4Out)} />
      <Line label={`Li, Ri (раунд ${n})`} value={`${bitsToString(r.li)}, ${bitsToString(r.ri)}`} />
    </>
  );
}

function parseBits(s: string, width: number): number | null {
  const clean = s.trim();
  if (!new RegExp(`^[01]{${width}}$`).test(clean)) return null;
  return parseInt(clean, 2);
}

export default function SdesPage() {
  // Значения по умолчанию — буквально те же списки битов, что в Optimized3.py:
  // key = [0,1,0,0,0,0,0,1,0,1], data = [1,0,0,0,0,1,0,0]
  const [byteStr, setByteStr] = useState("10000100");
  const [keyStr, setKeyStr] = useState("0100000101");

  const byte = parseBits(byteStr, 8);
  const key = parseBits(keyStr, 10);

  const enc = useMemo(() => {
    if (byte === null || key === null) return { ok: false as const, error: "Блок — ровно 8 бит (0/1), ключ — ровно 10 бит (0/1)" };
    try {
      return { ok: true as const, data: encryptByte(byte, key) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [byte, key]);

  const dec = useMemo(() => {
    if (!enc.ok || key === null) return null;
    try {
      return decryptByte(enc.data.output.reduce((a, b) => (a << 1) | b, 0), key);
    } catch {
      return null;
    }
  }, [enc, key]);

  const fullTrace = enc.ok
    ? [
        { label: "P10", value: bitsToString(enc.data.keys.p10) },
        { label: "Left Shifted (1)", value: bitsToString(enc.data.keys.shifted1) },
        { label: "P8 (K1)", value: bitsToString(enc.data.keys.k1) },
        { label: "Double left shifted key", value: bitsToString(enc.data.keys.shifted3) },
        { label: "P8 of double left shifted key (K2)", value: bitsToString(enc.data.keys.k2) },
        { label: "IP of data", value: bitsToString(enc.data.ip) },
      ]
    : [];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <InfoNote>
          Один-в-один портировано с реального решателя (<code>Optimized3.py</code>), который
          использовался для сдачи лабы — тот же порядок шагов, те же названия и те же S-box
          (они чуть отличаются от общеучебных S-box из большинства учебников — здесь взяты
          ровно те, что были в рабочем решателе, а не «исправленный» вариант). Вывод идёт в том
          порядке, в котором его нужно было вносить в программу проверки: P10 → сдвиг → K1 →
          двойной сдвиг → K2 → IP → раунд 1 (E/P, SUM, S-box, P4, Li/Ri) → SW → раунд 2 → IP⁻¹.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Блок (8 бит)" hint="как data в скрипте" value={byteStr} onChange={(e) => setByteStr(e.target.value)} />
              <TextField label="Ключ (10 бит)" hint="как key в скрипте" value={keyStr} onChange={(e) => setKeyStr(e.target.value)} />
            </div>

            {enc.ok ? (
              <div className="rounded-xl border border-border bg-black/30 overflow-hidden">
                {fullTrace.map((l) => (
                  <Line key={l.label} label={l.label} value={l.value} />
                ))}
                <RoundLines r={enc.data.round1} n={1} />
                <Line label="SW" value={bitsToString(enc.data.swapped)} />
                <RoundLines r={enc.data.round2} n={2} />
                <div className="flex items-baseline justify-between gap-4 px-4 py-3 bg-crypto-soft font-mono text-sm">
                  <span className="text-crypto font-medium">Зашифрованные данные</span>
                  <span className="flex items-center gap-2 text-crypto">
                    {bitsToString(enc.data.output)}
                    <CopyButton value={bitsToString(enc.data.output)} />
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-codes">{enc.error}</p>
            )}

            {dec && byte !== null && (
              <p className="text-xs text-ink-faint">
                Проверка расшифрования (раунды в порядке K2 → K1): {bitsToString(dec.output)}
                {dec.output.reduce((a, b) => (a << 1) | b, 0) === byte ? " — совпадает с исходным блоком ✓" : ""}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
