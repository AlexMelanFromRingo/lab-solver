"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { solveThreeCongruences, type Congruence } from "@/lib/algorithms/crt";

const mod = modules.find((m) => m.slug === "crt")!;

interface Row {
  a: string;
  b: string;
  m: string;
}

const DEFAULTS: Row[] = [
  { a: "2", b: "1", m: "3" },
  { a: "3", b: "2", m: "5" },
  { a: "1", b: "3", m: "7" },
];

export default function CrtPage() {
  const [rows, setRows] = useState<Row[]>(DEFAULTS);

  const result = useMemo(() => {
    try {
      const eqs = rows.map((r) => ({ a: BigInt(r.a), b: BigInt(r.b), m: BigInt(r.m) })) as [
        Congruence,
        Congruence,
        Congruence
      ];
      if (eqs.some((e) => e.m <= 0n)) throw new Error("Модуль должен быть положительным");
      return { ok: true as const, data: solveThreeCongruences(eqs) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [rows]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <InfoNote>
          Портировано с решателя курсовой (<code>ChineseWithExplain.py</code>) один в один: те же
          три шага, та же формула, те же пояснения в том же порядке. Система — ровно три сравнения
          вида <code>a·x ≡ b (mod m)</code> (курсовая была именно на три уравнения), модули
          предполагаются попарно взаимно простыми — как и в исходном решателе.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-end gap-3 flex-wrap">
                <NumberField
                  label={`a${i + 1}`}
                  value={row.a}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], a: e.target.value };
                    setRows(next);
                  }}
                  className="w-20"
                />
                <span className="pb-2.5 text-ink-faint font-mono text-sm">x ≡</span>
                <NumberField
                  label={`b${i + 1}`}
                  value={row.b}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], b: e.target.value };
                    setRows(next);
                  }}
                  className="w-20"
                />
                <span className="pb-2.5 text-ink-faint font-mono text-sm">(mod</span>
                <NumberField
                  label={`m${i + 1}`}
                  value={row.m}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], m: e.target.value };
                    setRows(next);
                  }}
                  className="w-20"
                />
                <span className="pb-2.5 text-ink-faint font-mono text-sm">)</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {result.ok ? (
          <>
            <Card>
              <CardBody className="pt-6">
                <div className="space-y-1 font-mono text-sm">
                  {result.data.steps.map((s, i) =>
                    s === "**********" ? (
                      <div key={i} className="text-ink-faint py-1">
                        ──────────
                      </div>
                    ) : (
                      <p key={i} className="text-ink-dim leading-relaxed">
                        {s}
                      </p>
                    )
                  )}
                </div>
              </CardBody>
            </Card>
            {result.data.solvable && (
              <OutputBlock label="Итоговый ответ" value={`x ≡ ${result.data.answer} (mod ${result.data.M})`} />
            )}
          </>
        ) : (
          <p className="text-sm text-codes">{result.error}</p>
        )}
      </div>
    </div>
  );
}
