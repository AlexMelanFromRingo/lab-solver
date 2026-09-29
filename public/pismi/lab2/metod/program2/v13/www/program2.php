<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Зодіак.
 *
 * Залежно від місяця, року народження та імені, які мають бути вказані в
 * рядку браузера як параметри, видати інформацію щодо знака зодіаку та звіра
 * року народження.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Знак зодіаку за місяцем і звір року за східним календарем.
 *
 * Дня народження серед параметрів немає, а межі знаків припадають на
 * середину місяця, тому для місяця називаються обидва його знаки з датою межі.
 */
class Zodiac
{
    /** Місяць → [знак до межі, останній день цього знака, знак після межі]. */
    private const SIGNS = [
        1 => ['Козеріг', 19, 'Водолій'],
        2 => ['Водолій', 18, 'Риби'],
        3 => ['Риби', 20, 'Овен'],
        4 => ['Овен', 19, 'Телець'],
        5 => ['Телець', 20, 'Близнюки'],
        6 => ['Близнюки', 20, 'Рак'],
        7 => ['Рак', 22, 'Лев'],
        8 => ['Лев', 22, 'Діва'],
        9 => ['Діва', 22, 'Терези'],
        10 => ['Терези', 22, 'Скорпіон'],
        11 => ['Скорпіон', 21, 'Стрілець'],
        12 => ['Стрілець', 21, 'Козеріг'],
    ];

    /** Назви місяців у родовому відмінку: «до 19 січня». */
    private const MONTHS = [
        1 => 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ];

    /** Звірі 12-річного циклу в родовому відмінку, починаючи з року Щура (4 р.). */
    private const ANIMALS = ['Щура', 'Бика', 'Тигра', 'Кролика', 'Дракона', 'Змії',
        'Коня', 'Кози', 'Мавпи', 'Півня', 'Собаки', 'Свині'];

    private string $name;
    private int $month;
    private int $year;

    public function __construct(mixed $name, mixed $month, mixed $year)
    {
        if (!is_string($name) || trim($name) === '' || mb_strlen($name) > 40) {
            throw new InvalidArgumentException('Ім’я: потрібен непорожній рядок до 40 символів.');
        }

        $month = filter_var($month, FILTER_VALIDATE_INT);
        if ($month === false || $month < 1 || $month > 12) {
            throw new InvalidArgumentException('Місяць народження: потрібне ціле число від 1 до 12.');
        }

        $year = filter_var($year, FILTER_VALIDATE_INT);
        if ($year === false || $year < 1900 || $year > 2100) {
            throw new InvalidArgumentException('Рік народження: потрібне ціле число від 1900 до 2100.');
        }

        $this->name = trim($name);
        $this->month = $month;
        $this->year = $year;
    }

    /**
     * Знаки зодіаку місяця народження з межею між ними.
     */
    public function signs(): string
    {
        [$first, $lastDay, $second] = self::SIGNS[$this->month];
        $month = self::MONTHS[$this->month];

        return $first . ' (до ' . $lastDay . ' ' . $month . ') або ' . $second
            . ' (з ' . ($lastDay + 1) . ' ' . $month . ')';
    }

    /**
     * Звір року: цикл повторюється кожні 12 років.
     */
    public function animal(int $year): string
    {
        return self::ANIMALS[($year - 4) % 12];
    }

    public function render(): string
    {
        $html = '<p class="person">' . htmlspecialchars($this->name) . '</p>'
            . '<p class="born">народження: ' . str_pad((string) $this->month, 2, '0', STR_PAD_LEFT)
            . '.' . $this->year . '</p>'
            . '<dl class="facts">'
            . '<dt>Знак зодіаку</dt><dd>' . $this->signs() . '</dd>'
            . '<dt>Звір року</dt><dd>рік ' . $this->animal($this->year) . ' (' . $this->year . ')</dd>'
            . '</dl>';

        // Східний Новий рік настає між 21 січня і 20 лютого.
        if ($this->month <= 2) {
            $html .= '<p class="caption">Східний Новий рік настає між 21 січня та 20 лютого: '
                . 'якщо день народження раніше, це ще рік ' . $this->animal($this->year - 1) . '.</p>';
        }

        return $html;
    }
}

// Параметри з рядка браузера: ім’я, місяць і рік народження.
$params = [
    'name' => 'ім’я',
    'month' => 'місяць народження, 1–12',
    'year' => 'рік народження',
];
$example = ['name' => 'Марія', 'month' => 4, 'year' => 2002];

$result = null;
$error = null;

if (isset($_GET['name'], $_GET['month'], $_GET['year'])) {
    try {
        $zodiac = new Zodiac($_GET['name'], $_GET['month'], $_GET['year']);
        $result = $zodiac->render();
    } catch (InvalidArgumentException $e) {
        $error = $e->getMessage();
    }
}

// Посилання-приклад: з ним сторінку можна відкрити без ручного набору параметрів.
$exampleUrl = 'program2.php?' . http_build_query($example);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <title>Програма № 2</title>
    <style>
        :root {
            --v-text: #000;
            --v-muted: #555;
            --v-line: #000;
            --v-cell: transparent;
            --v-head: #555;
            --v-mark: transparent;
            --v-mark-ink: #000;
            --v-soft: #eee;
            --v-strong: #000;
            --v-light: #fff;
            --v-dark: #888;
            --v-mono: monospace;
        }

        .person {
            margin: 0;
            font-size: 32px;
            font-weight: 600;
            line-height: 1.2;
        }

        .born {
            margin: 2px 0 20px;
            color: var(--v-muted);
            font-family: var(--v-mono);
        }

        .facts {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 22px;
            margin: 0 0 16px;
            font-size: 18px;
        }

        .facts dt {
            color: var(--v-muted);
        }

        .facts dd {
            margin: 0;
            color: var(--v-strong);
            font-weight: 600;
        }

        .caption {
            max-width: 36rem;
            margin: 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Залежно від місяця, року народження та імені, які мають бути вказані в рядку
браузера як параметри, видати інформацію щодо знака зодіаку та звіра року
народження.</p>

<?php
if ($result !== null) {
    echo $result;
} elseif ($error !== null) {
    echo "<p style='color: red;'>" . htmlspecialchars($error) . "</p>";
} else {
    echo "<p>Задайте параметри в рядку браузера, наприклад: ";
    echo "<a href='" . htmlspecialchars($exampleUrl) . "'>" . htmlspecialchars(urldecode($exampleUrl)) . "</a></p>";
}
?>
</body>
</html>
