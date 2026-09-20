<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 5.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class DigitTableTask
{
    public function title(): string
    {
        return 'Таблиця за цифрами числа';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Десяткове число', 'default' => '385617'],
        ];
    }

    public function render(array $p): string
    {
        $digits = preg_replace('/\D/', '', (string) ($p['value'] ?? '385617')) ?: '385617';
        $odd = [];
        $even = [];
        foreach (str_split($digits) as $digit) {
            if ((int) $digit % 2 === 0) {
                $even[] = $digit;
            } else {
                $odd[] = $digit;
            }
        }

        $rows = max(1, min(12, count($odd)));
        $cols = max(1, min(12, count($even)));

        $body = '';
        for ($r = 1; $r <= $rows; $r++) {
            $body .= '<tr>';
            for ($c = 1; $c <= $cols; $c++) {
                $body .= '<td>' . $r . '·' . $c . '</td>';
            }
            $body .= '</tr>';
        }

        return sprintf(
            '<p class="hint">Непарні цифри числа %s – %s, їх %d, це число рядків. '
            . 'Парні – %s, їх %d, це число стовпців.</p>',
            h($digits),
            h(implode(', ', $odd) ?: 'відсутні'),
            $rows,
            h(implode(', ', $even) ?: 'відсутні'),
            $cols
        ) . '<table class="canvas"><tbody>' . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Розмір таблиці не задано явно – його доводиться видобувати з '
            . 'числа, розібравши його на цифри та розсортувавши за парністю. '
            . 'Це типова для web задача: дані приходять рядком, і програма '
            . 'спершу має перетворити їх на щось придатне для побудови '
            . 'розмітки, не довіряючи вхідному значенню.';
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

$task = new DigitTableTask();
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
    <title>ЛР2 · програма № 2 · варіант 5</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('DigitTableTask') ?></code>.
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
