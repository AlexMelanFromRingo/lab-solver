<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = (sin 3a · cos³a + cos 3a · sin³a) / 3
 *     y₂ = sin 4a / 4
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     cos³a = (3·cos a + cos 3a) / 4
 *     sin³a = (3·sin a − sin 3a) / 4
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_A = -0.4224;

/**
 * Перший вираз.
 */
function y1(float $a): float
{
    return (sin(3 * $a) * cos($a) ** 3
        + cos(3 * $a) * sin($a) ** 3) / 3;
}

/**
 * Другий вираз.
 */
function y2(float $a): float
{
    return sin(4 * $a) / 4;
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
        ['label' => 'sin 3a', 'value' => fmt(sin(3 * $a))],
        ['label' => 'cos 3a', 'value' => fmt(cos(3 * $a))],
        ['label' => 'cos³a', 'value' => fmt(cos($a) ** 3)],
        ['label' => '(3·cos a + cos 3a) / 4', 'value' => fmt((3 * cos($a) + cos(3 * $a)) / 4)],
        ['label' => 'sin 3a·cos³a + cos 3a·sin³a', 'value' => fmt(sin(3 * $a) * cos($a) ** 3 + cos(3 * $a) * sin($a) ** 3)],
        ['label' => '0,75·sin 4a', 'value' => fmt(0.75 * sin(4 * $a))],
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
