<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = (1 − sin²(3π/2 + x)) / (1 − sin²(π + x))
 *     y₂ = tg²x
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     sin(3π/2 + x) = −cos x
 *     sin(π + x) = −sin x
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
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
