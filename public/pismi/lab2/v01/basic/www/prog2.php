<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2. Варіант 1.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
 * тому вся робота – у класі нижче, а сторінка лише передає йому параметри
 * з рядка браузера й показує повернуту розмітку.
 *
 * Файл самодостатній: клас, помічники й показ – усе тут.
 */

final class NodeAddressTask
{
    public function title(): string
    {
        return 'Адреса вузла';
    }

    public function params(): array
    {
        return [
            'o1' => ['label' => 'Байт 1', 'default' => '192'],
            'o2' => ['label' => 'Байт 2', 'default' => '168'],
            'o3' => ['label' => 'Байт 3', 'default' => '0'],
            'o4' => ['label' => 'Байт 4', 'default' => '0'],
            'prefix' => ['label' => 'Префікс', 'default' => '16'],
        ];
    }

    public function render(array $p): string
    {
        $address = [];
        foreach (['o1', 'o2', 'o3', 'o4'] as $key) {
            $address[] = $this->int($p, $key, 0, 0, 255);
        }
        $prefix = $this->int($p, 'prefix', 16, 0, 32);

        $mask = mask_octets($prefix);
        // Адреса вузла – це те, що лишається від адреси після зняття
        // мережевої частини: логічне «і» з інверсією маски.
        $host = [];
        foreach ($address as $i => $octet) {
            $host[] = $octet & ~$mask[$i] & 0xFF;
        }

        return binary_rows([
            ['Адреса мережі', $address],
            ['Маска /' . $prefix, $mask],
            ['НЕ маска', array_map(static fn (int $o): int => ~$o & 0xFF, $mask)],
            ['Адреса вузла', $host, true],
        ]);
    }

    public function conclusion(): string
    {
        return 'Мережева й вузлова частини адреси розділяються не '
            . 'арифметично, а порозрядно: маска лишає мережу, її інверсія – '
            . 'вузол. У двійковому поданні це видно як точну межу між '
            . 'одиницями та нулями маски, і саме на цій межі обривається '
            . 'збережена частина адреси.';
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

$task = new NodeAddressTask();
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
    <title>ЛР2 · програма № 2 · варіант 1</title>
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

<p>Завдання виконує об’єкт класу <code><?= h('NodeAddressTask') ?></code>.
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
