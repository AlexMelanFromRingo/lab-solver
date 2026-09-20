<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 13.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class ZodiacTask
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

    /**
     * Ціле значення параметра з рядка браузера із затиском у межі.
     */
    private function int(array $p, string $name, int $default, int $min, int $max): int
    {
        $value = isset($p[$name]) && is_numeric($p[$name]) ? (int) $p[$name] : $default;

        return max($min, min($max, $value));
    }
}

/** Екранування для виводу в HTML. */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$task = new ZodiacTask();
$params = $task->params();

$values = [];
foreach ($params as $name => $meta) {
    $values[$name] = isset($_GET[$name]) && is_string($_GET[$name])
        ? $_GET[$name]
        : $meta['default'];
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ЛР2 · програма № 2 · варіант 13</title>
    <style>
        body {
            margin: 2rem auto;
            max-width: 52rem;
            padding: 0 1rem;
            font-family: Georgia, "Times New Roman", serif;
            line-height: 1.6;
            color: #1b1b1b;
        }

        h1 { font-size: 1.5rem; }

        pre, code, td, .num { font-family: "Courier New", monospace; }

        pre {
            background: #f3f3f3;
            padding: 0.75rem 1rem;
            overflow-x: auto;
        }

        table { border-collapse: collapse; }

        td, th { border: 1px solid #999; padding: 0.3rem 0.6rem; }

        .ok { color: #17692f; }

        .err { color: #a32116; }

        .hint { color: #555; font-size: 0.9rem; }

        td.axis { border: none; color: #777; text-align: center; }

        td.marked { background: #ffe9a8; font-weight: bold; text-align: center; }
    </style>
</head>
<body>

<h1>Програма № 2. <?= h($task->title()) ?></h1>

<p>Завдання виконує об’єкт класу <code><?= h('ZodiacTask') ?></code>.
Параметри передаються в рядку браузера.</p>

<form method="get">
    <?php foreach ($params as $name => $meta): ?>
        <label>
            <?= h($meta['label']) ?>
            <input type="text" name="<?= h($name) ?>" value="<?= h($values[$name]) ?>" size="6">
        </label>
    <?php endforeach; ?>
    <button type="submit">Порахувати</button>
</form>

<h2>Результат</h2>

<?= $task->render($values) ?>

<h2>Висновок</h2>

<p><?= h($task->conclusion()) ?></p>

<p class="hint"><a href="prog1.php">Програма № 1</a></p>

</body>
</html>
