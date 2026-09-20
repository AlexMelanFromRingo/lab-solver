<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 10.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = ((x − 1)(x^1,5 − 1)) / ((x + √x + 1)(x^0,5 + 1)) + 2 / x^(−0,5)
 *     y₂ = x + 1
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_X = 5.55;

/**
 * Перший вираз.
 */
function y1(float $x): float
{
    $r = sqrt($x);
    $frac = (($x - 1) * ($x ** 1.5 - 1)) / (($x + $r + 1) * ($r + 1));

    return $frac + 2 / $x ** -0.5;
}

/**
 * Другий вираз.
 */
function y2(float $x): float
{
    return $x + 1;
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
        ['label' => '√x', 'value' => fmt(sqrt($x))],
        ['label' => 'x^1,5 − 1', 'value' => fmt($x ** 1.5 - 1)],
        ['label' => '(√x − 1)(x + √x + 1)', 'value' => fmt((sqrt($x) - 1) * ($x + sqrt($x) + 1))],
        ['label' => 'дріб', 'value' => fmt((($x - 1) * ($x ** 1.5 - 1)) / (($x + sqrt($x) + 1) * (sqrt($x) + 1)))],
        ['label' => '(√x − 1)²', 'value' => fmt((sqrt($x) - 1) ** 2)],
        ['label' => '2 / x^(−0,5) = 2√x', 'value' => fmt(2 / $x ** -0.5)],
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
    <title>ЛР2 · програма № 1 · варіант 10</title>
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

<h1>Програма № 1. Різниця кубів під коренем</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = ((x − 1)(x^1,5 − 1)) / ((x + √x + 1)(x^0,5 + 1)) + 2 / x^(−0,5)
y₂ = x + 1</pre>

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
    x^1,5 − 1 = (√x − 1)(x + √x + 1)<br>
        x − 1 = (√x − 1)(√x + 1)
</p>

<p>
    Заміна √x = t перетворює чисельник на різницю кубів і різницю квадратів, після
        скорочення лишається (√x − 1)² = x − 2√x + 1. Журнал показує це проміжне
        значення. Від’ємний показник у другому доданку означає ділення на 1/√x, тобто
        множення на 2√x, і саме цей доданок гасить −2√x.
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
