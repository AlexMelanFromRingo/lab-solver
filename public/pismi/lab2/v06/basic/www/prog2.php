<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 6.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class SpelledNumberTask
{
    public function title(): string
    {
        return 'Текстове число';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Число від 0,0 до 9,9', 'default' => '3.3'],
        ];
    }

    public function render(array $p): string
    {
        $raw = str_replace(',', '.', (string) ($p['value'] ?? '3.3'));
        $value = is_numeric($raw) ? (float) $raw : 3.3;
        $value = max(0.0, min(9.9, $value));

        $whole = (int) floor($value);
        $tenth = (int) round(($value - $whole) * 10);

        $units = ['нуль', 'одна', 'дві', 'три', 'чотири', 'п’ять', 'шість',
                  'сім', 'вісім', 'дев’ять'];
        $words = sprintf(
            '%s %s %s %s',
            $units[$whole],
            $this->plural($whole, 'ціла', 'цілих', 'цілих'),
            $units[$tenth],
            $this->plural($tenth, 'десята', 'десятих', 'десятих')
        );

        return '<div class="facts__value">' . h(mb_strtolower($words)) . '</div>'
            . sprintf(
                '<p class="hint">Розкладено на частини: ціла – %d, дробова – %d десятих.</p>',
                $whole,
                $tenth
            );
    }

    private function plural(int $count, string $one, string $few, string $many): string
    {
        if ($count === 1) {
            return $one;
        }

        return $count >= 2 && $count <= 4 ? $few : $many;
    }

    public function conclusion(): string
    {
        return 'Переведення числа в текст спирається не на саме число, а на '
            . 'його розряди: ціла частина й десяті озвучуються окремо, а '
            . 'форма слова залежить від останньої цифри. Тому програма '
            . 'спершу розкладає число, і лише потім добирає слова.';
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

$task = new SpelledNumberTask();
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
    <title>ЛР2 · програма № 2 · варіант 6</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('SpelledNumberTask') ?></code>.
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
