"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { luhnCheck, luhnComputeCheckDigit } from "@/lib/algorithms/luhn";

const mod = modules.find((m) => m.slug === "luhn")!;

export default function LuhnPage() {
  const [number, setNumber] = useState("4111 1111 1111 1111");
  const [partial, setPartial] = useState("4111 1111 1111 111");

  const result = useMemo(() => {
    try {
      return { ok: true as const, data: luhnCheck(number) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [number]);

  const computed = useMemo(() => {
    try {
      return { ok: true as const, digit: luhnComputeCheckDigit(partial) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [partial]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Каждая цифра, считая <strong>справа налево</strong>, стоящая на нечётной позиции, удваивается;
          если результат больше 9 — из него вычитается 9. Сумма всех цифр должна делиться на 10 без остатка.
          Формула используется для проверки номеров банковских карт, IMEI и других идентификаторов.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <TextField
              label="Номер для проверки"
              hint="цифры, пробелы разрешены"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            {result.ok ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {result.data.steps.map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 min-w-[3rem]"
                    >
                      <span className="text-[10px] text-ink-faint">{s.original}{s.doubled ? "×2" : ""}</span>
                      <span className="font-mono text-sm text-ink">{s.afterCorrection}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <OutputBlock label="Сумма" value={String(result.data.total)} className="flex-1 min-w-[10rem]" />
                  <div
                    className={
                      "rounded-xl border px-5 py-3 text-sm font-medium " +
                      (result.data.isValid
                        ? "border-theory/30 bg-theory-soft text-theory"
                        : "border-codes/30 bg-codes-soft text-codes")
                    }
                  >
                    {result.data.isValid ? "Номер корректен" : "Номер не проходит проверку"}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-codes">{result.error}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Довычислить контрольную цифру</h2>
            <TextField
              label="Номер без последней (контрольной) цифры"
              value={partial}
              onChange={(e) => setPartial(e.target.value)}
            />
            {computed.ok ? (
              <OutputBlock label="Недостающая цифра" value={String(computed.digit)} />
            ) : (
              <p className="text-sm text-codes">{computed.error}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
