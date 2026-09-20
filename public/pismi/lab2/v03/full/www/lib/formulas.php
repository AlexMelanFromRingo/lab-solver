<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = (1 − tg α · tg β) / (m − n)
 *     y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     m − n = 10·cos(α + β)·sin α
 *     m + n = 10·sin(α + β)·cos α
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
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
