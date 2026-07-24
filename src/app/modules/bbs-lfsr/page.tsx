"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { bbsWorkedExample, generateBBS, generateLFSR } from "@/lib/algorithms/bbs-lfsr";

const mod = modules.find((m) => m.slug === "bbs-lfsr")!;
const example = bbsWorkedExample();

export default function BbsLfsrPage() {
  const [pStr, setPStr] = useState(example.p.toString());
  const [qStr, setQStr] = useState(example.q.toString());
  const [seedStr, setSeedStr] = useState(example.seed.toString());
  const [bitsCount, setBitsCount] = useState(20);

  const bbs = useMemo(() => {
    try {
      return { ok: true as const, data: generateBBS(BigInt(pStr), BigInt(qStr), BigInt(seedStr), bitsCount) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [pStr, qStr, seedStr, bitsCount]);

  const [lfsrState, setLfsrState] = useState("1,0,1,1,0");
  const [lfsrTaps, setLfsrTaps] = useState("0,2");
  const [lfsrSteps, setLfsrSteps] = useState(20);

  const lfsr = useMemo(() => {
    try {
      const state = lfsrState.split(",").map((s) => Number(s.trim()) & 1);
      const taps = lfsrTaps.split(",").map((s) => Number(s.trim()));
      if (taps.some((t) => t < 0 || t >= state.length)) throw new Error("Отвод вне диапазона регистра");
      return { ok: true as const, data: generateLFSR(state, taps, lfsrSteps) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [lfsrState, lfsrTaps, lfsrSteps]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          BBS: выбираются p, q ≡ 3 (mod 4), n=p·q, seed взаимно прост с n; X₀=seed² mod n, далее{" "}
          <code>Xᵢ=X²ᵢ₋₁ mod n</code>, выходной бит — младший бит Xᵢ. Поля по умолчанию заполнены
          проверочным примером из отчёта (LR5!BBS_LFSR.docx, таблица 2.1) — все 19 доступных
          в документе бит совпали с этим расчётом при сверке.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Blum-Blum-Shub</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <TextField label="p (≡3 mod 4)" value={pStr} onChange={(e) => setPStr(e.target.value)} />
              <TextField label="q (≡3 mod 4)" value={qStr} onChange={(e) => setQStr(e.target.value)} />
              <TextField label="seed" value={seedStr} onChange={(e) => setSeedStr(e.target.value)} />
              <NumberField label="Число бит" value={bitsCount} onChange={(e) => setBitsCount(Number(e.target.value))} min={1} max={64} />
            </div>
            {bbs.ok ? (
              <>
                <OutputBlock label="n = p·q" value={bbs.data.n.toString()} />
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-border text-ink-faint text-xs uppercase">
                        <th className="text-left px-3 py-2">i</th>
                        <th className="text-left px-3 py-2">Xᵢ</th>
                        <th className="text-left px-3 py-2">Bᵢ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bbs.data.steps.map((s) => (
                        <tr key={s.i} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-1.5 text-ink-faint">{s.i}</td>
                          <td className="px-3 py-1.5 text-ink-dim">{s.x.toString()}</td>
                          <td className="px-3 py-1.5 text-crypto">{s.bit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <OutputBlock label="Гамма (биты подряд)" value={bbs.data.keystream.join("")} />
              </>
            ) : (
              <p className="text-sm text-codes">{bbs.error}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">LFSR (регистр сдвига с линейной обратной связью)</h2>
            <p className="text-xs text-ink-faint">
              Отводы (taps) — индексы битов состояния, XOR которых становится новым левым битом;
              выход на каждом шаге — крайний правый (вытесняемый) бит.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Начальное состояние (через запятую)" value={lfsrState} onChange={(e) => setLfsrState(e.target.value)} />
              <TextField label="Отводы (индексы через запятую)" value={lfsrTaps} onChange={(e) => setLfsrTaps(e.target.value)} />
              <NumberField label="Число шагов" value={lfsrSteps} onChange={(e) => setLfsrSteps(Number(e.target.value))} min={1} max={64} />
            </div>
            {lfsr.ok ? (
              <OutputBlock label="Гамма" value={lfsr.data.keystream.join("")} />
            ) : (
              <p className="text-sm text-codes">{lfsr.error}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
