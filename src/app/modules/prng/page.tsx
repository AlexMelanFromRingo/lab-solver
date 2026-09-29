"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { lcg, middleProduct, middleSquare, middleSquare32, shuffle, type PrngRun } from "@/lib/algorithms/prng";

const mod = modules.find((m) => m.slug === "prng")!;

type Method = "square" | "product" | "shuffle" | "lcg" | "square32";

const num = (s: string) => Number(s.replace(/\s/g, ""));

function summary(r: PrngRun): string {
  if (r.period !== undefined) return `Стан повторився: передперіод ${r.prePeriod} крок(ів), період ${r.period}.`;
  if (r.degenerate) return `Генератор виродився: на кроці ${r.steps.length} стан став 0 — далі одні нулі.`;
  return `За ${r.steps.length} кроків повтору немає — збільште кількість кроків.`;
}

export default function PrngPage() {
  const [method, setMethod] = useState<Method>("square");
  const [seed, setSeed] = useState("5772");
  const [seed2, setSeed2] = useState("1234");
  const [digits, setDigits] = useState("4");
  const [count, setCount] = useState("40");
  const [a, setA] = useState("1103515245");
  const [c, setC] = useState("12345");
  const [m, setM] = useState("2147483648");
  const [bits, setBits] = useState("8");

  let run: PrngRun | string;
  try {
    const n = Math.min(Math.max(num(count) || 1, 1), 2000);
    const d = Math.min(Math.max(num(digits) || 4, 2), 12);
    if (method === "square") run = middleSquare(num(seed) % 10 ** d, d, n);
    else if (method === "product") run = middleProduct(num(seed) % 10 ** d, num(seed2) % 10 ** d, d, n);
    else if (method === "shuffle") run = shuffle(num(seed), Math.min(Math.max(num(bits) || 8, 4), 30), n);
    else if (method === "lcg") {
      if (!(num(m) > 0)) throw new Error("Модуль m має бути додатним");
      run = lcg(num(a), num(c), num(m), num(seed), n);
    } else run = middleSquare32(num(seed), n);
  } catch (e) {
    run = (e as Error).message;
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <InfoNote>
          Методи — за лекцією 22 курсу: серединних квадратів (R0 — n-значне число, квадрат доповнюється нулями до 2n
          цифр, середина — нове R0, на виході 0.ghij), серединних добутків, перемішування і лінійний конгруентний. Окремо —
          двійковий варіант серединних квадратів на 32 бітах: середні 32 біти 64-бітного квадрата (так працює програма
          на C++ з 32-бітним seed, 123456789 → 639801144, 1234248755…).
        </InfoNote>
        <Card>
          <CardBody className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Метод" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
                <option value="square">серединних квадратів (десятковий)</option>
                <option value="product">серединних добутків</option>
                <option value="shuffle">перемішування</option>
                <option value="lcg">лінійний конгруентний</option>
                <option value="square32">серединних квадратів, 32 біти</option>
              </SelectField>
              <TextField label={method === "product" ? "R0" : method === "lcg" ? "x0" : "R0 (seed)"} value={seed} onChange={(e) => setSeed(e.target.value)} />
              {method === "product" && <TextField label="R1" value={seed2} onChange={(e) => setSeed2(e.target.value)} />}
              {(method === "square" || method === "product") && <TextField label="Розрядність n, цифр" value={digits} onChange={(e) => setDigits(e.target.value)} />}
              {method === "shuffle" && <TextField label="Розрядів у комірці" value={bits} onChange={(e) => setBits(e.target.value)} />}
              {method === "lcg" && (
                <>
                  <TextField label="a" value={a} onChange={(e) => setA(e.target.value)} />
                  <TextField label="c" value={c} onChange={(e) => setC(e.target.value)} />
                  <TextField label="m" value={m} onChange={(e) => setM(e.target.value)} />
                </>
              )}
              <TextField label="Кроків" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
            {typeof run === "string" ? (
              <p className="text-sm text-codes">{run}</p>
            ) : (
              <>
                <OutputBlock
                  label={summary(run)}
                  value={run.steps.map((s, i) => `${String(i + 1).padStart(4)}  ${s.from.padEnd(22)}${s.work.padEnd(40)}→ ${s.out}`).join("\n")}
                  wrap={false}
                />
                <p className="text-xs leading-relaxed text-ink-faint">
                  Недоліки методу серединних квадратів з лекції: виродження в нуль при невдалому R0 і повтор не пізніше ніж
                  через Mⁿ кроків (M — основа системи числення, n — розрядність); на практиці цикл значно коротший.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
