"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { extendedEuclidTrace, gcd, lcm, solveLinearCongruence } from "@/lib/algorithms/number-theory";

const mod = modules.find((m) => m.slug === "number-theory")!;

export default function NumberTheoryPage() {
  const [a1, setA1] = useState(1634);
  const [b1, setB1] = useState(104);
  const g = useMemo(() => gcd(a1, b1), [a1, b1]);
  const l = useMemo(() => lcm(a1, b1), [a1, b1]);
  const euclidTrace = useMemo(() => extendedEuclidTrace(a1, b1), [a1, b1]);

  const [a2, setA2] = useState(3);
  const [b2, setB2] = useState(1);
  const [n2, setN2] = useState(7);
  const congruence = useMemo(() => {
    try {
      return { ok: true as const, data: solveLinearCongruence(a2, b2, n2) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [a2, b2, n2]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Портировано с реального C++ кода из ваших отчётов по «Математичним основам
          інфобезпеки». Алгоритм Евклида — классическое последовательное деление с остатком
          (НСК = |a·b|/НСД). Линейное сравнение ax≡b(mod n): сначала НОД(a,n) проверяется через
          таблицу расширенного Евклида, затем обратный элемент α ищется <strong>перебором</strong>{" "}
          i=1..n−1 до (a·i) mod n = 1 — именно так это сделано в реальном коде (а не через
          коэффициент x расширенного Евклида, хотя он тоже считается и показан ниже).
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Алгоритм Евклида</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="a" value={a1} onChange={(e) => setA1(Number(e.target.value))} />
              <NumberField label="b" value={b1} onChange={(e) => setB1(Number(e.target.value))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="НСД(a, b)" value={String(g)} />
              <OutputBlock label="НСК(a, b) = |a·b| / НСД" value={String(l)} />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-border text-ink-faint text-xs uppercase">
                    <th className="text-left px-3 py-2">Залишки</th>
                    <th className="text-left px-3 py-2">Часткові</th>
                    <th className="text-left px-3 py-2">x</th>
                    <th className="text-left px-3 py-2">y</th>
                  </tr>
                </thead>
                <tbody>
                  {euclidTrace.steps.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-ink">{s.remainder}</td>
                      <td className="px-3 py-1.5 text-ink-faint">{s.quotient ?? "—"}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{s.x}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{s.y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Линейное сравнение ax ≡ b (mod n)</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="a" value={a2} onChange={(e) => setA2(Number(e.target.value))} />
              <NumberField label="b" value={b2} onChange={(e) => setB2(Number(e.target.value))} />
              <NumberField label="n" value={n2} onChange={(e) => setN2(Number(e.target.value))} />
            </div>

            {congruence.ok && congruence.data.solvable ? (
              <>
                <div className="rounded-xl border border-border bg-black/30 max-h-48 overflow-y-auto divide-y divide-border/50">
                  {congruence.data.searchSteps.map((s) => (
                    <div key={s.i} className="flex justify-between px-4 py-1.5 font-mono text-sm">
                      <span className="text-ink-faint">Итерация {s.i}</span>
                      <span className={s.value === 1 ? "text-crypto font-medium" : "text-ink-dim"}>
                        ({a2}·{s.i}) mod {n2} = {s.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <OutputBlock label="α (обратный элемент a mod n)" value={String(congruence.data.alpha)} />
                  <OutputBlock label="x = (α·b) mod n" value={String(congruence.data.x)} />
                </div>
              </>
            ) : (
              <p className="text-sm text-codes">НОД(a, n) ≠ 1 — сравнение неразрешимо (или нет единственного решения)</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
