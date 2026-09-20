<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = ln x·lg x + lg x·log₂x + log₂x·ln x
 *     y₂ = (ln x · lg x · log₂x) / log₂₀ₑ x
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     ln 20 = ln 2 + ln 10
 *     log₂₀ₑ x = ln x / (ln 20 + 1),   бо ln e = 1
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_X = 5.0;

/**
 * Перший вираз.
 */
function y1(float $x): float
{
    $base = 2 * 10 * M_E;

    return log($x) * log10($x)
        + log10($x) * log($x, 2)
        + log($x, 2) * log($x);
}

/**
 * Другий вираз.
 */
function y2(float $x): float
{
    $base = 2 * 10 * M_E;

    return (log($x) * log10($x) * log($x, 2)) / log($x, $base);
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
    $base = 2 * 10 * M_E;

    return [
        ['label' => 'ln x', 'value' => fmt(log($x))],
        ['label' => 'lg x', 'value' => fmt(log10($x))],
        ['label' => 'log₂ x', 'value' => fmt(log($x, 2))],
        ['label' => 'основа 2·10·e', 'value' => fmt($base)],
        ['label' => 'log₂₀ₑ x', 'value' => fmt(log($x, $base))],
        ['label' => 'ln 2 + ln 10 + 1', 'value' => fmt(log(2) + log(10) + 1)],
        ['label' => 'ln(20·e)', 'value' => fmt(log($base))],
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
