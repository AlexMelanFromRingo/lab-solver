<?php
// Лабораторна робота № 2. Програма № 1: обчислення функцій y1 та y2.
// Варіант 6:
//   y₁ = sin²x / (sin x − cos x) − (sin x + cos x) / (tg²x − 1)
//   y₂ = sin x + cos x
//   де x = −0,55677

function y1($x)
{
    $second = (sin($x) + cos($x)) / (tan($x) ** 2 - 1);

    return sin($x) ** 2 / (sin($x) - cos($x)) - $second;
}

function y2($x)
{
    return sin($x) + cos($x);
}

// Вхідні дані
$x = -0.55677;

$y1 = y1($x);
$y2 = y2($x);

echo "<h1>Лабораторна робота № 2. Програма № 1</h1>";
echo "<p>y₁ = sin²x / (sin x − cos x) − (sin x + cos x) / (tg²x − 1)</p>";
echo "<p>y₂ = sin x + cos x</p>";
echo "<p>Вхідні дані: x = $x</p>";
echo "<p>y1 = $y1</p>";
echo "<p>y2 = $y2</p>";

// Значення обчислено різними шляхами, тому вони порівнюються з допуском
if (abs($y1 - $y2) < 1e-9) {
    echo "<p>y1 = y2, результати збігаються.</p>";
} else {
    echo "<p>y1 ≠ y2, результати не збігаються.</p>";
}
