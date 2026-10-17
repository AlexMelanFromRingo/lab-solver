"use client";

import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { run, type VarSnapshot } from "@/lib/algorithms/jolsm";
import { JolsmEditor } from "@/components/jolsm-editor";
import { cn } from "@/lib/cn";
import { useLang } from "@/components/lang";

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
мітка: if i = 4 goto підсумок
acc + mem(i)
i + 1
goto мітка
підсумок: print acc
end "сума порахована"`,
};

function VarTable({ vars }: { vars: VarSnapshot[] }) {
  const { lang } = useLang();
  if (vars.length === 0) return <p className="text-sm text-ink-faint">{lang === "uk" ? "Змінні ще не оголошені." : "Переменные ещё не объявлены."}</p>;
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border text-ink-faint text-xs">
            <th className="text-left px-3 py-2">{lang === "uk" ? "Ім'я" : "Имя"}</th>
            <th className="text-left px-3 py-2">{lang === "uk" ? "Розряд." : "Разряд."}</th>
            <th className="text-left px-3 py-2">{lang === "uk" ? "Значення" : "Значение"}</th>
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

const JOLSM_EXAMPLE_UK: Record<string, string> = {
  "Сложение двух регистров": "Додавання двох регістрів",
  "Переполнение при сложении (15 бит, оригинальный пример лабы 1)": "Переповнення при додаванні (15 біт, оригінальний приклад лаби 1)",
  "Цикл: сумма ячеек памяти": "Цикл: сума комірок пам’яті",
};

export default function JolsmPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const exLabel = (nm: string) => (lang === "uk" ? (JOLSM_EXAMPLE_UK[nm] ?? nm) : nm);
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
          {lang === "uk" ? (<>JOLS-M (ЯОЛС-М) — навчальна мова мікропрограм: регістри і пам’ять заданої розрядності, одна мікрокоманда на рядок (READ/ОПЕРАЦІЯ/PRINT/GOTO/IF/END), підтримуються бітові поля{" "}<code>рег(старший:молодший)</code>, непряма адресація та інверсія регістра окремою командою{" "}<code>рег~</code>. Інтерпретатор звірено з IDE yal.cc порядково: той самий вивід{" "}<code>a(00000101 05 5)</code> і ті самі помилки збірки (інверсії операнда всередині операції і від’ємних літералів в IDE немає). Він виконує програму цілком і запам’ятовує стан усіх змінних після кожної команди — рухайте повзунок, щоб побачити їх значення на будь-якому кроці.</>) : (<>JOLS-M (ЯОЛС-М) — учебный язык микропрограмм: регистры и память заданной разрядности, одна микрокоманда на строку (READ/ОПЕРАЦИЯ/PRINT/GOTO/IF/END), поддерживаются битовые поля{" "}<code>рег(старший:младший)</code>, косвенная адресация и инверсия регистра отдельной командой{" "}<code>рег~</code>. Интерпретатор сверен с IDE yal.cc построчно: тот же вывод{" "}<code>a(00000101 05 5)</code> и те же ошибки сборки (инверсии операнда внутри операции и отрицательных литералов в IDE нет). Он выполняет программу целиком и запоминает состояние всех переменных после каждой команды — двигайте ползунок, чтобы увидеть их значения на любом шаге.</>)}
        </InfoNote>

        <div className="flex flex-wrap gap-2">
          {Object.keys(EXAMPLES).map((name) => (
            <button
              key={name}
              onClick={() => setCode(EXAMPLES[name])}
              className="rounded-[3px] border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
            >
              {exLabel(name)}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">{tx("Мікропрограма", "Микропрограмма")}</h2>
              <JolsmEditor value={code} onChange={setCode} />
              <p className="text-xs text-ink-faint">
                {tx("Ctrl+Пробіл — підказки: команди, оголошені регістри і мітки, поля біт після «ім’я(», шаблони (цикл за лічильником, обернений і додатковий код, перевірка переповнення…). Наведіть на команду, регістр або знак операції — довідка. Помилки підкреслюються так, як їх видасть IDE.","Ctrl+Пробел — подсказки: команды, объявленные регистры и метки, поля бит после «имя(», шаблоны (цикл по счётчику, обратный и дополнительный код, проверка переполнения…). Наведите на команду, регистр или знак операции — справка. Ошибки подчёркиваются так, как их выдаст IDE.")}
              </p>
              <TextField
                label={tx("Значення для read/ввести (за порядком, через кому)", "Значения для read/ввести (по порядку, через запятую)")}
                value={inputsStr}
                onChange={(e) => setInputsStr(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-ink">Результат</h2>
              {!result.ok && (
                <div className="rounded-[3px] border border-codes/30 bg-codes-soft px-4 py-3 text-sm text-codes space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}
              {result.ended && (
                <div className="rounded-[3px] border border-theory/30 bg-theory-soft px-4 py-3 text-sm text-theory">
                  END: {result.ended || tx("(без повідомлення)", "(без сообщения)")}
                </div>
              )}
              {result.output.length > 0 && (
                <div className="rounded-[3px] border border-border bg-black/30 px-4 py-3 space-y-1">
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
                      {tx("Крок","Шаг")} {stepIdx + 1} / {result.trace.length}: {tx("рядок","строка")} {result.trace[stepIdx]?.line}
                    </span>
                    <span className="font-mono">{result.steps} {tx("кроків виконано всього","шагов выполнено всего")}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={result.trace.length - 1}
                    value={Math.max(0, stepIdx)}
                    onChange={(e) => setStepIdx(Number(e.target.value))}
                    className="w-full accent-arch"
                  />
                  <div className={cn("font-mono text-xs px-3 py-2 rounded-[3px] border border-border bg-black/20 text-ink-dim break-all")}>
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
