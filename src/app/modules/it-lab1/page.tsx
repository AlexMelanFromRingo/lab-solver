"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { TextAreaField, SelectField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { ComboChart, PieChart, ScatterChart } from "@/components/it-charts";
import { categories, modules } from "@/lib/modules";
import { IT_GUIDES, CHART_RULES } from "@/lib/data/it-labs";
import { PRESETS, parseTable, ru, totalOf } from "@/lib/algorithms/it-table";

const mod = modules.find((m) => m.slug === "it-lab1")!;
const accent = categories.it.accent;
const procedure = IT_GUIDES["it-lab1"];

export default function ItLab1Page() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const [edited, setEdited] = useState<Record<string, string>>({});
  const text = edited[presetId] ?? preset.text;

  const table = useMemo(() => parseTable(text), [text]);
  const total = useMemo(() => totalOf(table), [table]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Вариантов у этой работы нет: задание прямо разрешает заполнить таблицу любыми
          данными. Поэтому здесь не генератор по номеру, а то, что нужно на самом деле —
          порядок выполнения, требования к диаграммам дословно из задания и предпросмотр
          всех трёх диаграмм по своим числам, до того как строить их в книге.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {/* --- Таблица данных ---------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Таблица данных
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Десять строк, три столбца. Первая строка — заголовки. Разделитель — табуляция
                или точка с запятой, так что таблицу можно вставить прямо из книги.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
              <SelectField
                label="Готовый набор"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
              <p className="self-end pb-2.5 text-xs leading-relaxed text-ink-faint">
                {preset.relation}
              </p>
            </div>

            <TextAreaField
              label="Содержимое таблицы"
              hint={`${table.rows.length} строк`}
              value={text}
              rows={12}
              className="min-h-[18rem]"
              onChange={(e) => setEdited((prev) => ({ ...prev, [presetId]: e.target.value }))}
            />

            {table.problems.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-border bg-black/30 px-4 py-3 text-sm text-ink-dim">
                {table.problems.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span style={{ color: accent }}>·</span>
                    {p}
                  </li>
                ))}
              </ul>
            )}

            {table.rows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-ink-faint">
                      {table.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-b-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 font-mono text-ink-dim">
                            {ru(cell, j === 0 ? 0 : 3)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ background: `${accent}0d` }}>
                      <td className="px-3 py-2 text-ink-dim" colSpan={2}>
                        Сумма третьего столбца — для круговой диаграммы
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: accent }}>
                        {ru(total, 3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* --- Диаграммы ---------------------------------------------------- */}
        {table.rows.length > 1 && (
          <Card>
            <CardBody className="pt-6 space-y-8">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                  Как лягут диаграммы
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Строить их всё равно в книге. Здесь видно заранее, что получится: легли ли
                  точки на кривую и различимы ли доли на круговой.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-ink">
                  Точечная: {table.headers[1]} от {table.headers[0]}
                </h3>
                <ScatterChart table={table} accent={accent} />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-ink">
                  Вертикальная: {table.headers[1]} столбцами, {table.headers[2]} линией
                </h3>
                <ComboChart table={table} accent={accent} />
                <p className="text-xs leading-relaxed text-ink-faint">
                  Второй ряд вынесен на вспомогательную ось справа: величины разного порядка
                  на общей шкале не читаются.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-ink">
                  Круговая: доли {table.headers[2].toLowerCase()}
                </h3>
                <PieChart table={table} total={total} />
              </div>
            </CardBody>
          </Card>
        )}

        {/* --- Требования --------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Общие требования к диаграммам
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Дословно из задания. Нумерация в источнике идёт 1, 2, 3, 4, 6, 7 — пятый пункт
                пропущен, здесь сохранены исходные номера.
              </p>
            </div>

            <ol className="space-y-2">
              {CHART_RULES.map((rule) => (
                <li key={rule.number} className="flex gap-3 text-sm leading-relaxed text-ink-dim">
                  <span className="font-mono text-xs tabular-nums" style={{ color: accent }}>
                    {rule.number}
                  </span>
                  {rule.text}
                </li>
              ))}
            </ol>

            <div className="rounded-xl border border-border bg-black/30 px-4 py-3">
              <p className="text-sm leading-relaxed text-ink-dim">
                В самом задании есть расхождение: строить требуется точечный график,
                вертикальную и круговую диаграммы, а в составе отчёта названы снимки
                «комбінованої, точкової, поверхні». Три типа против трёх других. Надёжнее
                сделать то, что названо в задании, а в отчёте подписать вертикальную
                диаграмму комбинированной, если на ней два ряда — это она и есть.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* --- Для вставки --------------------------------------------------- */}
        {table.rows.length > 0 && (
          <Card>
            <CardBody className="pt-6 space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                  Вставить в книгу
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Разделитель — табуляция: при вставке в ячейку A1 таблица сама разойдётся по
                  столбцам.
                </p>
              </div>
              <OutputBlock label="Таблица" value={text} wrap={false} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
