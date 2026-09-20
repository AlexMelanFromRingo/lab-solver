<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 11.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = t·(1 + 2/√(t+4)) / (2 − √(t+4)) + √(t+4) + 4/√(t+4) + t
 *     y₂ = t − 4
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_T = -3.57;

/**
 * Перший вираз.
 */
function y1(float $t): float
{
    $u = sqrt($t + 4);
    $first = $t * (1 + 2 / $u) / (2 - $u);

    return $first + $u + 4 / $u + $t;
}

/**
 * Другий вираз.
 */
function y2(float $t): float
{
    return $t - 4;
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $t): array
{
    return [
        ['label' => 'u = √(t + 4)', 'value' => fmt(sqrt($t + 4))],
        ['label' => 'u² − 4 (має дорівнювати t)', 'value' => fmt(sqrt($t + 4) ** 2 - 4)],
        ['label' => 'перший доданок', 'value' => fmt($t * (1 + 2 / sqrt($t + 4)) / (2 - sqrt($t + 4)))],
        ['label' => '−(u + 2)² / u', 'value' => fmt(-((sqrt($t + 4) + 2) ** 2) / sqrt($t + 4))],
        ['label' => '√(t + 4) + 4/√(t + 4)', 'value' => fmt(sqrt($t + 4) + 4 / sqrt($t + 4))],
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

$t = GIVEN_T;

$first = y1($t);
$second = y2($t);
$matched = values_match($first, $second);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ЛР2 · програма № 1 · варіант 11</title>
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

<h1>Програма № 1. Заміна змінної під коренем</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = t·(1 + 2/√(t+4)) / (2 − √(t+4)) + √(t+4) + 4/√(t+4) + t
y₂ = t − 4</pre>

<p class="hint">де t = <?= h(fmt($t)) ?> – значення з умови варіанта</p>

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
    при u = √(t + 4):   t = u² − 4 = (u − 2)(u + 2)
</p>

<p>
    Заміна u = √(t + 4) робить перший доданок раціональним: t розкладається на (u
        − 2)(u + 2), множник (u − 2) скорочується зі знаменником (2 − u) і дає знак
        мінус. Журнал підтверджує, що доданок дорівнює −(u + 2)²/u, тобто −u − 4 −
        4/u. Доданки з u і 4/u його гасять, лишається t − 4.
</p>

<h2>Проміжні величини</h2>

<table>
    <?php foreach (trace_values($t) as $step): ?>
        <tr>
            <td><?= h($step['label']) ?></td>
            <td class="num"><?= h($step['value']) ?></td>
        </tr>
    <?php endforeach; ?>
</table>

<p class="hint"><a href="prog2.php">Програма № 2</a></p>

</body>
</html>
