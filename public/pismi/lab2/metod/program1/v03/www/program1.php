<?php
// Лабораторна робота № 2. Програма № 1: обчислення функцій y1 та y2.
// Варіант 3:
//   y₁ = (1 − tg α · tg β) / (m − n)
//   y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β
//   де α = 0,145; β = −0,734

function y1($alpha, $beta)
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 - tan($alpha) * tan($beta)) / ($m - $n);
}

function y2($alpha, $beta)
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 + tan($beta) / tan($alpha)) / ($m + $n);
}

// Вхідні дані
$alpha = 0.145;
$beta = -0.734;

$y1 = y1($alpha, $beta);
$y2 = y2($alpha, $beta);

echo "<h1>Лабораторна робота № 2. Програма № 1</h1>";
echo "<p>y₁ = (1 − tg α · tg β) / (m − n)</p>";
echo "<p>y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β</p>";
echo "<p>Вхідні дані: α = $alpha, β = $beta</p>";
echo "<p>y1 = $y1</p>";
echo "<p>y2 = $y2</p>";

// Значення обчислено різними шляхами, тому вони порівнюються з допуском
if (abs($y1 - $y2) < 1e-9) {
    echo "<p>y1 = y2, результати збігаються.</p>";
} else {
    echo "<p>y1 ≠ y2, результати не збігаються.</p>";
}
