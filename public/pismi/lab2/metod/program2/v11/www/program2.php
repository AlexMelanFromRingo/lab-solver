<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Шахи.
 *
 * Побудувати на базі таблиці 8 × 8 чорно-білу дошку для гри в шахи.
 * Поставити короля, позначеного буквою K, у комірку з координатами, заданими
 * параметрами в рядку браузера.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Шахова дошка 8 × 8 з королем у заданій клітинці.
 */
class ChessBoard
{
    private const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    private int $file;
    private int $rank;

    /**
     * @param mixed $file вертикаль 1–8 (a–h)
     * @param mixed $rank горизонталь 1–8
     */
    public function __construct(mixed $file, mixed $rank)
    {
        $this->file = self::integer($file, 'Вертикаль (стовпець)');
        $this->rank = self::integer($rank, 'Горизонталь (рядок)');
    }

    /**
     * Назва клітинки в шаховій нотації, наприклад e1.
     */
    public function square(): string
    {
        return self::FILES[$this->file - 1] . $this->rank;
    }

    public function render(): string
    {
        $html = '<table class="board">';
        // Восьма горизонталь угорі, як на справжній дошці.
        for ($rank = 8; $rank >= 1; $rank--) {
            $html .= '<tr><th>' . $rank . '</th>';
            for ($file = 1; $file <= 8; $file++) {
                // Колір клітинки визначає парність суми координат: a1 — чорна.
                $colour = ($file + $rank) % 2 === 0 ? 'dark' : 'light';
                $king = $file === $this->file && $rank === $this->rank;
                $html .= '<td class="' . $colour . ($king ? ' king' : '') . '">'
                    . ($king ? 'K' : '') . '</td>';
            }
            $html .= '</tr>';
        }

        $html .= '<tr><th></th>';
        foreach (self::FILES as $name) {
            $html .= '<th>' . $name . '</th>';
        }

        return $html . '</tr></table><p class="caption">Король стоїть на полі '
            . $this->square() . ' (стовпець ' . $this->file . ', рядок ' . $this->rank . ').</p>';
    }

    private static function integer(mixed $value, string $what): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < 1 || $number > 8) {
            throw new InvalidArgumentException("$what: потрібне ціле число від 1 до 8.");
        }

        return $number;
    }
}

// Параметри з рядка браузера: координати клітинки короля.
$params = [
    'x' => 'стовпець (вертикаль a–h), 1–8',
    'y' => 'рядок (горизонталь), 1–8',
];
$example = ['x' => 5, 'y' => 1];

$result = null;
$error = null;

if (isset($_GET['x'], $_GET['y'])) {
    try {
        $board = new ChessBoard($_GET['x'], $_GET['y']);
        $result = $board->render();
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

        .board {
            border-collapse: collapse;
        }

        .board th {
            width: 26px;
            height: 26px;
            color: var(--v-head);
            font-weight: 400;
            font-size: 14px;
        }

        .board td {
            width: 52px;
            height: 52px;
            padding: 0;
            border: 1px solid var(--v-line);
            font-size: 26px;
            font-weight: 700;
            text-align: center;
        }

        .board .light {
            background: var(--v-light);
        }

        .board .dark {
            background: var(--v-dark);
        }

        .board .king {
            background: var(--v-mark);
            color: var(--v-mark-ink);
            box-shadow: inset 0 0 0 3px var(--v-light);
        }

        .caption {
            margin: 14px 0 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Побудувати на базі таблиці 8 × 8 чорно-білу дошку для гри в шахи. Поставити
короля, позначеного буквою K, у комірку з координатами, заданими параметрами
в рядку браузера.</p>

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
