<?php

declare(strict_types=1);

/**
 * Програма № 1. Обчислення функцій за індивідуальним завданням.
 *
 * За умовою варіанта треба обчислити два вирази й переконатися, що при
 * заданих значеннях вони дають однаковий результат:
 *
 *     y₁ = √((1 − cos α)/(1 + cos α)) − √((1 + cos α)/(1 − cos α))
 *     y₂ = 2 / tg α
 *
 * Рівність не випадкова – за нею стоїть перетворення:
 *
 *     √((1 − cos α)/(1 + cos α)) = |tg(α/2)|
 *     ctg(α/2) − tg(α/2) = 2·ctg α
 *
 * Обидва вирази обчислюються прямо за умовою, без спрощень: сенс роботи
 * саме в тому, щоб зійшлися два різні шляхи обчислення.
 *
 * Знак результату залежить від чверті, у яку потрапляє α/2. Для інших
 * значень α той самий вираз дасть −2/tg α, тому переносити відповідь на
 * довільне α не можна.
 */

/** Вхідні дані з умови варіанта. */
const GIVEN_ALPHA = 4.987;

/**
 * Перший вираз.
 */
function y1(float $alpha): float
{
    $down = sqrt((1 - cos($alpha)) / (1 + cos($alpha)));
    $up = sqrt((1 + cos($alpha)) / (1 - cos($alpha)));

    return $down - $up;
}

/**
 * Другий вираз.
 */
function y2(float $alpha): float
{
    return 2 / tan($alpha);
}

/**
 * Проміжні величини обчислення.
 *
 * Потрібні не для результату, а для перевірки: у журналі видно, як саме
 * один вираз переходить в інший.
 *
 * @return list<array{label: string, value: string}>
 */
function trace_values(float $alpha): array
{
    return [
        ['label' => 'cos α', 'value' => fmt(cos($alpha))],
        ['label' => 'α/2, рад', 'value' => fmt($alpha / 2)],
        ['label' => 'tg(α/2)', 'value' => fmt(tan($alpha / 2))],
        ['label' => '√((1 − cos α)/(1 + cos α))', 'value' => fmt(sqrt((1 - cos($alpha)) / (1 + cos($alpha))))],
        ['label' => '√((1 + cos α)/(1 − cos α))', 'value' => fmt(sqrt((1 + cos($alpha)) / (1 - cos($alpha))))],
        ['label' => 'ctg(α/2) − tg(α/2)', 'value' => fmt(1 / tan($alpha / 2) - tan($alpha / 2))],
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
