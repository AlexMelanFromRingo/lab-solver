"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { TextAreaField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { XYPlot } from "@/components/xy-plot";
import { useMounted } from "@/lib/use-mounted";
import { accuracy, atThreshold, fingerprintMatch, parseDistances, parseMinutiae } from "@/lib/algorithms/biometrics";

function run<T>(fn: () => T): { ok: true; v: T } | { ok: false; error: string } {
  try {
    return { ok: true, v: fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const pct = (v: number) => `${(v * 100).toFixed(1)} %`;

/** ЛР «точність біометрії»: FAR/FRR/EER/ROC за відстанями своїх і чужих + оцінка збігу відбитків (K). */
export function BiometricsCalc() {
  const mounted = useMounted();
  const [gen, setGen] = useState("12 18 15 22 9 17 26 20 11 24");
  const [imp, setImp] = useState("28 32 45 21 38 48 25 44 30 40");
  const [thr, setThr] = useState("23");
  const [ref, setRef] = useState("120 200 30\n160 180 90\n210 240 0\n90 310 135\n260 150 45\n140 260 60\n300 220 120");
  const [inp, setInp] = useState("122 203 32\n158 176 88\n212 238 5\n265 148 48\n140 262 58");
  const [posTol, setPosTol] = useState("12");
  const [angTol, setAngTol] = useState("15");

  const acc = run(() => {
    const g = parseDistances(gen);
    const i = parseDistances(imp);
    const a = accuracy(g, i);
    const t = Number(thr);
    return { a, at: atThreshold(g, i, t), t };
  });
  const fp = run(() => fingerprintMatch(parseMinutiae(ref), parseMinutiae(inp), Number(posTol), Number(angTol)));

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-5 pt-6">
          <h2 className="font-display text-lg font-semibold text-ink">Точність: FAR, FRR, ROC і EER</h2>
          <p className="text-sm text-ink-dim">
            Відстані між векторами відбитків: для своїх осіб (мають бути малі) і для чужих (великі). Приймаємо вхід при відстані ≤ порога суміщення t.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField label="Відстані «свій — свій» (через пробіл/кому)" value={gen} onChange={(e) => setGen(e.target.value)} className="min-h-[4.5rem]" />
            <TextAreaField label="Відстані «свій — чужий»" value={imp} onChange={(e) => setImp(e.target.value)} className="min-h-[4.5rem]" />
          </div>
          <TextField label="Поріг суміщення t" value={thr} onChange={(e) => setThr(e.target.value)} className="sm:max-w-[12rem]" />
          {acc.ok && mounted ? (
            <>
              <OutputBlock
                label={`У порозі t = ${acc.v.t}`}
                value={[
                  `FAR (чужого прийнято):   ${pct(acc.v.at.far)}`,
                  `FRR (свого відхилено):   ${pct(acc.v.at.frr)}`,
                  "",
                  `EER (рівна помилка):     ${pct(acc.v.a.eer.value)} при t ≈ ${acc.v.a.eer.t.toFixed(1)}`,
                ].join("\n")}
                wrap={false}
              />
              <XYPlot
                fig={{
                  x: { label: "поріг t", unit: "", zero: false },
                  y: { label: "помилка", unit: "", zero: true },
                  series: [
                    { label: "FAR", points: acc.v.a.grid.map((p) => [p.t, p.far] as [number, number]) },
                    { label: "FRR", points: acc.v.a.grid.map((p) => [p.t, p.frr] as [number, number]), dashed: true },
                  ],
                  hlines: [{ y: acc.v.a.eer.value, label: `EER ${pct(acc.v.a.eer.value)}` }],
                }}
                title="FAR і FRR від порога суміщення (перетин — EER)"
              />
              <XYPlot
                fig={{
                  x: { label: "FAR", unit: "", zero: true },
                  y: { label: "TAR = 1 − FRR", unit: "", zero: true },
                  series: [{ label: "ROC", points: acc.v.a.grid.map((p) => [p.far, 1 - p.frr] as [number, number]), markers: false }],
                }}
                title="Крива ROC"
              />
            </>
          ) : acc.ok ? null : (
            <p className="text-sm text-codes">{acc.error}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-5 pt-6">
          <h2 className="font-display text-lg font-semibold text-ink">Оцінка збігу відбитків (формула K)</h2>
          <p className="text-sm text-ink-dim">
            Вектори відбитків — по рядку «x y кут» на деталь. Деталь збігається в межах допусків за відстанню і орієнтацією. K = збіглих / усього · 100 %; за методичкою при K &gt; 65 % відбитки ідентичні.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField label="Еталонний відбиток (x y кут)" value={ref} onChange={(e) => setRef(e.target.value)} className="min-h-[9rem]" />
            <TextAreaField label="Введений відбиток (x y кут)" value={inp} onChange={(e) => setInp(e.target.value)} className="min-h-[9rem]" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-[24rem]">
            <TextField label="Допуск за відстанню" value={posTol} onChange={(e) => setPosTol(e.target.value)} />
            <TextField label="Допуск за кутом, °" value={angTol} onChange={(e) => setAngTol(e.target.value)} />
          </div>
          {fp.ok ? (
            <OutputBlock
              label="Результат"
              value={[
                `Збіглих деталей:        ${fp.v.matched.length}`,
                `Не збіглося (еталон):   ${fp.v.unmatchedRef.length}`,
                `Не збіглося (введений): ${fp.v.unmatchedInput.length}`,
                `Усього деталей:         ${fp.v.total}`,
                "",
                `K = ${fp.v.matched.length} / ${fp.v.total} · 100 % = ${fp.v.k.toFixed(1)} %`,
                fp.v.identical ? "K > 65 % → відбитки ідентичні (автентифікація успішна)" : "K ≤ 65 % → відбитки різні (у доступі відмовлено)",
              ].join("\n")}
              wrap={false}
            />
          ) : (
            <p className="text-sm text-codes">{fp.error}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
