<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 11.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class ChessboardTask
{
    public function title(): string
    {
        return 'Шахи';
    }

    public function params(): array
    {
        return [
            'col' => ['label' => 'Вертикаль короля (1–8)', 'default' => '5'],
            'row' => ['label' => 'Горизонталь короля (1–8)', 'default' => '1'],
        ];
    }

    public function render(array $p): string
    {
        $col = $this->int($p, 'col', 5, 1, 8);
        $row = $this->int($p, 'row', 1, 1, 8);
        $files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        $body = '';
        // Восьма горизонталь угорі, як на шаховій дошці.
        for ($r = 8; $r >= 1; $r--) {
            $body .= '<tr><td class="axis">' . $r . '</td>';
            for ($c = 1; $c <= 8; $c++) {
                $light = ($r + $c) % 2 === 0;
                $king = $c === $col && $r === $row;
                $style = $light
                    ? 'background: rgba(230, 240, 248, 0.10)'
                    : 'background: rgba(0, 0, 0, 0.30)';
                $body .= '<td style="' . $style . '"'
                    . ($king ? ' class="marked"' : '') . '>'
                    . ($king ? 'K' : '') . '</td>';
            }
            $body .= '</tr>';
        }

        $footer = '<tr><td class="axis"></td>';
        foreach ($files as $file) {
            $footer .= '<td class="axis">' . $file . '</td>';
        }
        $footer .= '</tr>';

        return sprintf(
            '<p class="hint">Король стоїть на полі %s%d.</p>',
            $files[$col - 1],
            $row
        ) . '<table class="canvas"><tbody>' . $body . $footer . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Колір поля визначається парністю суми координат – одна умова '
            . 'замість шістдесяти чотирьох окремих комірок. Нумерація '
            . 'горизонталей іде згори вниз, тому зовнішній цикл рахує у '
            . 'зворотному напрямку: інакше дошка вийшла б перевернутою '
            . 'відносно звичного запису.';
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

$task = new ChessboardTask();
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
    <title>ЛР2 · програма № 2 · варіант 11</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('ChessboardTask') ?></code>.
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
