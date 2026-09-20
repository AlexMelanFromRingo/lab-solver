<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 4.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class CalendarTask
{
    public function title(): string
    {
        return 'Календар';
    }

    public function params(): array
    {
        return [
            'first' => ['label' => 'День тижня 1-го числа (1–7)', 'default' => '4'],
            'days' => ['label' => 'Днів у місяці', 'default' => '30'],
        ];
    }

    public function render(array $p): string
    {
        $first = $this->int($p, 'first', 1, 1, 7);
        $days = $this->int($p, 'days', 30, 28, 31);
        $names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

        $cells = array_fill(0, 35, '');
        for ($day = 1; $day <= $days; $day++) {
            $index = $first - 2 + $day;
            if ($index >= 0 && $index < 35) {
                $cells[$index] = (string) $day;
            }
        }

        $head = '';
        foreach ($names as $i => $name) {
            $weekend = $i >= 5 ? ' style="color: var(--accent)"' : '';
            $head .= '<th' . $weekend . '>' . $name . '</th>';
        }

        $body = '';
        for ($row = 0; $row < 5; $row++) {
            $body .= '<tr>';
            for ($col = 0; $col < 7; $col++) {
                $body .= '<td>' . h($cells[$row * 7 + $col]) . '</td>';
            }
            $body .= '</tr>';
        }

        return '<table class="canvas"><thead><tr>' . $head . '</tr></thead>'
            . '<tbody>' . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Календар не потребує ні дати, ні назви місяця: досить знати, '
            . 'на який день тижня припадає перше число й скільки днів у '
            . 'місяці. Решта – зсув: номер дня перетворюється на номер '
            . 'комірки додаванням сталої, а таблиця 5 × 7 вміщує будь-який '
            . 'місяць, який починається не пізніше неділі.';
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

$task = new CalendarTask();
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
    <title>ЛР2 · програма № 2 · варіант 4</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('CalendarTask') ?></code>.
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
