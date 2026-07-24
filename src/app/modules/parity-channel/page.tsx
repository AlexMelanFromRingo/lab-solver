"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { LAB4_VARIANTS } from "@/lib/data/variant-tables";
import { analyzeChannel, buildParityMatrix, checkAndCorrect, flipBit, matrixToBitString } from "@/lib/algorithms/parity-channel";
import { cn } from "@/lib/cn";

const mod = modules.find((m) => m.slug === "parity-channel")!;
const accent = categories.theory.accent;

export default function ParityChannelPage() {
  const [variantNum, setVariantNum] = useState(1);
  const variant = LAB4_VARIANTS.find((v) => v.variant === variantNum)!;

  const [messageChoice, setMessageChoice] = useState<"1" | "2">("1");
  const message = messageChoice === "1" ? variant.message1 : variant.message2;
  const [errRow, setErrRow] = useState(0);
  const [errCol, setErrCol] = useState(1);

  const baseMatrix = useMemo(() => buildParityMatrix(message, 2), [message]);
  const receivedMatrix = useMemo(
    () => (errRow >= 0 && errCol >= 0 ? flipBit(baseMatrix, errRow, errCol) : baseMatrix),
    [baseMatrix, errRow, errCol]
  );
  const check = useMemo(() => checkAndCorrect(receivedMatrix), [receivedMatrix]);

  const channel = useMemo(
    () => analyzeChannel(variant.lengthMB, variant.speedSymPerSec, variant.p1, variant.p2, variant.p3),
    [variant]
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Двумерный (построчно-постолбцовый) код чётности: контрольный бит строки и столбца — XOR
          соответствующих информационных бит. Одиночная ошибка нарушает ровно одну строчную и одну
          столбцовую чётность — их пересечение и есть позиция ошибки, поэтому она исправима.
          Пропускная способность двоичного симметричного канала считается по формуле Шеннона{" "}
          <code>C = v·(1 − H(p))</code>, где <code>H(p)</code> — двоичная энтропия вероятности ошибки.
          Важно: p1, p2, p3 из варианта — это три отдельных сценария (низкая/средняя/высокая
          вероятность ошибки), которые считаются и сравниваются по отдельности, а не усредняются
          (сверено по Noisy channel 1-3.xlsx).
        </InfoNote>

        <VariantDial value={variantNum} min={1} max={12} onChange={setVariantNum} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Код чётности</h2>
            <SelectField label="Сообщение варианта" value={messageChoice} onChange={(e) => setMessageChoice(e.target.value as "1" | "2")}>
              <option value="1">Сообщение 1: {variant.message1}</option>
              <option value="2">Сообщение 2: {variant.message2}</option>
            </SelectField>

            <div className="inline-block rounded-xl border border-border overflow-hidden">
              {baseMatrix.bits.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((_, c) => (
                    <button
                      key={c}
                      onClick={() => (errRow === r && errCol === c ? (setErrRow(-1), setErrCol(-1)) : (setErrRow(r), setErrCol(c)))}
                      className={cn(
                        "w-12 h-12 flex items-center justify-center font-mono text-base border-b border-r border-border last:border-r-0",
                        errRow === r && errCol === c ? "bg-codes-soft text-codes" : "bg-surface-2 text-ink hover:bg-white/5"
                      )}
                    >
                      {receivedMatrix.bits[r][c]}
                    </button>
                  ))}
                  <div className="w-12 h-12 flex items-center justify-center font-mono text-sm border-b border-border bg-black/20 text-theory">
                    {baseMatrix.rowParity[r]}
                  </div>
                </div>
              ))}
              <div className="flex">
                {baseMatrix.colParity.map((p, c) => (
                  <div key={c} className="w-12 h-12 flex items-center justify-center font-mono text-sm bg-black/20 text-theory border-r border-border last:border-r-0">
                    {p}
                  </div>
                ))}
                <div className="w-12 h-12 flex items-center justify-center font-mono text-xs bg-black/30 text-ink-faint">
                  {baseMatrix.cornerParity}
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-faint">
              Кликните по любому биту данных, чтобы внести одиночную ошибку — строка/столбец справа/снизу — контрольные суммы.
            </p>

            <div
              className={cn(
                "rounded-xl border px-5 py-3 text-sm font-medium",
                check.errorCount === "0"
                  ? "border-theory/30 bg-theory-soft text-theory"
                  : check.errorCount === "1"
                  ? "border-number/30 bg-number-soft text-number"
                  : "border-codes/30 bg-codes-soft text-codes"
              )}
            >
              {check.errorCount === "0" && "Ошибок нет"}
              {check.errorCount === "1" && `Ошибка в строке ${check.badRow! + 1}, столбце ${check.badCol! + 1} — исправлена`}
              {check.errorCount === "≥2" && "Обнаружено ≥2 ошибок — исправить нельзя, только зафиксировать"}
            </div>
            {check.corrected && <OutputBlock label="Исправленное сообщение" value={matrixToBitString(check.corrected)} />}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Пропускная способность канала</h2>
            <p className="text-xs text-ink-faint">
              Длина сообщения {variant.lengthMB} МБ, техническая скорость {variant.speedSymPerSec} симв/с.
              p1/p2/p3 — три отдельных сценария (не усредняются), сравниваются с безошибочным каналом (p=0).
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-border text-ink-faint text-xs uppercase">
                    <th className="text-left px-3 py-2">Сценарий</th>
                    <th className="text-left px-3 py-2">p</th>
                    <th className="text-left px-3 py-2">H(p)</th>
                    <th className="text-left px-3 py-2">C=1−H(p)</th>
                    <th className="text-left px-3 py-2">Длительность</th>
                    <th className="text-left px-3 py-2">Во сколько раз дольше</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 bg-white/[0.02]">
                    <td className="px-3 py-2 text-ink">безошибочный (база)</td>
                    <td className="px-3 py-2 text-ink-dim">0</td>
                    <td className="px-3 py-2 text-ink-dim">{channel.baseline.Hp.toFixed(4)}</td>
                    <td className="px-3 py-2 text-ink-dim">{channel.baseline.capacityFraction.toFixed(4)}</td>
                    <td className="px-3 py-2 text-ink">{channel.baseline.durationSec.toFixed(1)} с</td>
                    <td className="px-3 py-2 text-ink-faint">—</td>
                  </tr>
                  {channel.scenarios.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-ink">p{i + 1}</td>
                      <td className="px-3 py-2 text-ink-dim">{s.p}</td>
                      <td className="px-3 py-2 text-ink-dim">{s.Hp.toFixed(4)}</td>
                      <td className="px-3 py-2 text-ink-dim">{s.capacityFraction.toFixed(4)}</td>
                      <td className="px-3 py-2 text-ink">{s.durationSec.toFixed(1)} с</td>
                      <td className="px-3 py-2 text-theory">×{s.vsBaseline.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
