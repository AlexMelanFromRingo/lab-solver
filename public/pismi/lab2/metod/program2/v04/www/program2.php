<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Календар.
 *
 * Побудувати місячний календар у вигляді таблиці (5 рядків, 7 стовпців). Як
 * початкові дані використати день тижня, на який припадає перше число місяця
 * (число від 1 до 7).
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Місячний календар 5 × 7.
 *
 * У місяці 31 день, а таблиця має лише 35 комірок. Якщо місяць починається
 * в суботу чи неділю, останні числа не вміщуються – тоді, як у настінних
 * календарях, вони пишуться через риску в комірці на тиждень раніше (23/30).
 */
class MonthCalendar
{
    private const DAYS = 31;
    private const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    private const NAMES = ['понеділок', 'вівторок', 'середу', 'четвер', 'п’ятницю', 'суботу', 'неділю'];

    private int $firstDay;

    public function __construct(mixed $firstDay)
    {
        $day = filter_var($firstDay, FILTER_VALIDATE_INT);
        if ($day === false || $day < 1 || $day > 7) {
            throw new InvalidArgumentException('День тижня першого числа: потрібне ціле число від 1 (понеділок) до 7 (неділя).');
        }

        $this->firstDay = $day;
    }

    /**
     * Вміст 35 комірок: номер дня або два номери через риску.
     *
     * @return string[]
     */
    public function cells(): array
    {
        $cells = array_fill(0, 35, '');
        for ($day = 1; $day <= self::DAYS; $day++) {
            $index = $this->firstDay - 2 + $day;
            if ($index < 35) {
                $cells[$index] = (string) $day;
            } else {
                // Не вмістилося: дописуємо до числа тижнем раніше.
                $cells[$index - 7] .= '/' . $day;
            }
        }

        return $cells;
    }

    public function render(): string
    {
        $cells = $this->cells();

        $html = '<table class="calendar"><tr>';
        foreach (self::WEEKDAYS as $i => $name) {
            $html .= '<th' . ($i >= 5 ? ' class="weekend"' : '') . '>' . $name . '</th>';
        }
        $html .= '</tr>';

        for ($row = 0; $row < 5; $row++) {
            $html .= '<tr>';
            for ($col = 0; $col < 7; $col++) {
                $class = $col >= 5 ? ' class="weekend"' : '';
                $html .= '<td' . $class . '>' . $cells[$row * 7 + $col] . '</td>';
            }
            $html .= '</tr>';
        }

        return $html . '</table><p class="caption">Перше число припадає на '
            . self::NAMES[$this->firstDay - 1] . '. У місяці ' . self::DAYS . ' день.</p>';
    }
}

// Параметр з рядка браузера: день тижня першого числа (1 – понеділок, 7 – неділя).
$params = [
    'first' => 'день тижня першого числа, 1–7',
];
$example = ['first' => 3];

$result = null;
$error = null;

if (isset($_GET['first'])) {
    try {
        $calendar = new MonthCalendar($_GET['first']);
        $result = $calendar->render();
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

        .calendar {
            border-collapse: collapse;
            font-family: var(--v-mono);
        }

        .calendar th,
        .calendar td {
            width: 64px;
            height: 48px;
            padding: 0;
            text-align: center;
        }

        .calendar th {
            height: 34px;
            color: var(--v-head);
            font-weight: 400;
        }

        .calendar td {
            border: 1px solid var(--v-line);
            background: var(--v-cell);
            font-size: 17px;
        }

        .calendar .weekend {
            color: var(--v-strong);
        }

        .calendar td.weekend {
            background: var(--v-soft);
        }

        .caption {
            margin: 14px 0 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Побудувати місячний календар у вигляді таблиці (5 рядків, 7 стовпців). Як
початкові дані використати день тижня, на який припадає перше число місяця
(число від 1 до 7).</p>

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
