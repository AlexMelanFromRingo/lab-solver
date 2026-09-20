<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 15.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class NetworkAddressTask
{
    public function title(): string
    {
        return 'Адреса мережі';
    }

    public function params(): array
    {
        return [
            'a1' => ['label' => 'IP байт 1', 'default' => '192'],
            'a2' => ['label' => 'IP байт 2', 'default' => '168'],
            'a3' => ['label' => 'IP байт 3', 'default' => '17'],
            'a4' => ['label' => 'IP байт 4', 'default' => '43'],
            'm1' => ['label' => 'Маска байт 1', 'default' => '255'],
            'm2' => ['label' => 'Маска байт 2', 'default' => '255'],
            'm3' => ['label' => 'Маска байт 3', 'default' => '240'],
            'm4' => ['label' => 'Маска байт 4', 'default' => '0'],
        ];
    }

    public function render(array $p): string
    {
        $address = [];
        $mask = [];
        foreach ([1, 2, 3, 4] as $i) {
            $address[] = $this->int($p, 'a' . $i, 0, 0, 255);
            $mask[] = $this->int($p, 'm' . $i, 0, 0, 255);
        }

        $network = [];
        foreach ($address as $i => $octet) {
            $network[] = $octet & $mask[$i];
        }

        return binary_rows([
            ['Адреса вузла', $address],
            ['Маска підмережі', $mask],
            ['Адреса мережі', $network, true],
        ]);
    }

    public function conclusion(): string
    {
        return 'Логічне «і» з маскою обнуляє саме ті розряди, у яких маска '
            . 'містить нулі, тому адреса мережі – це адреса вузла з '
            . 'відкинутим «хвостом». Операція виконується над кожним байтом '
            . 'окремо, але сенс має лише на всій адресі: межа мережі не '
            . 'зобов’язана збігатися з межею байта.';
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

$task = new NetworkAddressTask();
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
    <title>ЛР2 · програма № 2 · варіант 15</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('NetworkAddressTask') ?></code>.
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
