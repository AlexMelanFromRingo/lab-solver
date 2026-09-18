<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = (1 + sin 2β) / (sin β + cos β) − (1 − tg²(β/2)) / (1 + tg²(β/2))
 *     y₂ = sin β
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     1 + sin 2β = (sin β + cos β)²
 *     (1 − tg²(β/2)) / (1 + tg²(β/2)) = cos β
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_BETA = -0.8985;

/**
 * Перший вираз.
 */
function y1(float $beta): float
{
    $t = tan($beta / 2);
    $first = (1 + sin(2 * $beta)) / (sin($beta) + cos($beta));
    $second = (1 - $t ** 2) / (1 + $t ** 2);

    return $first - $second;
}

/**
 * Другий вираз.
 */
function y2(float $beta): float
{
    return sin($beta);
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $beta): array
{
    return [
        ['label' => '1 + sin 2β', 'value' => fmt(1 + sin(2 * $beta))],
        ['label' => '(sin β + cos β)²', 'value' => fmt((sin($beta) + cos($beta)) ** 2)],
        ['label' => 'перший доданок', 'value' => fmt((1 + sin(2 * $beta)) / (sin($beta) + cos($beta)))],
        ['label' => 'tg(β/2)', 'value' => fmt(tan($beta / 2))],
        ['label' => 'другий доданок', 'value' => fmt((1 - tan($beta / 2) ** 2) / (1 + tan($beta / 2) ** 2))],
        ['label' => 'cos β', 'value' => fmt(cos($beta))],
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
