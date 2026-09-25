"use client";

import { Fragment, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Steps, Pitfalls } from "@/components/lab-steps";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { SelectField } from "@/components/ui/field";
import { FileSet } from "@/components/ui/file-set";
import { categories, modules } from "@/lib/modules";
import { IT_GUIDES } from "@/lib/data/it-labs";
import { DATASET, GUIDES } from "@/lib/data/it-lobe";
import { useItIndex, type CodeRun } from "@/lib/it-files";

const mod = modules.find((m) => m.slug === "it-lab3")!;
const accent = categories.it.accent;
const procedure = IT_GUIDES["it-lab3"];

/** Каталог работы относительно страницы модуля. */
const BASE = "../../it/lab3";

/** Строка сводной таблицы: один этап одного способа. */
interface Row {
  way: string;
  stage: string;
  train: string;
  validation: string;
  seconds?: number;
}

/** Этапы скриптов PyTorch и TensorFlow в том порядке, в каком они их пишут. */
function codeStageNames(net: string): string[] {
  return [
    "MobileNetV2 · «навчання»",
    `${net} · «навчання»`,
    `${net} · «навчання» и «доповнення»`,
    `${net} · дообучение верхнего блока`,
  ];
}

function codeRows(way: string, net: string, run: CodeRun): Row[] {
  const names = codeStageNames(net);
  return run.stages.map((s, i) => ({
    way,
    stage: names[i] ?? s.stage,
    train: `${s.train.correct} из ${s.train.total}`,
    validation: `${s.validation.correct} из ${s.validation.total}`,
    seconds: s.seconds,
  }));
}

/** «доповнення» как новые картинки: у скриптов это записано на этапе режима точности. */
function extraOf(run: CodeRun) {
  return run.stages.find((s) => s.extra_before_adding)?.extra_before_adding;
}

/** Размер в мегабайтах: отчёт весит несколько мегабайт из-за снимков окон. */
function mb(bytes: number): string {
  return `${(bytes / 2 ** 20).toFixed(1).replace(".", ",")} МБ`;
}

export default function ItLab3Page() {
  const index = useItIndex();
  const [guideId, setGuideId] = useState(GUIDES[0].id);
  const guide = GUIDES.find((g) => g.id === guideId)!;

  const lab = index?.lab3;
  const rows: Row[] = lab
    ? [
        ...lab.results.lobe.map((s) => ({
          way: "Lobe",
          stage: `${s.stage} · ${s.mode}`,
          train: s.train,
          validation: s.validation.replace("/", " из "),
        })),
        ...codeRows("PyTorch", "ResNet50", lab.results.pytorch),
        ...codeRows("TensorFlow", "ResNet50V2", lab.results.tensorflow),
      ]
    : [];
  const unseen = lab
    ? [
        { way: "Lobe", result: lab.results.lobe_extra_before_adding },
        { way: "PyTorch", result: extraOf(lab.results.pytorch) },
        { way: "TensorFlow", result: extraOf(lab.results.tensorflow) },
      ].flatMap((u) => (u.result ? [{ way: u.way, ...u.result }] : []))
    : [];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Вариантов у этой работы нет: набор изображений выбирается самостоятельно. Поэтому
          здесь не генератор по номеру, а то, что нужно на самом деле: набор, который
          собирается одной командой, запуск Lobe на разных системах с тем, где он ломается,
          и та же работа кодом на PyTorch и TensorFlow. Все способы проверены на одних и тех
          же 40 изображениях.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {/* --- Набор изображений -------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Набор изображений
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {DATASET.source}. Четыре класса: {DATASET.classes.join(", ")}. Картинки лежат в
                подпапках с названиями классов — Lobe размечает их по этим названиям сам.
                Скрипт make_dataset.py скачивает архив и раскладывает ровно те 360 файлов, на
                которых сделана работа.
              </p>
            </div>

            {/* Назначение папки стоит под её именем, а не отдельным столбцом:
                так таблица помещается в ширину телефона без прокрутки. */}
            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">Папка</th>
                    <th className="px-3 py-2 text-right font-medium">На класс</th>
                    <th className="px-3 py-2 text-right font-medium">Всего</th>
                  </tr>
                </thead>
                <tbody>
                  {DATASET.splits.map((s) => (
                    <tr key={s.name} className="border-b border-border/50 last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="block font-mono text-xs" style={{ color: accent }}>
                          {s.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-faint">
                          {s.role}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-ink-dim">
                        {s.perClass}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-ink-dim">
                        {s.perClass * DATASET.classes.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* --- Способ выполнения -------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Как выполнить
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Отчёт требует именно Lobe. PyTorch и TensorFlow — та же работа кодом: чтобы
                понять, что Lobe делает внутри, или если он не запускается. Все пять путей
                пройдены на деле, шаги и команды проверены.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Способ"
                value={guideId}
                onChange={(e) => setGuideId(e.target.value)}
              >
                {GUIDES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </SelectField>
            </div>

            <p className="text-sm leading-relaxed text-ink-dim">{guide.summary}</p>

            <Steps steps={guide.steps} accent={accent} />
            <Pitfalls items={guide.pitfalls} accent={accent} />
          </CardBody>
        </Card>

        {/* --- Результаты --------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Результаты на одном наборе
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Проверка — всегда на папке «перевірка», которую модель не видела при обучении
                (в Lobe две её картинки попали в обучение при исправлении меток). В PyTorch и
                TensorFlow основа заморожена и обучается только выходной слой, как в Lobe;
                PyTorch вместо ResNet50V2 использует ResNet50.
              </p>
            </div>

            {lab ? (
              <>
                {/* Способ — строкой-заголовком над своими этапами, а проверка
                    сразу за этапом: на телефоне без прокрутки видно главное. */}
                <div className="overflow-x-auto rounded-[4px] border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-ink-faint">
                        <th className="px-3 py-2 text-left font-medium">Этап</th>
                        <th className="px-3 py-2 text-right font-medium">Проверка</th>
                        <th className="px-3 py-2 text-right font-medium">Обучающие</th>
                        <th className="px-3 py-2 text-right font-medium">Обучение, с</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const first = i === 0 || rows[i - 1].way !== r.way;
                        return (
                          <Fragment key={`${r.way}-${i}`}>
                            {first && (
                              <tr className="border-b border-border/50 bg-white/[0.02]">
                                <td colSpan={4} className="px-3 py-2 font-medium text-ink">
                                  {r.way}
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-border/50 last:border-b-0">
                              <td className="min-w-[10rem] px-3 py-2 leading-snug text-ink-dim">
                                {r.stage}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink">
                                {r.validation}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-dim">
                                {r.train}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-ink-faint">
                                {r.seconds === undefined
                                  ? "—"
                                  : r.seconds.toFixed(1).replace(".", ",")}
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-sm leading-relaxed text-ink-dim">
                  Папка «доповнення» до того, как её добавили в обучение, — ещё{" "}
                  {lab.results.lobe_extra_before_adding.total} новых картинок для модели режима
                  точности:{" "}
                  {unseen
                    .map((u) => `${u.way} — ${u.correct} из ${u.total}`)
                    .join(", ")}
                  .
                </p>
                <p className="text-xs leading-relaxed text-ink-faint">
                  PyTorch: {lab.results.pytorch.framework}. TensorFlow:{" "}
                  {lab.results.tensorflow.framework}. Видеокарта {lab.results.pytorch.device}, по{" "}
                  {lab.results.pytorch.epochs} эпох на этап, seed {lab.results.pytorch.seed}.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>

        {/* --- Отчёт и файлы ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Готовая работа
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Отчёт и скрипты всех способов выше. Фамилия студента, группа и преподаватель
                в них заменены.
              </p>
            </div>

            {lab ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-black/20 px-4 py-3">
                  <p className="text-sm text-ink-dim">
                    Отчёт на {lab.report.pages} страниц: снимки всех шагов в Lobe, таблица
                    проверки по этапам и выводы.
                  </p>
                  <a
                    href={`${BASE}/${lab.report.path}`}
                    download
                    className="shrink-0 rounded-[3px] px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      color: accent,
                      background: `${accent}14`,
                      border: `1px solid ${accent}44`,
                    }}
                  >
                    Скачать PDF · {mb(lab.report.size)}
                  </a>
                </div>
                <FileSet
                  base={BASE}
                  files={lab.files}
                  accent={accent}
                  supportingNote="Это перечень файлов набора, по которому его собирает make_dataset.py, и агент, через который песочницей управляли из WSL: для самой работы они не нужны."
                />
              </>
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
