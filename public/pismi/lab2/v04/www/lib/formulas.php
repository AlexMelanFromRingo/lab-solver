<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = (sin α + sin β)² + (cos α + cos β)²
 *     y₂ = 4·cos²((α − β) / 2)
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     2 + 2·cos(α − β) = 4·cos²((α − β) / 2)
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
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
