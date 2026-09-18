"use client";

import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { FileSet } from "@/components/ui/file-set";
import { Pitfalls, Steps, type LabStep } from "@/components/lab-steps";
import { categories, modules } from "@/lib/modules";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab5")!;
const accent = categories.pismi.accent;

const STEPS: LabStep[] = [
  {
    title: "Поднять окружение и создать проект",
    body: "Те же три контейнера, что и в четвёртой работе; отличаются имена, порты и база.",
    commands: [
      "docker compose up -d --build",
      "docker exec -it site_app bash",
      "composer create-project laravel/laravel . --no-scripts",
      "cp .env.example .env && php artisan key:generate",
    ],
  },
  {
    title: "Поставить авторизацию",
    body: "Закрытая часть — управление записями и почтовый ящик — доступна после входа.",
    commands: ["composer require laravel/breeze --dev", "php artisan breeze:install blade"],
  },
  {
    title: "Создать таблицы и наполнить сайт",
    body:
      "Содержимое сайта описано данными в config/site.php; сеялка переносит его в базу " +
      "и не перезаписывает уже существующие записи, поэтому её безопасно запускать повторно.",
    commands: ["php artisan migrate", "php artisan db:seed", "npm install && npm run build"],
  },
  {
    title: "Открыть сайт",
    commands: [
      "# сайт         http://localhost:8096",
      "# phpMyAdmin   http://localhost:8097",
      "# темы сайта   ?theme=portfolio | studies | formula1 | music",
    ],
  },
];

const PITFALLS = [
  "Корнем сайта для Laravel служит каталог public, а не корень проекта: всё остальное — код приложения, и отдавать его веб-сервером нельзя. За это отвечает apache.conf.",
  "trans_choice берёт правила множественного числа из локали приложения. Локаль оставлена английской, иначе сообщения валидации свалятся на английские запасные строки, поэтому украинские формы считаются вручную.",
  "Проверка на стороне браузера не заменяет проверку на сервере: форма с ошибочным адресом не доходит до сервера, но та же форма, отправленная в обход браузера, отклоняется уже приложением.",
  "Ключ темы приходит строкой браузера, поэтому сверяется со списком известных: неизвестное значение молча заменяется темой по умолчанию.",
];

export default function PismiLab5Page() {
  const index = usePismiIndex();

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Индивидуальное задание: сайт на фреймворке с архитектурой MVC, со своим
          оформлением, базой, формой обратной связи и закрытой частью. Содержимое сайта
          описано отдельно от кода, поэтому одно и то же приложение показывает четыре
          разных сайта — визитку, трекер учёбы, справочник Формулы-1 и каталог музыки.
          Чтобы сделать свой, достаточно дописать тему в <code>config/site.php</code>.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-6">
            <h2 className="font-display text-lg font-semibold text-ink">Порядок запуска</h2>
            <Steps steps={STEPS} accent={accent} />
            <Pitfalls items={PITFALLS} accent={accent} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Готовые файлы работы</h2>
              <p className="mt-1.5 text-sm text-ink-dim">
                Всё, что дописано поверх каркаса Laravel: описание сайтов, модель, три
                контроллера, маршруты, миграция, макет с главной страницей и оформление.
              </p>
            </div>
            {index ? (
              <FileSet base="../../pismi/lab5" files={index.lab5.files} accent={accent} />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
