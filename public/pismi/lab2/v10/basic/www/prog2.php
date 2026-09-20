<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 10.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class PicturePyramidTask
{
    public function title(): string
    {
        return 'Піраміда рисунків';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, рядів', 'default' => '5'],
            'size' => ['label' => 'Сторона блока, пікселів', 'default' => '48'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 5, 1, 10);
        $size = $this->int($p, 'size', 48, 12, 96);

        $brick = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 24 24" aria-hidden="true">'
            . '<rect x="1" y="1" width="22" height="22" rx="2" fill="var(--accent-soft)" '
            . 'stroke="var(--accent)" stroke-width="1"/>'
            . '<path d="M1 12h22M12 1v22" stroke="var(--accent)" stroke-width="0.6" opacity="0.5"/>'
            . '</svg>',
            $size,
            $size
        );

        $rows = '';
        for ($level = 1; $level <= $height; $level++) {
            $rows .= '<div class="bricks__row">' . str_repeat($brick, $level) . '</div>';
        }

        return '<div class="bricks">' . $rows . '</div>'
            . sprintf(
                '<p class="hint">Висота %d рядів, сторона блока %d пікселів, '
                . 'усього %d рисунків.</p>',
                $height,
                $size,
                $height * ($height + 1) / 2
            );
    }

    public function conclusion(): string
    {
        return 'Замість готових файлів використано вбудовану векторну '
            . 'графіку: розмір блока задається параметром, а рисунок '
            . 'масштабується без втрати якості. Загальна кількість блоків '
            . 'дорівнює сумі арифметичної прогресії, тому її можна не '
            . 'рахувати циклом.';
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

$task = new PicturePyramidTask();
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
    <title>ЛР2 · програма № 2 · варіант 10</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('PicturePyramidTask') ?></code>.
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
