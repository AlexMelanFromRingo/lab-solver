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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Програма № 2 – лабораторна робота № 2</title>
    <style>
        :root {
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-text: color-mix(in srgb, var(--accent) 78%, #000000);
            --text: #1d242b;
            --muted: #5f6b76;
            --line: #dde2e7;
            --good: #1e7a46;
            --bad: #b3261e;
        }

        body {
            margin: 0;
            background: #f4f6f8;
            color: var(--text);
            font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        main {
            max-width: 900px;
            margin: 32px auto;
            padding: 28px 40px 36px;
            border: 1px solid var(--line);
            border-top: 4px solid var(--accent);
            border-radius: 6px;
            background: #ffffff;
        }

        a {
            color: var(--accent-text);
        }

        .meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 4px 24px;
            margin: 0 0 18px;
            color: var(--muted);
            font-size: 14px;
        }

        .meta nav a {
            margin-left: 14px;
        }

        .meta nav a[aria-current] {
            color: var(--text);
            font-weight: 600;
            text-decoration: none;
        }

        h1 {
            margin: 0 0 16px;
            font-size: 26px;
            line-height: 1.25;
        }

        h2 {
            margin: 26px 0 10px;
            font-size: 18px;
        }

        table {
            border-collapse: collapse;
        }

        th,
        td {
            padding: 6px 14px;
            border: 1px solid var(--line);
            text-align: left;
        }

        th {
            background: #f4f6f8;
        }

        .num {
            font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
            text-align: right;
        }

        .ok {
            color: var(--good);
            font-weight: 600;
        }

        .bad {
            color: var(--bad);
            font-weight: 600;
        }

        .hint {
            color: var(--muted);
            font-size: 14px;
        }

        @media (max-width: 720px) {
            main {
                margin: 0;
                padding: 20px 16px;
                border-radius: 0;
            }
        }

        /* Кольори, якими малює результат об’єкт завдання */
        :root {
            --v-text: var(--text);
            --v-muted: var(--muted);
            --v-line: #c9d1d8;
            --v-cell: #ffffff;
            --v-head: var(--muted);
            --v-mark: var(--accent);
            --v-mark-ink: var(--accent-ink);
            --v-soft: var(--accent-soft);
            --v-strong: var(--accent-text);
            --v-light: #ffffff;
            --v-dark: #6b7885;
            --v-mono: ui-monospace, "Cascadia Mono", Consolas, monospace;
        }

        .result {
            margin: 20px 0;
            overflow-x: auto;
        }

        .error {
            color: var(--bad);
            font-weight: 600;
        }

        .params code {
            font-size: 15px;
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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Календар</h1>
    <p>Побудувати місячний календар у вигляді таблиці (5 рядків, 7 стовпців). Як
початкові дані використати день тижня, на який припадає перше число місяця
(число від 1 до 7).</p>

    <div class="result">
<?php if ($result !== null) : ?>
        <?= $result ?>

<?php elseif ($error !== null) : ?>
        <p class="error"><?= htmlspecialchars($error) ?></p>
<?php else : ?>
        <p>Параметри в рядку браузера не задано.</p>
<?php endif; ?>
    </div>

    <h2>Параметри</h2>
    <ul class="params">
<?php foreach ($params as $name => $label) : ?>
        <li><code><?= $name ?></code> – <?= htmlspecialchars($label) ?></li>
<?php endforeach; ?>
    </ul>
    <p>Приклад: <a href="<?= htmlspecialchars($exampleUrl) ?>"><?= htmlspecialchars(urldecode($exampleUrl)) ?></a></p>
</main>
</body>
</html>
