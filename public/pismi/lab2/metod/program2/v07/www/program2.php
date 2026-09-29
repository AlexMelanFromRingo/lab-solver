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
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Виконати динамічну побудову таблиці. Число рядків та стовпців таблиці задається
першим і другим параметром у рядку браузера. Літерою X позначити одну з комірок
таблиці, координати якої задаються третім і четвертим параметром.</p>

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
