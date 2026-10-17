"use client";

import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { InfoNote } from "@/components/ui/info-note";
import { PismiRun, PismiWork } from "@/components/pismi-work";
import { categories, modules } from "@/lib/modules";
import { LAB_GUIDES } from "@/lib/data/pismi-labs";
import { usePismiIndex } from "@/lib/pismi-files";
import { useLang } from "@/components/lang";

const mod = modules.find((m) => m.slug === "pismi-lab5")!;
const accent = categories.pismi.accent;
const procedure = LAB_GUIDES["pismi-lab5"];

export default function PismiLab5Page() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const { index, failed } = usePismiIndex();
  const lab = index?.labs["5"];

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? "Індивідуальне завдання — вебзастосунок на фреймворку з архітектурою MVC. Тут це персональна сторінка-візитка на Laravel з Breeze, як у керівництві до завдання (Laravel_NotesList_tutorial): про себе, перелік робіт із бази, якими власник керує в кабінеті, і форма зворотного зв’язку, листи з якої читаються там же. Таблиці users і projects пов’язані «один до багатьох», як users і notes у керівництві. Кабінет лише для власника — першого зареєстрованого користувача; після нього реєстрація закривається." : "Индивидуальное задание — веб-приложение на фреймворке с архитектурой MVC. Здесь это персональная страница-визитка на Laravel с Breeze, как в руководстве к заданию (Laravel_NotesList_tutorial): о себе, перечень работ из базы, которым владелец управляет в кабинете, и форма обратной связи, письма из которой читаются там же. Таблицы users и projects связаны «один ко многим», как users и notes в руководстве. Кабинет только для владельца — первого зарегистрированного пользователя; после него регистрация закрывается."}
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
                  {lang === "uk" ? "Це не весь проєкт, а накладка: файли кладуться поверх свіжого Laravel + Breeze, створеного командами четвертої роботи, решта в проєкті — стандартне. Оточення — те саме, що в ЛР4. " : "Это не весь проект, а накладка: файлы кладутся поверх свежего Laravel + Breeze, созданного командами четвёртой работы, остальное в проекте — стандартное. Окружение — то же, что в ЛР4. "}<code className="whitespace-nowrap font-mono text-ink">
                    composer create-project
                  </code> {lang === "uk" ? "вимагає порожній каталог, тому архів розпакувати окремо: спочатку взяти з нього три файли оточення, а src/ скопіювати поверх проєкту на кроці, де це сказано." : "требует пустой каталог, поэтому архив распаковать отдельно: сначала взять из него три файла окружения, а src/ скопировать поверх проекта на шаге, где это сказано."}
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
            {failed ? tx("Готова робота не завантажилася. Оновіть сторінку.","Готовая работа не загрузилась. Обновите страницу.") : tx("Завантаження готової роботи…","Загрузка готовой работы…")}
          </p>
        )}
      </div>
    </div>
  );
}
