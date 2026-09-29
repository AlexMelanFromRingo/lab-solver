"use client";

import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { InfoNote } from "@/components/ui/info-note";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab4")!;
const accent = categories.pismi.accent;
const procedure = LAB_GUIDES["pismi-lab4"];

export default function PismiLab4Page() {
  const { index, failed } = usePismiIndex();
  const lab = index?.labs["4"];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Материалы к работе — архив Laravel_inst.zip: Readme с командами и три файла
          окружения. Работа — поднять это окружение, поставить в нём свежий Laravel и Laravel
          Breeze и зарегистрировать пользователей. Своего кода в работе нет, поэтому и
          вариантов оформления нет: ниже три файла окружения дословно из архива. Этот же
          проект — основа пятой работы.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {lab && index ? (
          <>
            <PismiWork
              index={index}
              lab={lab}
              accent={accent}
              student={false}
              intro={
                <>
                  Данных студента в этих файлах нет, вписывать нечего. Архив устроен как дерево
                  из Readme: каталог lara/ с файлами окружения и пустым src/, в который{" "}
                  <code className="whitespace-nowrap font-mono text-ink">composer create-project</code> ставит
                  Laravel.
                </>
              }
            />
            <PismiRun
              lab={lab}
              accent={accent}
              before={
                lab.generated_by_steps && (
                  <p className="text-sm leading-relaxed text-ink-dim">{lab.generated_by_steps}</p>
                )
              }
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
