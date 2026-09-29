<?php
// Лабораторна робота № 2. Програма № 1: обчислення функцій y1 та y2.
// Варіант 8:
//   y₁ = (1 + sin 2β) / (sin β + cos β) − (1 − tg²(β/2)) / (1 + tg²(β/2))
//   y₂ = sin β
//   де β = −0,8985

function y1($beta)
{
    $t = tan($beta / 2);
    $first = (1 + sin(2 * $beta)) / (sin($beta) + cos($beta));
    $second = (1 - $t ** 2) / (1 + $t ** 2);

    return $first - $second;
}

function y2($beta)
{
    return sin($beta);
}

// Вхідні дані
$beta = -0.8985;

$y1 = y1($beta);
$y2 = y2($beta);

echo "<h1>Лабораторна робота № 2. Програма № 1</h1>";
echo "<p>y₁ = (1 + sin 2β) / (sin β + cos β) − (1 − tg²(β/2)) / (1 + tg²(β/2))</p>";
echo "<p>y₂ = sin β</p>";
echo "<p>Вхідні дані: β = $beta</p>";
echo "<p>y1 = $y1</p>";
echo "<p>y2 = $y2</p>";

// Значення обчислено різними шляхами, тому вони порівнюються з допуском
if (abs($y1 - $y2) < 1e-9) {
    echo "<p>y1 = y2, результати збігаються.</p>";
} else {
    echo "<p>y1 ≠ y2, результати не збігаються.</p>";
}
