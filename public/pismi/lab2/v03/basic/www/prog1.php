<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 3.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = (1 − tg α · tg β) / (m − n)
 *     y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_ALPHA = 0.145;
const GIVEN_BETA = -0.734;

/**
 * Перший вираз.
 */
function y1(float $alpha, float $beta): float
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 - tan($alpha) * tan($beta)) / ($m - $n);
}

/**
 * Другий вираз.
 */
function y2(float $alpha, float $beta): float
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 + tan($beta) / tan($alpha)) / ($m + $n);
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $alpha, float $beta): array
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return [
        ['label' => 'm = 5·sin(2α + β)', 'value' => fmt($m)],
        ['label' => 'n = 5·sin β', 'value' => fmt($n)],
        ['label' => 'm − n', 'value' => fmt($m - $n)],
        ['label' => '10·cos(α + β)·sin α', 'value' => fmt(10 * cos($alpha + $beta) * sin($alpha))],
        ['label' => 'm + n', 'value' => fmt($m + $n)],
        ['label' => '10·sin(α + β)·cos α', 'value' => fmt(10 * sin($alpha + $beta) * cos($alpha))],
    ];
}

/**
 * Число для показу: дванадцять знаків після коми, без зайвих нулів.
 */
function fmt(float $value): string
{
    if ($value !== 0.0 && (abs($value) < 1e-6 || abs($value) >= 1e12)) {
        return sprintf('%.6e', $value);
    }

    return rtrim(rtrim(number_format($value, 12, '.', ''), '0'), '.') ?: '0';
}

/**
 * Чи збіглися значення.
 *
 * Обидва вирази рахуються в подвійній точності різними шляхами, тому збіг
 * до останнього біта не гарантований: порівнювати з нулем не можна. Допуск
 * береться пропорційним самій величині.
 */
function values_match(float $first, float $second): bool
{
    return abs($first - $second) <= 1e-9 * max(1.0, abs($first));
}


/** Екранування для виводу в HTML. */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$alpha = GIVEN_ALPHA;
$beta = GIVEN_BETA;

$first = y1($alpha, $beta);
$second = y2($alpha, $beta);
$matched = values_match($first, $second);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ЛР2 · програма № 1 · варіант 3</title>
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

<h1>Програма № 1. Формули суми та різниці синусів у знаменниках</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = (1 − tg α · tg β) / (m − n)
y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β</pre>

<p class="hint">де alpha = <?= h(fmt($alpha)) ?> · beta = <?= h(fmt($beta)) ?> – значення з умови варіанта</p>

<h2>Результат</h2>

<table>
    <tr><td>y₁</td><td class="num"><?= h(fmt($first)) ?></td></tr>
    <tr><td>y₂</td><td class="num"><?= h(fmt($second)) ?></td></tr>
</table>

<p class="<?= $matched ? 'ok' : 'err' ?>">
    <?php if ($matched): ?>
        Значення збіглися. Розбіжність <?= h(sprintf('%.2e', abs($first - $second))) ?>
        не перевищує похибки подвійної точності.
    <?php else: ?>
        Значення розійшлися на <?= h(sprintf('%.2e', abs($first - $second))) ?>.
    <?php endif; ?>
</p>

<h2>Чому вирази рівні</h2>

<p>
    m − n = 10·cos(α + β)·sin α<br>
        m + n = 10·sin(α + β)·cos α
</p>

<p>
    Обидва дроби після перетворень зводяться до одного й того самого виразу 1 /
        (10·sin α·cos α·cos β). У чисельниках згортаються тангенси, у знаменниках –
        різниця та сума синусів; журнал показує, що обчислені m − n і m + n збігаються
        з добутковою формою до останнього знака.
</p>

<h2>Проміжні величини</h2>

<table>
    <?php foreach (trace_values($alpha, $beta) as $step): ?>
        <tr>
            <td><?= h($step['label']) ?></td>
            <td class="num"><?= h($step['value']) ?></td>
        </tr>
    <?php endforeach; ?>
</table>

<p class="hint"><a href="prog2.php">Програма № 2</a></p>

</body>
</html>
