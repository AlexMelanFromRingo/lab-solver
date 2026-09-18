"use client";

import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { FileSet } from "@/components/ui/file-set";
import { Pitfalls, Steps, type LabStep } from "@/components/lab-steps";
import { categories, modules } from "@/lib/modules";
import { usePismiIndex } from "@/lib/pismi-files";

const mod = modules.find((m) => m.slug === "pismi-lab4")!;
const accent = categories.pismi.accent;

/** Последовательность ровно та, что выполнялась при сборке работы. */
const STEPS: LabStep[] = [
  {
    title: "Поднять окружение",
    body:
      "Три контейнера: приложение с PHP и Apache, MySQL и phpMyAdmin. Образ приложения " +
      "собирается свой — в нём нужны Composer и Node.",
    commands: ["docker compose up -d --build", "docker exec -it laravel_app bash"],
  },
  {
    title: "Создать проект Laravel",
    body:
      "Дальше всё выполняется внутри контейнера. Ключ --no-scripts нужен, потому что " +
      "постустановочные скрипты требуют уже настроенного .env.",
    commands: [
      "composer create-project laravel/laravel . --no-scripts",
      "cp .env.example .env",
      "chmod -R 775 storage bootstrap/cache",
      "chown -R www-data:www-data storage bootstrap/cache",
      "php artisan key:generate",
      "php artisan migrate",
    ],
  },
  {
    title: "Поставить авторизацию",
    body:
      "Breeze даёт регистрацию, вход, выход и сброс пароля. Стек — blade: именно он " +
      "используется в работе.",
    commands: [
      "composer require laravel/breeze --dev",
      "php artisan breeze:install blade",
      "php artisan migrate",
      "npm install && npm run build",
    ],
  },
  {
    title: "Создать модель, контроллер и маршруты",
    body:
      "Ключ -m создаёт миграцию вместе с моделью, --resource готовит контроллер с " +
      "типовым набором действий CRUD. Файлы ниже уже содержат готовый код.",
    commands: [
      "php artisan make:model Note -m",
      "php artisan make:controller NoteController --resource",
      "php artisan migrate",
      "php artisan route:list",
    ],
  },
  {
    title: "Пересобрать интерфейс после правок",
    body: "Команду нужно повторять каждый раз после изменения blade-шаблонов и стилей.",
    commands: ["npm run build", "# приложение   http://localhost:8094", "# phpMyAdmin   http://localhost:8095"],
  },
];

const PITFALLS = [
  "В Dockerfile из методического архива COPY копирует ./apache/apache.conf, а сам файл лежит в корне архива — сборка образа падает с «not found». В файлах ниже это исправлено: apache.conf лежит в каталоге apache.",
  "Node из репозитория Debian bookworm — версия 18, а сборщику Vite в Laravel 12 нужен 20 и новее. Поэтому Node ставится из репозитория NodeSource.",
  "php artisan breeze:install перезаписывает welcome.blade.php. Свой вид делать после установки Breeze, а не до неё.",
  "docker exec работает от root, поэтому созданные файлы принадлежат root и на хосте. После composer, artisan и npm выполнять chown -R 1000:1000 . и возвращать www-data права на storage и bootstrap/cache.",
  "Имя узла базы в .env — это имя службы из файла окружения (db), а не localhost.",
  "vendor и node_modules в репозиторий не идут. После клонирования нужны composer install, npm install и npm run build.",
];

export default function PismiLab4Page() {
  const index = usePismiIndex();

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Задание — веб-приложение на фреймворке с архитектурой MVC: доска сообщений, где
          пользователи оставляют заметки. Две таблицы, users и notes, связаны отношением
          «один ко многим», авторизацию даёт Laravel Breeze. Вариантов у работы нет,
          поэтому ниже порядок запуска и готовые файлы.
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
                Каркас Laravel создаётся командой, а это — то, что дописано поверх него:
                миграция, модель, контроллер, маршруты, представления и оформление.
              </p>
            </div>
            {index ? (
              <FileSet base="../../pismi/lab4" files={index.lab4.files} accent={accent} />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
