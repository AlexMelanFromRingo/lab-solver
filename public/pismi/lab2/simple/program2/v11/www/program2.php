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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Шахи</h1>
    <p>Побудувати на базі таблиці 8 × 8 чорно-білу дошку для гри в шахи. Поставити
короля, позначеного буквою K, у комірку з координатами, заданими параметрами
в рядку браузера.</p>

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
