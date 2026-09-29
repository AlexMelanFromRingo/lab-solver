<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Початковий перелік робіт: лабораторні роботи з дисципліни.
 *
 * Роботи прив'язуються до першого зареєстрованого користувача, тобто до
 * власника сайту, тому спочатку потрібно зареєструватися. Повторний запуск
 * нічого не дублює: наявні роботи з тією самою назвою пропускаються.
 *
 *     php artisan db:seed --class=ProjectSeeder
 */
class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::orderBy('id')->first();

        if ($owner === null) {
            $this->command->warn('Користувачів ще немає: зареєструйтеся на сайті та запустіть сівалку ще раз.');

            return;
        }

        $year = (int) date('Y');

        $projects = [
            [
                'title' => 'Платформа для веб-додатку на Docker',
                'stack' => 'Docker, Docker Compose, PHP, Apache',
                'description' => 'Контейнер з PHP та веб-сервером Apache, який піднімається однією командою '
                    . 'docker compose up. Сторінка з даними автора та перевірка середовища через phpinfo().',
            ],
            [
                'title' => 'Програми на PHP',
                'stack' => 'PHP 8',
                'description' => 'Дві програми: обчислення двох виразів із перевіркою, що вони збігаються, '
                    . 'та клас, який отримує параметри з адресного рядка браузера й будує за ними результат.',
            ],
            [
                'title' => 'Довідник з базою даних MySQL',
                'stack' => 'PHP, MySQL, phpMyAdmin, Docker Compose',
                'description' => 'Веб-сторінка довідника: перегляд, додавання, редагування, видалення '
                    . 'та пошук записів у таблиці MySQL.',
            ],
            [
                'title' => 'Застосунок на Laravel з обліковими записами',
                'stack' => 'Laravel, Laravel Breeze, Tailwind CSS, MySQL',
                'description' => 'Laravel у контейнерах за методичними матеріалами: міграції бази даних, '
                    . 'реєстрація та вхід користувачів через Laravel Breeze.',
            ],
            [
                'title' => 'Персональна сторінка на Laravel',
                'stack' => 'Laravel, Eloquent, Blade, Tailwind CSS, SweetAlert2',
                'description' => 'Цей сайт: візитка з переліком робіт, кабінет для керування ними '
                    . 'та форма зворотного зв’язку. Побудований за шаблоном MVC.',
            ],
        ];

        foreach ($projects as $project) {
            $owner->projects()->firstOrCreate(
                ['title' => $project['title']],
                $project + ['year' => $year],
            );
        }
    }
}
