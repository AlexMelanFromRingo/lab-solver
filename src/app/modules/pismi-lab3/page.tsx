"use client";

import { useState } from "react";

import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { InfoNote } from "@/components/ui/info-note";
import { SelectField } from "@/components/ui/field";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab3")!;
const accent = categories.pismi.accent;
const procedure = LAB_GUIDES["pismi-lab3"];

export default function PismiLab3Page() {
  const { index, failed } = usePismiIndex();
  const lab = index?.labs["3"];
  const [themeCode, setThemeCode] = useState("books");
  const theme = lab?.themes?.find((t) => t.code === themeCode) ?? lab?.themes?.[0];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Задание — справочник на MySQL с операциями над записями, весь в одном файле
          src/index.php, и окружение из трёх контейнеров: приложение, база и phpMyAdmin.
          Файлы окружения — дословно из методички. Тему студент выбирает сам: ниже все
          десять примеров методички и несколько своих. Для каждой темы готовы запрос создания
          таблицы с примерами записей (его выполняют в phpMyAdmin) и сама страница.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {lab && index && theme ? (
          <>
            <PismiWork
              index={index}
              lab={lab}
              accent={accent}
              choice={{ theme: theme.code }}
              intro={
                <>
                  Добавление, вывод всех записей, удаление и проверка данных есть в любом
                  оформлении; редактирование и поиск («Додатково» в методичке) — в двух старших.
                  Запросы с данными из формы — подготовленные.
                </>
              }
              selectors={{
                title: "Тема справочника",
                node: (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] sm:items-end">
                    <SelectField
                      label="Тема"
                      value={theme.code}
                      onChange={(e) => setThemeCode(e.target.value)}
                    >
                      {lab.themes?.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.title}
                        </option>
                      ))}
                    </SelectField>
                    <dl className="grid gap-x-6 gap-y-1 pb-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                      <dt className="text-ink-faint">поля</dt>
                      <dd className="text-ink-dim">{theme.fields.join(", ")}</dd>
                      <dt className="text-ink-faint">таблица</dt>
                      <dd className="font-mono text-[0.8125rem] text-ink-dim">{theme.table}</dd>
                      <dt className="text-ink-faint">откуда</dt>
                      <dd className="text-ink-dim">{theme.source}</dd>
                    </dl>
                  </div>
                ),
              }}
            />
            <PismiRun lab={lab} accent={accent} />
          </>
        ) : (
          <p className="text-sm text-ink-faint">
            {failed ? "Готовая работа не загрузилась. Обновите страницу." : "Загрузка готовой работы…"}
          </p>
        )}
      </div>
    </div>
  );
}
