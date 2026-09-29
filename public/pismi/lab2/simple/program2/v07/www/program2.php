<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Координати комірки.
 *
 * Виконати динамічну побудову таблиці. Число рядків та стовпців таблиці
 * задається першим і другим параметром у рядку браузера. Літерою X позначити
 * одну з комірок таблиці, координати якої задаються третім і четвертим
 * параметром.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Таблиця заданого розміру з позначеною коміркою.
 */
class CellTable
{
    /** Найбільша кількість рядків і стовпців, яку зручно показати на сторінці. */
    private const LIMIT = 20;

    private int $rows;
    private int $cols;
    private int $row;
    private int $col;

    /**
     * Значення приходять із рядка браузера як є, тому клас перевіряє їх сам.
     * Розміри перевіряються першими: від них залежать допустимі координати.
     */
    public function __construct(mixed $rows, mixed $cols, mixed $row, mixed $col)
    {
        $this->rows = self::integer($rows, 1, self::LIMIT, 'Кількість рядків');
        $this->cols = self::integer($cols, 1, self::LIMIT, 'Кількість стовпців');
        $this->row = self::integer($row, 1, $this->rows, 'Рядок комірки');
        $this->col = self::integer($col, 1, $this->cols, 'Стовпець комірки');
    }

    /**
     * HTML-таблиця: номери стовпців угорі, номери рядків ліворуч.
     */
    public function render(): string
    {
        $html = '<table class="cells"><tr><th></th>';
        for ($c = 1; $c <= $this->cols; $c++) {
            $html .= '<th>' . $c . '</th>';
        }
        $html .= '</tr>';

        for ($r = 1; $r <= $this->rows; $r++) {
            $html .= '<tr><th>' . $r . '</th>';
            for ($c = 1; $c <= $this->cols; $c++) {
                // Позначка ставиться там, де лічильники збігаються з координатами.
                if ($r === $this->row && $c === $this->col) {
                    $html .= '<td class="x">X</td>';
                } else {
                    $html .= '<td></td>';
                }
            }
            $html .= '</tr>';
        }

        return $html . '</table>'
            . '<p class="caption">Таблиця ' . $this->rows . ' × ' . $this->cols
            . ', літерою X позначено комірку в рядку ' . $this->row
            . ', стовпці ' . $this->col . '.</p>';
    }

    /**
     * Ціле число в заданих межах, інакше – виняток із поясненням.
     */
    private static function integer(mixed $value, int $min, int $max, string $what): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < $min || $number > $max) {
            throw new InvalidArgumentException("$what: потрібне ціле число від $min до $max.");
        }

        return $number;
    }
}

// Параметри з рядка браузера: 1-й і 2-й – розмір таблиці,
// 3-й і 4-й – координати комірки з позначкою X.
$params = [
    'rows' => 'кількість рядків',
    'cols' => 'кількість стовпців',
    'row' => 'рядок комірки з X',
    'col' => 'стовпець комірки з X',
];
$example = ['rows' => 6, 'cols' => 9, 'row' => 3, 'col' => 7];

$result = null;
$error = null;

if (isset($_GET['rows'], $_GET['cols'], $_GET['row'], $_GET['col'])) {
    try {
        $table = new CellTable($_GET['rows'], $_GET['cols'], $_GET['row'], $_GET['col']);
        $result = $table->render();
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

        .cells {
            border-collapse: collapse;
            font-family: var(--v-mono);
        }

        .cells th,
        .cells td {
            width: 38px;
            height: 38px;
            padding: 0;
            text-align: center;
        }

        .cells th {
            color: var(--v-head);
            font-size: 13px;
            font-weight: 400;
        }

        .cells td {
            border: 1px solid var(--v-line);
            background: var(--v-cell);
        }

        .cells td.x {
            background: var(--v-mark);
            color: var(--v-mark-ink);
            font-size: 18px;
            font-weight: 700;
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

    <h1>Програма № 2. Координати комірки</h1>
    <p>Виконати динамічну побудову таблиці. Число рядків та стовпців таблиці задається
першим і другим параметром у рядку браузера. Літерою X позначити одну з комірок
таблиці, координати якої задаються третім і четвертим параметром.</p>

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
