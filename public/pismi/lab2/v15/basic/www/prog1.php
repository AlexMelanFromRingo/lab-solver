<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 15.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = (1 − sin²(3π/2 + x)) / (1 − sin²(π + x))
 *     y₂ = tg²x
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_X = -0.789;

/**
 * Перший вираз.
 */
function y1(float $x): float
{
    $top = 1 - sin(3 * M_PI / 2 + $x) ** 2;
    $bottom = 1 - sin(M_PI + $x) ** 2;

    return $top / $bottom;
}

/**
 * Другий вираз.
 */
function y2(float $x): float
{
    return tan($x) ** 2;
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $x): array
{
    return [
        ['label' => 'sin(3π/2 + x)', 'value' => fmt(sin(3 * M_PI / 2 + $x))],
        ['label' => '−cos x', 'value' => fmt(-cos($x))],
        ['label' => 'чисельник 1 − sin²(3π/2 + x)', 'value' => fmt(1 - sin(3 * M_PI / 2 + $x) ** 2)],
        ['label' => 'sin²x', 'value' => fmt(sin($x) ** 2)],
        ['label' => 'sin(π + x)', 'value' => fmt(sin(M_PI + $x))],
        ['label' => 'знаменник 1 − sin²(π + x)', 'value' => fmt(1 - sin(M_PI + $x) ** 2)],
        ['label' => 'cos²x', 'value' => fmt(cos($x) ** 2)],
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

$x = GIVEN_X;

$first = y1($x);
$second = y2($x);
$matched = values_match($first, $second);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ЛР2 · програма № 1 · варіант 15</title>
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

<h1>Програма № 1. Формули зведення</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = (1 − sin²(3π/2 + x)) / (1 − sin²(π + x))
y₂ = tg²x</pre>

<p class="hint">де x = <?= h(fmt($x)) ?> – значення з умови варіанта</p>

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
    sin(3π/2 + x) = −cos x<br>
        sin(π + x) = −sin x
</p>

<p>
    Обидві формули зведення змінюють знак функції, але у вираз вони входять у
        квадраті, тому знак ролі не грає. Чисельник перетворюється на sin²x, знаменник
        – на cos²x, і дріб дає квадрат тангенса. Журнал наводить зведені значення
        поряд із вихідними, щоб було видно саме рівність квадратів, а не самих
        функцій.
</p>

<h2>Проміжні величини</h2>

<table>
    <?php foreach (trace_values($x) as $step): ?>
        <tr>
            <td><?= h($step['label']) ?></td>
            <td class="num"><?= h($step['value']) ?></td>
        </tr>
    <?php endforeach; ?>
</table>

<p class="hint"><a href="prog2.php">Програма № 2</a></p>

</body>
</html>
