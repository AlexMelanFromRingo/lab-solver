<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 4.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = (sin α + sin β)² + (cos α + cos β)²
 *     y₂ = 4·cos²((α − β) / 2)
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_ALPHA = 0.4745;
const GIVEN_BETA = 0.1634;

/**
 * Перший вираз.
 */
function y1(float $alpha, float $beta): float
{
    return (sin($alpha) + sin($beta)) ** 2
        + (cos($alpha) + cos($beta)) ** 2;
}

/**
 * Другий вираз.
 */
function y2(float $alpha, float $beta): float
{
    return 4 * cos(($alpha - $beta) / 2) ** 2;
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
    return [
        ['label' => 'sin α + sin β', 'value' => fmt(sin($alpha) + sin($beta))],
        ['label' => 'cos α + cos β', 'value' => fmt(cos($alpha) + cos($beta))],
        ['label' => 'cos(α − β)', 'value' => fmt(cos($alpha - $beta))],
        ['label' => '2 + 2·cos(α − β)', 'value' => fmt(2 + 2 * cos($alpha - $beta))],
        ['label' => '(α − β) / 2, рад', 'value' => fmt(($alpha - $beta) / 2)],
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
    <title>ЛР2 · програма № 1 · варіант 4</title>
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

<h1>Програма № 1. Основна тотожність і косинус різниці</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = (sin α + sin β)² + (cos α + cos β)²
y₂ = 4·cos²((α − β) / 2)</pre>

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
    2 + 2·cos(α − β) = 4·cos²((α − β) / 2)
</p>

<p>
    Розкриття дужок дає sin²α + cos²α = 1 та sin²β + cos²β = 1, а подвоєні добутки
        згортаються в косинус різниці. Далі працює формула половинного кута. Отже
        вираз залежить не від самих кутів, а лише від їхньої різниці – журнал це
        підтверджує: 2 + 2·cos(α − β) уже дорівнює відповіді.
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
