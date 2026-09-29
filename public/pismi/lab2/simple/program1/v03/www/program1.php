<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 1: обчислення функцій y1 та y2 за індивідуальним варіантом.
 *
 * Варіант 3:
 *     y₁ = (1 − tg α · tg β) / (m − n)
 *     y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β
 *     де α = 0,145; β = −0,734
 *
 * При заданих вхідних даних результат y1 має дорівнювати результату y2.
 */

/**
 * Перша функція варіанта.
 */
function y1(float $alpha, float $beta): float
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 - tan($alpha) * tan($beta)) / ($m - $n);
}

/**
 * Друга функція варіанта.
 */
function y2(float $alpha, float $beta): float
{
    $m = 5 * sin(2 * $alpha + $beta);
    $n = 5 * sin($beta);

    return (1 + tan($beta) / tan($alpha)) / ($m + $n);
}

/**
 * Число для показу: дванадцять знаків після коми, без зайвих нулів.
 */
function format_number(float $value): string
{
    $text = number_format($value, 12, ',', ' ');

    return rtrim(rtrim($text, '0'), ',');
}

// Вхідні дані з умови варіанта
$alpha = 0.145;
$beta = -0.734;

$y1 = y1($alpha, $beta);
$y2 = y2($alpha, $beta);

// Значення обчислюються різними шляхами в подвійній точності, тому
// порівнюються з допуском, а не на точну рівність.
$difference = abs($y1 - $y2);
$equal = $difference <= 1e-9 * max(1.0, abs($y1));
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Програма № 1 – лабораторна робота № 2</title>
    <style>
        :root {
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-text: color-mix(in srgb, var(--accent) 78%, #000000);
            --text: #1d242b;
            --muted: #5f6b76;
            --line: #dde2e7;
            --good: #1e7a46;
            --bad: #b3261e;
        }

        body {
            margin: 0;
            background: #f4f6f8;
            color: var(--text);
            font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        main {
            max-width: 900px;
            margin: 32px auto;
            padding: 28px 40px 36px;
            border: 1px solid var(--line);
            border-top: 4px solid var(--accent);
            border-radius: 6px;
            background: #ffffff;
        }

        a {
            color: var(--accent-text);
        }

        .meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 4px 24px;
            margin: 0 0 18px;
            color: var(--muted);
            font-size: 14px;
        }

        .meta nav a {
            margin-left: 14px;
        }

        .meta nav a[aria-current] {
            color: var(--text);
            font-weight: 600;
            text-decoration: none;
        }

        h1 {
            margin: 0 0 16px;
            font-size: 26px;
            line-height: 1.25;
        }

        h2 {
            margin: 26px 0 10px;
            font-size: 18px;
        }

        table {
            border-collapse: collapse;
        }

        th,
        td {
            padding: 6px 14px;
            border: 1px solid var(--line);
            text-align: left;
        }

        th {
            background: #f4f6f8;
        }

        .num {
            font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
            text-align: right;
        }

        .ok {
            color: var(--good);
            font-weight: 600;
        }

        .bad {
            color: var(--bad);
            font-weight: 600;
        }

        .hint {
            color: var(--muted);
            font-size: 14px;
        }

        @media (max-width: 720px) {
            main {
                margin: 0;
                padding: 20px 16px;
                border-radius: 0;
            }
        }

        .formula {
            margin: 0 0 6px;
            font-family: Cambria, "Times New Roman", serif;
            font-size: 20px;
        }

        .note {
            padding: 8px 12px;
            border-left: 3px solid var(--accent);
            background: var(--accent-soft);
            font-size: 14px;
        }
    </style>
</head>
<body>
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php" aria-current="page">Програма № 1</a>
            <a href="program2.php">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 1. Обчислення функцій y₁ та y₂</h1>

    <p class="formula">y₁ = (1 − tg α · tg β) / (m − n)</p>
    <p class="formula">y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β</p>
    <p>Варіант 3, вхідні дані: α = 0,145; β = −0,734</p>

    <h2>Результат</h2>
    <table>
        <tr>
            <th>y₁</th>
            <td class="num"><?= format_number($y1) ?></td>
        </tr>
        <tr>
            <th>y₂</th>
            <td class="num"><?= format_number($y2) ?></td>
        </tr>
        <tr>
            <th>|y₁ − y₂|</th>
            <td class="num"><?= sprintf('%.1e', $difference) ?></td>
        </tr>
    </table>

<?php if ($equal) : ?>
    <p class="ok">Значення збігаються: y₁ = y₂.</p>
<?php else : ?>
    <p class="bad">Значення не збігаються: y₁ ≠ y₂.</p>
<?php endif; ?>
    <p class="hint">
        Обидві функції обчислено в подвійній точності різними шляхами, тому
        значення порівнюються з допуском 10⁻⁹, а не на точну рівність.
    </p>
</main>
</body>
</html>
