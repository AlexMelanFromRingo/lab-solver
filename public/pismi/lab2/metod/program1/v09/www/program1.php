<?php
// Лабораторна робота № 2. Програма № 1: обчислення функцій y1 та y2.
// Варіант 9:
//   y₁ = ln x·lg x + lg x·log₂x + log₂x·ln x
//   y₂ = (ln x · lg x · log₂x) / log₂₀ₑ x
//   де x = 5

function y1($x)
{
    return log($x) * log10($x)
        + log10($x) * log($x, 2)
        + log($x, 2) * log($x);
}

function y2($x)
{
    $base = 2 * 10 * M_E;

    return (log($x) * log10($x) * log($x, 2)) / log($x, $base);
}

// Вхідні дані
$x = 5.0;

$y1 = y1($x);
$y2 = y2($x);

echo "<h1>Лабораторна робота № 2. Програма № 1</h1>";
echo "<p>y₁ = ln x·lg x + lg x·log₂x + log₂x·ln x</p>";
echo "<p>y₂ = (ln x · lg x · log₂x) / log₂₀ₑ x</p>";
echo "<p>Вхідні дані: x = $x</p>";
echo "<p>y1 = $y1</p>";
echo "<p>y2 = $y2</p>";

// Значення обчислено різними шляхами, тому вони порівнюються з допуском
if (abs($y1 - $y2) < 1e-9) {
    echo "<p>y1 = y2, результати збігаються.</p>";
} else {
    echo "<p>y1 ≠ y2, результати не збігаються.</p>";
}
