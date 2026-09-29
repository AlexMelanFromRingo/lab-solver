"use client";

import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { InfoNote } from "@/components/ui/info-note";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab5")!;
const accent = categories.pismi.accent;
const procedure = LAB_GUIDES["pismi-lab5"];

export default function PismiLab5Page() {
  const { index, failed } = usePismiIndex();
  const lab = index?.labs["5"];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Индивидуальное задание — веб-приложение на фреймворке с архитектурой MVC. Здесь это
          персональная страница-визитка на Laravel с Breeze, как в руководстве к заданию
          (Laravel_NotesList_tutorial): о себе, перечень работ из базы, которым владелец
          управляет в кабинете, и форма обратной связи, письма из которой читаются там же.
          Таблицы users и projects связаны «один ко многим», как users и notes в руководстве.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {lab && index ? (
          <>
            <PismiWork
              index={index}
              lab={lab}
              accent={accent}
              intro={
                <>
                  Это не весь проект, а накладка: файлы кладутся поверх свежего Laravel + Breeze,
                  созданного командами четвёртой работы, остальное в проекте — стандартное.
                  Окружение — то же, что в ЛР4. <code className="whitespace-nowrap font-mono text-ink">
                    composer create-project
                  </code> требует пустой каталог, поэтому архив распаковать
                  отдельно: сначала взять из него три файла окружения, а src/ скопировать поверх
                  проекта на шаге, где это сказано.
                </>
              }
            />
            <PismiRun
              lab={lab}
              accent={accent}
              before={lab.overlay && <p className="text-sm leading-relaxed text-ink-dim">{lab.overlay}</p>}
            />
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
