<?php
// Лабораторна робота № 2. Програма № 1: обчислення функцій y1 та y2.
// Варіант 4:
//   y₁ = (sin α + sin β)² + (cos α + cos β)²
//   y₂ = 4·cos²((α − β) / 2)
//   де α = 0,4745; β = 0,1634

function y1($alpha, $beta)
{
    return (sin($alpha) + sin($beta)) ** 2
        + (cos($alpha) + cos($beta)) ** 2;
}

function y2($alpha, $beta)
{
    return 4 * cos(($alpha - $beta) / 2) ** 2;
}

// Вхідні дані
$alpha = 0.4745;
$beta = 0.1634;

$y1 = y1($alpha, $beta);
$y2 = y2($alpha, $beta);

echo "<h1>Лабораторна робота № 2. Програма № 1</h1>";
echo "<p>y₁ = (sin α + sin β)² + (cos α + cos β)²</p>";
echo "<p>y₂ = 4·cos²((α − β) / 2)</p>";
echo "<p>Вхідні дані: α = $alpha, β = $beta</p>";
echo "<p>y1 = $y1</p>";
echo "<p>y2 = $y2</p>";

// Значення обчислено різними шляхами, тому вони порівнюються з допуском
if (abs($y1 - $y2) < 1e-9) {
    echo "<p>y1 = y2, результати збігаються.</p>";
} else {
    echo "<p>y1 ≠ y2, результати не збігаються.</p>";
}
