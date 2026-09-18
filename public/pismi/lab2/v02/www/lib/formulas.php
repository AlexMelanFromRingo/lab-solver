<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = a·cos x + b·sin x
 *     y₂ = A·sin(x + μ),   A = √(a² + b²),   μ = arcsin(a / √(a² + b²))
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     A·sin μ = a
 *     A·cos μ = b
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_A = 5.5;
const GIVEN_B = 12.7;
const GIVEN_X = 1.28;

/**
 * Перший вираз.
 */
function y1(float $a, float $b, float $x): float
{
    $amp = sqrt($a ** 2 + $b ** 2);
    $mu = asin($a / $amp);

    return $a * cos($x) + $b * sin($x);
}

/**
 * Другий вираз.
 */
function y2(float $a, float $b, float $x): float
{
    $amp = sqrt($a ** 2 + $b ** 2);
    $mu = asin($a / $amp);

    return $amp * sin($x + $mu);
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $a, float $b, float $x): array
{
    $amp = sqrt($a ** 2 + $b ** 2);
    $mu = asin($a / $amp);

    return [
        ['label' => 'A = √(a² + b²)', 'value' => fmt($amp)],
        ['label' => 'μ = arcsin(a / A), рад', 'value' => fmt($mu)],
        ['label' => 'A·sin μ (має дорівнювати a)', 'value' => fmt($amp * sin($mu))],
        ['label' => 'A·cos μ (має дорівнювати b)', 'value' => fmt($amp * cos($mu))],
        ['label' => 'x + μ, рад', 'value' => fmt($x + $mu)],
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
