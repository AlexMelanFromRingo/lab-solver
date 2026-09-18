"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, SelectField } from "@/components/ui/field";
import { Steps, Pitfalls } from "@/components/lab-steps";
import { FuzzyInference } from "@/components/fuzzy-inference";
import { FlsDownload } from "@/components/fls-download";
import { categories, modules } from "@/lib/modules";
import { EXAMPLE_TASK } from "@/lib/data/ai-fuzzy-systems";
import { FLS_FORMAT, FLS_METHOD_LINE, FLS_PITFALLS, RUN_GUIDES } from "@/lib/data/ai-fls";
import { INITIAL_METHODS, formatTerm } from "@/lib/algorithms/fuzzy-mamdani";

const mod = modules.find((m) => m.slug === "ai-lab1")!;
const accent = categories.ai.accent;

const task = EXAMPLE_TASK;

export default function AiLab1Page() {
  const [guideId, setGuideId] = useState(RUN_GUIDES[1].id);
  const guide = RUN_GUIDES.find((g) => g.id === guideId)!;

  const [values, setValues] = useState<Record<string, number>>(task.cases[0].values);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Первая работа — знакомство со средой: собрать в FLS систему из разобранного примера
          методички и пройти по ней все этапы вывода. Программа 1990-х годов, 32-разрядная,
          без документации и с несколькими повадками, из-за которых вывод молча возвращает
          −1. Ниже — как её запустить, из чего состоит её файл и что происходит на каждом
          этапе.
        </InfoNote>

        {/* --- Запуск ------------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Запуск программы
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                FLS.exe не устанавливается: достаточно распаковать архив курса. Сложность
                только в разрядности — приложение 32-разрядное.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Система" value={guideId} onChange={(e) => setGuideId(e.target.value)}>
                {RUN_GUIDES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.system}
                  </option>
                ))}
              </SelectField>
            </div>

            <p className="text-sm leading-relaxed text-ink-dim">{guide.summary}</p>

            {guide.verified ? (
              <p className="text-xs" style={{ color: accent }}>
                Этим путём работа и делалась — команды проверены.
              </p>
            ) : (
              <p className="text-xs text-ink-faint">
                Путь не проверялся: команды взяты из документации соответствующих систем.
              </p>
            )}

            <Steps steps={guide.steps} accent={accent} />
          </CardBody>
        </Card>

        {/* --- Формат файла ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Строение файла .fls
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Формат нигде не описан — восстановлен по четырём примерам, приложенным к
                программе. Текстовый, кодировка CP1251, концы строк CRLF.
              </p>
            </div>

            <pre className="overflow-x-auto rounded-xl border border-border bg-black/40 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
              {FLS_FORMAT}
            </pre>

            <div className="space-y-2 text-sm leading-relaxed text-ink-dim">
              <p>
                Число переменных указывается только в первой строке первой переменной, число
                термов — в первой строке первого терма. Цвет записан как COLORREF, то есть
                R + G·256 + B·65536. Имена не могут содержать пробелов.
              </p>
              <p>
                Строка методов состоит из девяти позиций, из которых работают пять.
                Назначение позиций установлено опытом: в программе по очереди менялся один
                выпадающий список, система сохранялась, файлы сравнивались.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">Позиция</th>
                    <th className="px-3 py-2 text-left font-medium">Что задаёт</th>
                    <th className="px-3 py-2 text-left font-medium">Значения</th>
                  </tr>
                </thead>
                <tbody>
                  {FLS_METHOD_LINE.map((row) => (
                    <tr key={row.position} className="border-b border-border/50 last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs text-ink-faint">{row.position}</td>
                      <td className="px-3 py-2 text-ink">{row.role}</td>
                      <td className="px-3 py-2 font-mono text-xs text-ink-dim">{row.values}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* --- Пример из методички ----------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {task.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">{task.summary}</p>
            </div>

            <div className="space-y-4">
              {[...task.system.inputs, task.system.output].map((variable) => (
                <div key={variable.name} className="rounded-xl border border-border bg-black/20 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm text-ink">{variable.label}</span>
                    <span className="font-mono text-xs text-ink-faint">
                      универс [{String(variable.universe[0]).replace(".", ",")};{" "}
                      {String(variable.universe[1]).replace(".", ",")}]
                      {variable.unit ? `, ${variable.unit}` : ""}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {variable.terms.map((term) => (
                      <li key={term.name} className="font-mono text-xs text-ink-dim">
                        {term.name} = {formatTerm(term)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {task.system.inputs.map((variable) => (
                <NumberField
                  key={variable.name}
                  label={variable.label}
                  hint={`[${variable.universe[0]}; ${variable.universe[1]}]`}
                  value={String(values[variable.name] ?? "")}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [variable.name]: Number(e.target.value) }))
                  }
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {task.cases.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setValues(c.values)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim transition-colors hover:border-border-strong hover:text-ink"
                >
                  {c.label}
                </button>
              ))}
            </div>

            <FuzzyInference
              system={task.system}
              values={values}
              methods={INITIAL_METHODS}
              accent={accent}
            />

            {task.notes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-ink-dim">Что стоит заметить</h3>
                <ul className="space-y-2 text-sm text-ink-dim">
                  {task.notes.map((note) => (
                    <li key={note} className="flex gap-2 leading-relaxed">
                      <span style={{ color: accent }}>·</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        {/* --- Готовый файл ------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Эта система файлом .fls
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Открывается в программе через File → Open. После загрузки значения входных
                переменных нужно ввести заново — см. первую особенность ниже.
              </p>
            </div>
            <FlsDownload
              system={task.system}
              values={values}
              methods={INITIAL_METHODS}
              filename="employment.fls"
              accent={accent}
            />
          </CardBody>
        </Card>

        {/* --- Особенности --------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Особенности программы
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Каждая проверена отдельным опытом. Ни одна не описана в методичке, и на
                каждую уходит по часу, если не знать заранее.
              </p>
            </div>
            <Pitfalls items={FLS_PITFALLS} accent={accent} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
