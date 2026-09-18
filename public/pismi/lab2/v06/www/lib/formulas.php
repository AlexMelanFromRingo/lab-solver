<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = sin²x / (sin x − cos x) − (sin x + cos x) / (tg²x − 1)
 *     y₂ = sin x + cos x
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     tg²x − 1 = (sin²x − cos²x) / cos²x
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_X = -0.55677;

/**
 * Перший вираз.
 */
function y1(float $x): float
{
    $second = (sin($x) + cos($x)) / (tan($x) ** 2 - 1);

    return sin($x) ** 2 / (sin($x) - cos($x)) - $second;
}

/**
 * Другий вираз.
 */
function y2(float $x): float
{
    return sin($x) + cos($x);
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
        ['label' => 'sin x − cos x', 'value' => fmt(sin($x) - cos($x))],
        ['label' => 'tg²x − 1', 'value' => fmt(tan($x) ** 2 - 1)],
        ['label' => 'другий доданок', 'value' => fmt((sin($x) + cos($x)) / (tan($x) ** 2 - 1))],
        ['label' => 'cos²x / (sin x − cos x)', 'value' => fmt(cos($x) ** 2 / (sin($x) - cos($x)))],
        ['label' => 'перший доданок', 'value' => fmt(sin($x) ** 2 / (sin($x) - cos($x)))],
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
