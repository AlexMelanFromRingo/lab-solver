"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { SelectField } from "@/components/ui/field";
import { FileSet } from "@/components/ui/file-set";
import { categories, modules } from "@/lib/modules";
import { INSTALL_GUIDES } from "@/lib/data/pismi-install";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab1")!;
const accent = categories.pismi.accent;

export default function PismiLab1Page() {
  const [guideId, setGuideId] = useState(INSTALL_GUIDES[0].id);
  const guide = INSTALL_GUIDES.find((g) => g.id === guideId)!;
  const index = usePismiIndex();

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Задание лабораторной — поднять контейнер с PHP и Apache и показать в браузере
          страницу со своими ФИО и группой. Методичка описывает один путь, через VirtualBox
          с Ubuntu внутри. На деле годится любая из четырёх конфигураций ниже: Docker
          работает с ядром Linux, а откуда это ядро взялось — на файл окружения и команды
          не влияет.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Система"
                value={guideId}
                onChange={(e) => setGuideId(e.target.value)}
              >
                {INSTALL_GUIDES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.system}
                  </option>
                ))}
              </SelectField>
            </div>

            <p className="text-sm leading-relaxed text-ink-dim">{guide.summary}</p>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink-dim">Что нужно заранее</h3>
              <ul className="space-y-1.5 text-sm text-ink-faint">
                {guide.requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span style={{ color: accent }}>·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <ol className="space-y-6">
              {guide.steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <h4 className="font-medium text-ink">{step.title}</h4>
                    {step.body && (
                      <p className="text-sm leading-relaxed text-ink-dim">{step.body}</p>
                    )}
                    {step.commands && (
                      <pre className="overflow-x-auto rounded-xl border border-border bg-black/40 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
                        {step.commands.join("\n")}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink-dim">Где спотыкаются</h3>
              <ul className="space-y-2 text-sm text-ink-dim">
                {guide.pitfalls.map((p) => (
                  <li key={p} className="flex gap-2 leading-relaxed">
                    <span style={{ color: accent }}>·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Готовые файлы работы</h2>
              <p className="mt-1.5 text-sm text-ink-dim">
                Положить в каталог проекта, выполнить <code>docker compose up -d</code> и
                открыть localhost:{index?.lab1.port ?? 8090}. ФИО и группа подставляются
                строкой браузера, поэтому править исходник под себя не нужно.
              </p>
            </div>
            {index ? (
              <FileSet base="../../pismi/lab1" files={index.lab1.files} accent={accent} />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>

        {index && (
          <Card>
            <CardBody className="pt-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Общие файлы</h2>
                <p className="mt-1.5 text-sm text-ink-dim">
                  Кладутся в подкаталог <code>_shared</code> рядом со страницей: цвета,
                  шрифты и мелкие помощники, одинаковые для всех работ курса.
                </p>
              </div>
              <FileSet base="../../pismi/shared" files={index.shared.map((f) => ({ ...f, path: f.path.replace("_shared/", "") }))} accent={accent} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
