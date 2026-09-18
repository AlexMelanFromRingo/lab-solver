"use client";

import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { FileSet } from "@/components/ui/file-set";
import { categories, modules } from "@/lib/modules";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab3")!;
const accent = categories.pismi.accent;

/** Последовательность запуска: ровно та, что выполнялась при проверке. */
const STEPS: { title: string; body: string; commands?: string[] }[] = [
  {
    title: "Разложить файлы",
    body:
      "docker-compose.yml и Dockerfile — в корень каталога работы, остальное — в src. " +
      "Общие tokens.css и chrome.php кладутся в src/_shared.",
  },
  {
    title: "Поднять три контейнера",
    body:
      "Приложение собирается из своего образа: расширения PHP для MySQL должны быть " +
      "в самом образе, а не доставляться при каждом запуске.",
    commands: ["docker compose up -d --build", "docker ps"],
  },
  {
    title: "Открыть приложение",
    body:
      "Таблица создаётся сама при первом открытии страницы и наполняется примерами из " +
      "описания схемы. Тот же запрос можно выполнить вручную во вкладке SQL phpMyAdmin.",
    commands: ["# приложение   http://localhost:8092", "# phpMyAdmin   http://localhost:8093"],
  },
  {
    title: "Свернуть окружение",
    body: "Первая команда останавливает контейнеры, вторая удаляет ещё и данные базы.",
    commands: ["docker compose down", "docker compose down -v"],
  },
];

export default function PismiLab3Page() {
  const index = usePismiIndex();

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Задание — справочник на MySQL с операциями CRUD, окружение из трёх контейнеров:
          приложение, база и phpMyAdmin. Тематику справочника методичка разрешает выбрать
          самостоятельно, поэтому вариантов здесь нет: ниже готовая работа, в которой тема
          описана данными. Чтобы сделать свой справочник, достаточно переписать схему в
          <code> lib/schedule.php</code> — запрос создания таблицы, форма ввода и проверки
          значений строятся из неё.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-6">
            <h2 className="font-display text-lg font-semibold text-ink">Порядок запуска</h2>
            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-medium text-ink">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-dim">{step.body}</p>
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
                <li className="flex gap-2 leading-relaxed">
                  <span style={{ color: accent }}>·</span>
                  Контейнер базы поднимается дольше контейнера PHP, поэтому первое
                  подключение после запуска падает. В db.php подключение повторяется
                  десять раз с паузой — без этого страница падает на первом открытии.
                </li>
                <li className="flex gap-2 leading-relaxed">
                  <span style={{ color: accent }}>·</span>
                  Имя узла базы — это имя службы из файла окружения (<code>db</code>), а не
                  localhost: контейнеры обращаются друг к другу по именам служб.
                </li>
                <li className="flex gap-2 leading-relaxed">
                  <span style={{ color: accent }}>·</span>
                  Клиент mysql в консоли без <code>--default-character-set=utf8mb4</code>{" "}
                  показывает кириллицу вопросиками и не находит записи по кириллическому
                  WHERE. В базе при этом всё в порядке.
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Готовые файлы работы</h2>
              <p className="mt-1.5 text-sm text-ink-dim">
                Запросы с данными пользователя выполняются подготовленными запросами;
                имена столбцов, которые параметризовать нельзя, сверяются со списком
                допустимых символов.
              </p>
            </div>
            {index ? (
              <FileSet base="../../pismi/lab3" files={index.lab3.files} accent={accent} />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
