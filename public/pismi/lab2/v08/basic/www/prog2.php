<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 8.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class PictureAreaTask
{
    public function title(): string
    {
        return 'Площа картинки';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, пікселів', 'default' => '180'],
            'width' => ['label' => 'Ширина, пікселів', 'default' => '320'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 180, 20, 600);
        $width = $this->int($p, 'width', 320, 20, 900);
        $area = $height * $width;

        $picture = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 %d %d" role="img" '
            . 'aria-label="Зразок картинки" style="border: 1px solid var(--hairline)">'
            . '<rect width="%d" height="%d" fill="rgba(0,0,0,0.25)"/>'
            . '<path d="M0 %d L%d %d L%d %d L%d %d Z" fill="var(--accent-soft)"/>'
            . '<circle cx="%d" cy="%d" r="%d" fill="var(--accent)" opacity="0.7"/>'
            . '</svg>',
            $width,
            $height,
            $width,
            $height,
            $width,
            $height,
            (int) ($height * 0.75),
            (int) ($width * 0.35),
            (int) ($height * 0.45),
            (int) ($width * 0.7),
            (int) ($height * 0.8),
            $width,
            $height,
            (int) ($width * 0.78),
            (int) ($height * 0.28),
            (int) min($width, $height) / 8
        );

        return $picture
            . '<div class="facts">'
            . '<div><div class="facts__label">Висота</div><div class="facts__value">'
            . $height . ' px</div></div>'
            . '<div><div class="facts__label">Ширина</div><div class="facts__value">'
            . $width . ' px</div></div>'
            . '<div><div class="facts__label">Площа</div><div class="facts__value">'
            . number_format($area, 0, '.', ' ') . ' px²</div></div>'
            . '</div>';
    }

    public function conclusion(): string
    {
        return 'Розміри картинки задаються параметрами запиту й потрапляють '
            . 'одразу в два місця: в атрибути зображення та в розрахунок '
            . 'площі. Обчислення тривіальне, а от перевірка меж – ні: без неї '
            . 'параметр із рядка браузера здатен намалювати зображення '
            . 'завбільшки з екран або взагалі нульове.';
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

$task = new PictureAreaTask();
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
    <title>ЛР2 · програма № 2 · варіант 8</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('PictureAreaTask') ?></code>.
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
