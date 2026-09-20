<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1. Варіант 7.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються.
 *
 *     y₁ = 64·cos³(π/6 − α/2) · sin³(π/3 − α/2)
 *     y₂ = (sin(3a/2) / sin(a/2))³
 *
 * Файл самодостатній: обчислення, перевірка й показ – усе тут.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_A = 0.777;

/**
 * Перший вираз.
 */
function y1(float $a): float
{
    return 64 * cos(M_PI / 6 - $a / 2) ** 3
        * sin(M_PI / 3 - $a / 2) ** 3;
}

/**
 * Другий вираз.
 */
function y2(float $a): float
{
    return (sin(1.5 * $a) / sin($a / 2)) ** 3;
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $a): array
{
    return [
        ['label' => 'cos(π/6 − α/2)', 'value' => fmt(cos(M_PI / 6 - $a / 2))],
        ['label' => 'sin(π/3 − α/2)', 'value' => fmt(sin(M_PI / 3 - $a / 2))],
        ['label' => 'cos(π/6 + α/2) – той самий кут, записаний косинусом', 'value' => fmt(cos(M_PI / 6 + $a / 2))],
        ['label' => 'добуток косинусів різниці та суми', 'value' => fmt(cos(M_PI / 6 - $a / 2) * cos(M_PI / 6 + $a / 2))],
        ['label' => '3/4 − sin²(α/2)', 'value' => fmt(0.75 - sin($a / 2) ** 2)],
        ['label' => 'sin(3a/2) / sin(a/2)', 'value' => fmt(sin(1.5 * $a) / sin($a / 2))],
        ['label' => '4 · (3/4 − sin²(a/2))', 'value' => fmt(4 * (0.75 - sin($a / 2) ** 2))],
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

$a = GIVEN_A;

$first = y1($a);
$second = y2($a);
$matched = values_match($first, $second);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ЛР2 · програма № 1 · варіант 7</title>
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

<h1>Програма № 1. Добуток косинусів суми й різниці</h1>

<p>Обчислити два вирази й переконатися, що при заданих значеннях аргументів
вони дають однаковий результат.</p>

<pre>y₁ = 64·cos³(π/6 − α/2) · sin³(π/3 − α/2)
y₂ = (sin(3a/2) / sin(a/2))³</pre>

<p class="hint">де a = <?= h(fmt($a)) ?> – значення з умови варіанта</p>

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
    sin(π/3 − α/2) = cos(π/6 + α/2)<br>
        cos(A − B)·cos(A + B) = cos²A − sin²B<br>
        sin 3θ / sin θ = 3 − 4·sin²θ
</p>

<p>
    Синус у першому виразі переводиться в косинус додаткового кута, після чого
        добуток косинусів суми й різниці згортається у 3/4 − sin²(α/2). Відношення
        синусів у другому виразі дорівнює 3 − 4·sin²(a/2), тобто вчетверо більшій
        величині, а множник 64 = 4³ у першому виразі саме це й компенсує. Тому
        рівність виконується при будь-якому допустимому значенні.
</p>

<h2>Проміжні величини</h2>

<table>
    <?php foreach (trace_values($a) as $step): ?>
        <tr>
            <td><?= h($step['label']) ?></td>
            <td class="num"><?= h($step['value']) ?></td>
        </tr>
    <?php endforeach; ?>
</table>

<p class="hint"><a href="prog2.php">Програма № 2</a></p>

</body>
</html>
