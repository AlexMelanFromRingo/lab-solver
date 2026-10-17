"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { SelectField } from "@/components/ui/field";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
import { INSTALL_GUIDES } from "@/lib/data/pismi-install";
import { usePismiIndex } from "@/lib/pismi-files";
import { useLang } from "@/components/lang";
import { tr } from "@/lib/i18n";

const mod = modules.find((m) => m.slug === "pismi-lab1")!;
const accent = categories.pismi.accent;
const procedure = LAB_GUIDES["pismi-lab1"];

export default function PismiLab1Page() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [guideId, setGuideId] = useState(INSTALL_GUIDES[0].id);
  const guide = INSTALL_GUIDES.find((g) => g.id === guideId)!;
  const { index, failed } = usePismiIndex();
  const lab = index?.labs["1"];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? "Завдання лабораторної — підняти контейнер із PHP і Apache і показати в браузері сторінку зі своїми ПІБ і групою. Методичка описує один шлях, через VirtualBox з Ubuntu всередині. Насправді годиться будь-яка з чотирьох конфігурацій нижче: Docker працює з ядром Linux, а звідки це ядро взялося — на файл оточення і команди не впливає. Готова робота внизу сторінки: ПІБ і група вписуються прямо в index.php, як того вимагає завдання." : "Задание лабораторной — поднять контейнер с PHP и Apache и показать в браузере страницу со своими ПІБ и группой. Методичка описывает один путь, через VirtualBox с Ubuntu внутри. На деле годится любая из четырёх конфигураций ниже: Docker работает с ядром Linux, а откуда это ядро взялось — на файл окружения и команды не влияет. Готовая работа внизу страницы: ПІБ и группа вписываются прямо в index.php, как того требует задание."}
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        <Card>
          <CardBody className="pt-6 space-y-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Установка Docker
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Система"
                value={guideId}
                onChange={(e) => setGuideId(e.target.value)}
              >
                {INSTALL_GUIDES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {tr(g.system, lang)}
                  </option>
                ))}
              </SelectField>
            </div>

            <p className="text-sm leading-relaxed text-ink-dim">{tr(guide.summary, lang)}</p>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink-dim">{tx("Що потрібно заздалегідь","Что нужно заранее")}</h3>
              <ul className="space-y-1.5 text-sm text-ink-faint">
                {guide.requirements.map((req, ri) => (
                  <li key={ri} className="flex gap-2">
                    <span style={{ color: accent }}>·</span>
                    {tr(req, lang)}
                  </li>
                ))}
              </ul>
            </div>

            <ol className="space-y-6">
              {guide.steps.map((step, i) => (
                <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <h4 className="font-medium text-ink">{tr(step.title, lang)}</h4>
                    {step.body && (
                      <p className="text-sm leading-relaxed text-ink-dim">{tr(step.body, lang)}</p>
                    )}
                    {step.commands && (
                      <pre className="overflow-x-auto rounded-[4px] border border-border bg-black/40 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
                        {step.commands.join("\n")}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink-dim">{tx("Де спотикаються","Где спотыкаются")}</h3>
              <ul className="space-y-2 text-sm text-ink-dim">
                {guide.pitfalls.map((pit, pi) => (
                  <li key={pi} className="flex gap-2 leading-relaxed">
                    <span style={{ color: accent }}>·</span>
                    {tr(pit, lang)}
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        {lab && index ? (
          <>
            <PismiWork
              index={index}
              lab={lab}
              accent={accent}
              intro={
                <>
                  {lang === "uk" ? "Оточення — дослівно приклад методички, index.php виводить ПІБ і групу. Розкласти як у методичці (архів так і влаштований), виконати " : "Окружение — дословно пример методички, index.php выводит ПІБ и группу. Разложить как в методичке (архив так и устроен), выполнить "}{" "}
                  <code className="whitespace-nowrap font-mono text-ink">docker compose up -d</code> {lang === "uk" ? "і відкрити" : "и открыть"}
                  {" "}http://localhost:8080.
                </>
              }
            />
            <PismiRun lab={lab} accent={accent} />
          </>
        ) : (
          <p className="text-sm text-ink-faint">
            {failed ? tx("Готова робота не завантажилася. Оновіть сторінку.","Готовая работа не загрузилась. Обновите страницу.") : tx("Завантаження готової роботи…","Загрузка готовой работы…")}
          </p>
        )}
      </div>
    </div>
  );
}
