"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { type PrimalityMethod, runPrimalityTest } from "@/lib/algorithms/primality";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import { useLang } from "@/components/lang";
import { tr, type Loc } from "@/lib/i18n";

const mod = modules.find((m) => m.slug === "primality")!;

const METHOD_LABELS: Record<PrimalityMethod, Loc> = {
  trial: { uk: "Пробне ділення (детермінований)", ru: "Пробное деление (детерминированный)" },
  fermat: { uk: "Тест Ферма (ймовірнісний)", ru: "Тест Ферма (вероятностный)" },
  "miller-rabin": { uk: "Міллер–Рабін (ймовірнісний)", ru: "Миллер–Рабин (вероятностный)" },
  "solovay-strassen": { uk: "Соловей–Штрассен (ймовірнісний)", ru: "Соловей–Штрассен (вероятностный)" },
};

export default function PrimalityPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [nStr, setNStr] = useState("104729");
  const [method, setMethod] = useState<PrimalityMethod>("miller-rabin");
  const [rounds, setRounds] = useState(20);
  const mounted = useMounted();

  const result = useMemo(() => {
    try {
      const n = BigInt(nStr);
      return { ok: true as const, data: runPrimalityTest(n, method, rounds) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [nStr, method, rounds]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? (<>Курсова з прикладної криптології вимагала реалізувати тест простоти самостійно — він використовується при генерації простих p, q для RSA (модуль «RSA» використовує Міллера-Рабіна всередині свого пошуку простих). Пробне ділення дає точну відповідь, але повільно зростає з n; три ймовірнісні тести помиляються з експоненційно малою ймовірністю, що залежить від числа раундів.</>) : (<>Курсовая по прикладной криптологии требовала реализовать тест простоты самостоятельно — он используется при генерации простых p, q для RSA (модуль «RSA» использует Миллера-Рабина внутри своего поиска простых). Пробное деление даёт точный ответ, но медленно растёт с n; три вероятностных теста ошибаются с экспоненциально малой вероятностью, зависящей от числа раундов.</>)}
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Число n" value={nStr} onChange={(e) => setNStr(e.target.value)} />
              <SelectField label="Метод" value={method} onChange={(e) => setMethod(e.target.value as PrimalityMethod)}>
                {Object.entries(METHOD_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {tr(label as Loc, lang)}
                  </option>
                ))}
              </SelectField>
              {method !== "trial" && (
                <NumberField label={tx("Раундів","Раундов")} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} min={1} max={100} />
              )}
            </div>

            {!mounted ? (
              <div className="h-24 rounded-[4px] border border-border bg-black/20 animate-pulse" />
            ) : result.ok ? (
              <>
                <div
                  className={cn(
                    "rounded-[4px] border px-5 py-3 text-sm font-medium",
                    result.data.isPrime ? "border-theory/30 bg-theory-soft text-theory" : "border-codes/30 bg-codes-soft text-codes"
                  )}
                >
                  {result.data.isPrime ? tx("Імовірно просте","Вероятно простое") : tx("Складене","Составное")}
                  {result.data.isPrime && !result.data.certain && tx(" (ймовірнісний тест)"," (вероятностный тест)")}
                </div>
                <div className="rounded-[4px] border border-border bg-black/30 divide-y divide-border">
                  {result.data.steps.map((s, i) => (
                    <div key={i} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="text-xs font-medium text-ink-dim min-w-[10rem]">{s.label}</span>
                      <span className="text-sm font-mono text-ink break-all">{s.detail}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-codes">{result.error}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
