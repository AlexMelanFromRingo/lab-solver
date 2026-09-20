<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 3.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class NumberBaseTask
{
    public function title(): string
    {
        return 'Система обчислення';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Число', 'default' => '2026'],
            'base' => ['label' => 'Основа (10, 2 або 16)', 'default' => '16'],
        ];
    }

    public function render(array $p): string
    {
        $value = $this->int($p, 'value', 0, 0, PHP_INT_MAX);
        $base = $this->int($p, 'base', 10, 2, 16);
        $supported = [2 => 'двійкова', 10 => 'десяткова', 16 => 'шістнадцяткова'];

        if (!isset($supported[$base])) {
            return '<p class="errors">Передбачено лише основи 2, 10 та 16.</p>';
        }

        $rows = '';
        foreach ($supported as $b => $name) {
            $digits = strtoupper(base_convert((string) $value, 10, $b));
            $current = $b === $base;
            $rows .= sprintf(
                '<tr><td>%s</td><td class="num">%d</td><td class="num"%s>%s</td></tr>',
                h($name),
                $b,
                $current ? ' style="color: var(--accent)"' : '',
                h($digits)
            );
        }

        return '<table class="data"><thead><tr><th>Система</th>'
            . '<th class="num">Основа</th><th class="num">Запис</th></tr></thead>'
            . '<tbody>' . $rows . '</tbody></table>'
            . '<p class="hint">Виділено систему, задану другим параметром.</p>';
    }

    public function conclusion(): string
    {
        return 'Число не змінюється від того, у якій системі його записано: '
            . 'змінюється лише форма запису. Основа задає, скільки різних '
            . 'цифр доступно й якою є вага розряду, тому одне й те саме '
            . 'значення виглядає то довгим ланцюжком нулів та одиниць, то '
            . 'кількома шістнадцятковими цифрами.';
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

$task = new NumberBaseTask();
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
    <title>ЛР2 · програма № 2 · варіант 3</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('NumberBaseTask') ?></code>.
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
