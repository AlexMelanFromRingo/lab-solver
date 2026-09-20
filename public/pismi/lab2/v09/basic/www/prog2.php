<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 9.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class TextPyramidTask
{
    public function title(): string
    {
        return 'Текстова піраміда';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, рядів', 'default' => '6'],
            'block' => ['label' => 'Ширина блока, символів', 'default' => '8'],
            'word' => ['label' => 'Слово-заповнювач', 'default' => 'камінь'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 6, 1, 14);
        $block = $this->int($p, 'block', 8, 3, 16);
        $word = trim((string) ($p['word'] ?? 'камінь')) ?: 'камінь';

        $cell = mb_substr(str_repeat($word, $block), 0, $block);
        $rows = '';
        for ($level = 1; $level <= $height; $level++) {
            $rows .= '<tr>';
            for ($i = 0; $i < $level; $i++) {
                $rows .= '<td style="width: auto; padding: 0 0.5rem">' . h($cell) . '</td>';
            }
            $rows .= '</tr>';
        }

        return '<table class="canvas" style="margin-left: auto; margin-right: auto">'
            . '<tbody>' . $rows . '</tbody></table>'
            . sprintf(
                '<p class="hint">Висота %d рядів, у блоці %d символів слова «%s».</p>',
                $height,
                $block,
                h($word)
            );
    }

    public function conclusion(): string
    {
        return 'Піраміда будується вкладеними циклами, де внутрішній '
            . 'виконується стільки разів, який зараз рівень. Слово-заповнювач '
            . 'підрізається до заданої ширини, тому блоки лишаються '
            . 'однаковими незалежно від того, довше слово за блок чи коротше.';
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

$task = new TextPyramidTask();
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
    <title>ЛР2 · програма № 2 · варіант 9</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('TextPyramidTask') ?></code>.
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
