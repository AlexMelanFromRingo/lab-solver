<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 12.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class JackHouseTask
{
    /**
     * Ланки лічилки: перша частина називає предмет, друга продовжує ланцюг.
     * Верхня ланка приєднує до себе всі попередні, тому куплет складається
     * сам, без переписування тексту.
     */
    private const LINKS = [
        ['дім', 'який збудував Джек'],
        ['пшениця', 'яка в темній комірчині зберігається в домі'],
        ['весела синиця', 'яка часто краде пшеницю'],
        ['кіт', 'який лякає й ловить синицю'],
        ['пес без хвоста', 'який за комір термосить кота'],
    ];

    public function title(): string
    {
        return 'Будинок, що збудував Джек';
    }

    public function params(): array
    {
        return [
            'verses' => ['label' => 'Скільки куплетів', 'default' => '3'],
            'align' => ['label' => 'Вирівнювання', 'default' => 'justify'],
        ];
    }

    public function render(array $p): string
    {
        $verses = $this->int($p, 'verses', 3, 1, count(self::LINKS));
        $align = (string) ($p['align'] ?? 'justify');
        $allowed = ['left' => 'за лівим краєм', 'center' => 'по центру',
                    'right' => 'за правим краєм', 'justify' => 'за шириною'];
        if (!isset($allowed[$align])) {
            $align = 'justify';
        }

        $out = '';
        for ($k = 0; $k < $verses; $k++) {
            $parts = [self::LINKS[$k][0] . ', ' . self::LINKS[$k][1]];
            for ($j = $k - 1; $j >= 0; $j--) {
                $parts[] = self::LINKS[$j][1];
            }
            $out .= '<p style="text-align: ' . h($align) . '">Ось '
                . h(implode(', ', $parts)) . '.</p>';
        }

        return $out . '<p class="hint">Вирівнювання: ' . h($allowed[$align]) . '.</p>';
    }

    public function conclusion(): string
    {
        return 'Текст лічилки не зберігається куплетами – зберігаються лише '
            . 'ланки. Кожен наступний куплет дописує до себе всі попередні у '
            . 'зворотному порядку, тому додати шосту ланку означає дописати '
            . 'один рядок даних, а не новий абзац. Вирівнювання приходить '
            . 'останнім параметром і впливає лише на подання.';
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

$task = new JackHouseTask();
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
    <title>ЛР2 · програма № 2 · варіант 12</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('JackHouseTask') ?></code>.
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
