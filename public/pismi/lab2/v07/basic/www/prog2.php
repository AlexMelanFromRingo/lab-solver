<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 7.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class CellCoordinatesTask
{
    public function title(): string
    {
        return 'Координати комірки';
    }

    public function params(): array
    {
        return [
            'rows' => ['label' => 'Рядків', 'default' => '6'],
            'cols' => ['label' => 'Стовпців', 'default' => '9'],
            'row' => ['label' => 'Рядок комірки', 'default' => '3'],
            'col' => ['label' => 'Стовпець комірки', 'default' => '7'],
        ];
    }

    public function render(array $p): string
    {
        $rows = $this->int($p, 'rows', 6, 1, 20);
        $cols = $this->int($p, 'cols', 9, 1, 20);
        // Позначена комірка не може опинитися поза таблицею, тому її
        // координати затискаються вже за відомими розмірами.
        $row = $this->int($p, 'row', 3, 1, $rows);
        $col = $this->int($p, 'col', 7, 1, $cols);

        $head = '<tr><td class="axis"></td>';
        for ($c = 1; $c <= $cols; $c++) {
            $head .= '<td class="axis">' . $c . '</td>';
        }
        $head .= '</tr>';

        $body = '';
        for ($r = 1; $r <= $rows; $r++) {
            $body .= '<tr><td class="axis">' . $r . '</td>';
            for ($c = 1; $c <= $cols; $c++) {
                $marked = $r === $row && $c === $col;
                $body .= '<td' . ($marked ? ' class="marked"' : '') . '>'
                    . ($marked ? 'X' : '') . '</td>';
            }
            $body .= '</tr>';
        }

        return sprintf(
            '<p class="hint">Таблиця %d × %d, позначено комірку (%d; %d).</p>',
            $rows,
            $cols,
            $row,
            $col
        ) . '<table class="canvas"><tbody>' . $head . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Таблиця будується двома вкладеними циклами, а позначена '
            . 'комірка визначається не окремою гілкою розмітки, а збігом '
            . 'лічильників із заданими координатами. Через це розмір таблиці '
            . 'і положення позначки незалежні: змінюється будь-що з них, а '
            . 'код лишається тим самим. Координати обов’язково затискаються в '
            . 'межі таблиці – інакше параметр із рядка браузера міг би '
            . 'вказати на комірку, якої немає.';
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

$task = new CellCoordinatesTask();
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
    <title>ЛР2 · програма № 2 · варіант 7</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('CellCoordinatesTask') ?></code>.
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
