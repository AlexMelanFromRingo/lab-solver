"use client";

import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { run, type VarSnapshot } from "@/lib/algorithms/jolsm";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "jolsm")!;

const EXAMPLES: Record<string, string> = {
  "Сложение двух регистров": `var rg1(16), rg2(16), sm(17)
read rg1, rg2
sm = rg1
sm + rg2
print sm
end "готово"`,
  "Переполнение при сложении (15 бит, оригинальный пример лабы 1)": `var rg1(16), rg2(16), sm(16), rgs(15)
read rg1(14:0), rg2(14:0)
rg1(15)=rg1(14)
rg2(15)=rg2(14)
if rg1(14)=1 then rg1(13:0)~
if rg2(14)=1 then rg2(13:0)~
sm+rg1
sm+!rg2
if sm(15)=1 then sm(13:0)~
if sm(15)!=sm(14) then print "переповнення"
if sm(15)=sm(14) then print sm
rgs=sm(14:0)
end`,
  "Цикл: сумма ячеек памяти": `var acc(16), i(8), mem(8)(16)
read mem(0), mem(1), mem(2), mem(3)
acc = 0
i = 0
метка: if i = 4 goto конец
acc + mem(i)
i + 1
goto метка
конец: print acc
end "сумма посчитана"`,
};

function VarTable({ vars }: { vars: VarSnapshot[] }) {
  if (vars.length === 0) return <p className="text-sm text-ink-faint">Переменные ещё не объявлены.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border text-ink-faint text-xs uppercase">
            <th className="text-left px-3 py-2">Имя</th>
            <th className="text-left px-3 py-2">Разряд.</th>
            <th className="text-left px-3 py-2">Значение</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.name} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-1.5 text-ink">{v.name}</td>
              <td className="px-3 py-1.5 text-ink-faint">{v.width}</td>
              <td className="px-3 py-1.5 text-arch">
                {v.isMem ? `[${v.cells?.join(", ")}]` : `${v.value} = $${v.hex} = ${v.binary}b`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function JolsmPage() {
  const [code, setCode] = useState(EXAMPLES["Сложение двух регистров"]);
  const [inputsStr, setInputsStr] = useState("100, 27");
  const [stepIdx, setStepIdx] = useState(-1);

  const inputs = useMemo(
    () => inputsStr.split(",").map((s) => s.trim()).filter((s) => s !== ""),
    [inputsStr]
  );

  const result = useMemo(() => run(code, inputs), [code, inputs]);

  useEffect(() => {
    setStepIdx(result.trace.length - 1);
  }, [result]);

  const shownVars = stepIdx >= 0 && result.trace[stepIdx] ? result.trace[stepIdx].vars : result.final;

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <InfoNote>
          JOLS-M (ЯОЛС-М) — учебный язык микропрограмм: регистры и память заданной разрядности,
          одна микрокоманда на строку (READ/ОПЕРАЦИЯ/PRINT/GOTO/IF/END), поддерживаются битовые поля{" "}
          <code>рег(старший:младший)</code>, косвенная адресация и инверсия операнда через{" "}
          <code>~</code>. Ключевые слова понимаются на русском, украинском и английском — так же,
          как в референсной IDE. Интерпретатор выполняет программу целиком и запоминает состояние
          всех переменных после каждой команды — двигайте ползунок, чтобы увидеть их значения на
          любом шаге.
        </InfoNote>

        <div className="flex flex-wrap gap-2">
          {Object.keys(EXAMPLES).map((name) => (
            <button
              key={name}
              onClick={() => setCode(EXAMPLES[name])}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">Микропрограмма</h2>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-80 rounded-lg border border-border bg-black/30 px-4 py-3 font-mono text-sm text-ink resize-y focus:outline-none focus:border-border-strong"
              />
              <TextField
                label="Значения для read/ввести (по порядку, через запятую)"
                value={inputsStr}
                onChange={(e) => setInputsStr(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">Результат</h2>
              {!result.ok && (
                <div className="rounded-lg border border-codes/30 bg-codes-soft px-4 py-3 text-sm text-codes space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}
              {result.ended && (
                <div className="rounded-lg border border-theory/30 bg-theory-soft px-4 py-3 text-sm text-theory">
                  END: {result.ended || "(без сообщения)"}
                </div>
              )}
              {result.output.length > 0 && (
                <div className="rounded-lg border border-border bg-black/30 px-4 py-3 space-y-1">
                  {result.output.map((o, i) => (
                    <p key={i} className="font-mono text-xs text-ink break-all">
                      {o}
                    </p>
                  ))}
                </div>
              )}

              {result.trace.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-ink-faint">
                    <span>
                      Шаг {stepIdx + 1} / {result.trace.length}: строка {result.trace[stepIdx]?.line}
                    </span>
                    <span className="font-mono">{result.steps} шагов выполнено всего</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={result.trace.length - 1}
                    value={Math.max(0, stepIdx)}
                    onChange={(e) => setStepIdx(Number(e.target.value))}
                    className="w-full accent-arch"
                  />
                  <div className={cn("font-mono text-xs px-3 py-2 rounded-lg border border-border bg-black/20 text-ink-dim break-all")}>
                    {result.trace[stepIdx]?.text}
                  </div>
                </div>
              )}

              <VarTable vars={shownVars} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
