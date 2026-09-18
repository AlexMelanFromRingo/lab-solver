<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class ZodiacTask extends Task
{
    private const SIGNS = [
        [1, 20, 'Козеріг'], [2, 19, 'Водолій'], [3, 21, 'Риби'],
        [4, 20, 'Овен'], [5, 21, 'Телець'], [6, 21, 'Близнюки'],
        [7, 23, 'Рак'], [8, 23, 'Лев'], [9, 23, 'Діва'],
        [10, 23, 'Терези'], [11, 22, 'Скорпіон'], [12, 22, 'Стрілець'],
    ];

    private const ANIMALS = ['Мавпа', 'Півень', 'Собака', 'Свиня', 'Щур', 'Бик',
                             'Тигр', 'Кріль', 'Дракон', 'Змія', 'Кінь', 'Коза'];

    public function title(): string
    {
        return 'Зодіак';
    }

    public function params(): array
    {
        return [
            'name' => ['label' => 'Ім’я', 'default' => 'Іван'],
            'month' => ['label' => 'Місяць народження', 'default' => '4'],
            'day' => ['label' => 'День народження', 'default' => '15'],
            'year' => ['label' => 'Рік народження', 'default' => '2002'],
        ];
    }

    public function render(array $p): string
    {
        $name = trim((string) ($p['name'] ?? 'Іван')) ?: 'Іван';
        $month = $this->int($p, 'month', 4, 1, 12);
        $day = $this->int($p, 'day', 15, 1, 31);
        $year = $this->int($p, 'year', 2002, 1900, 2100);

        [, $edge, $sign] = self::SIGNS[$month - 1];
        if ($day < $edge) {
            // До межі місяця діє знак попереднього періоду.
            $sign = self::SIGNS[($month + 10) % 12][2];
        }

        $animal = self::ANIMALS[$year % 12];

        return '<div class="facts__value">' . h($name) . '</div>'
            . '<div class="facts">'
            . '<div><div class="facts__label">Знак зодіаку</div>'
            . '<div class="facts__value">' . h($sign) . '</div></div>'
            . '<div><div class="facts__label">Звір року</div>'
            . '<div class="facts__value">' . h($animal) . '</div></div>'
            . '<div><div class="facts__label">Дата</div>'
            . '<div class="facts__value">' . sprintf('%02d.%02d.%d', $day, $month, $year)
            . '</div></div></div>'
            . '<p class="hint">Методичні вказівки називають три параметри – місяць, '
            . 'рік та ім’я. Додано ще день: без нього знак зодіаку на межі місяця '
            . 'визначити неможливо, бо межі знаків не збігаються з межами місяців.</p>';
    }

    public function conclusion(): string
    {
        return 'Знак зодіаку залежить від дня й місяця, звір року – від '
            . 'остачі року від ділення на дванадцять. Обидві відповідності '
            . 'зберігаються таблицями, а не ланцюжками умов: таблиця '
            . 'коротша, читається як дані й не потребує змін у логіці, якщо '
            . 'межі знаків доведеться уточнити.';
    }
}
