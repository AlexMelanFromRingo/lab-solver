<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 1: обчислення функцій y1 та y2 за індивідуальним варіантом.
 *
 * Варіант 9:
 *     y₁ = ln x·lg x + lg x·log₂x + log₂x·ln x
 *     y₂ = (ln x · lg x · log₂x) / log₂₀ₑ x
 *     де x = 5
 *
 * При заданих вхідних даних результат y1 має дорівнювати результату y2.
 */

/**
 * Перша функція варіанта.
 */
function y1(float $x): float
{
    return log($x) * log10($x)
        + log10($x) * log($x, 2)
        + log($x, 2) * log($x);
}

/**
 * Друга функція варіанта.
 */
function y2(float $x): float
{
    $base = 2 * 10 * M_E;

    return (log($x) * log10($x) * log($x, 2)) / log($x, $base);
}

/**
 * Число для показу: дванадцять знаків після коми, без зайвих нулів.
 */
function format_number(float $value): string
{
    $text = number_format($value, 12, ',', ' ');

    return rtrim(rtrim($text, '0'), ',');
}

/**
 * Мале число у вигляді m·10ⁿ (для різниці значень).
 */
function format_power(float $value): string
{
    if ($value == 0.0) {
        return '0';
    }

    $exponent = (int) floor(log10($value));
    $mantissa = $value / 10 ** $exponent;
    $superscript = strtr((string) $exponent, [
        '-' => '⁻', '0' => '⁰', '1' => '¹', '2' => '²', '3' => '³', '4' => '⁴',
        '5' => '⁵', '6' => '⁶', '7' => '⁷', '8' => '⁸', '9' => '⁹',
    ]);

    return number_format($mantissa, 1, ',', '') . '·10' . $superscript;
}

// Вхідні дані з умови варіанта
$x = 5.0;

$y1 = y1($x);
$y2 = y2($x);

// Значення обчислюються різними шляхами в подвійній точності, тому
// порівнюються з допуском, а не на точну рівність.
$difference = abs($y1 - $y2);
$equal = $difference <= 1e-9 * max(1.0, abs($y1));

// Проміжні величини: з них видно, як один вираз переходить в інший.
$base = 2 * 10 * M_E;
$steps = [
    ['ln x', log($x)],
    ['lg x', log10($x)],
    ['log₂ x', log($x, 2)],
    ['основа 2·10·e', $base],
    ['log₂₀ₑ x', log($x, $base)],
    ['ln 2 + ln 10 + 1', log(2) + log(10) + 1],
    ['ln(20·e)', log($base)],
];
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Програма № 1 – лабораторна робота № 2</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Math&family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">
    <style>
        :root {
            --desk: #d6dde3;
            --paper: #ffffff;
            --line: #1b2630;
            --thin: #8a98a4;
            --hair: #c5ced6;
            --grid: rgba(27, 38, 48, 0.05);
            --text: #1b2630;
            --muted: #56646f;
            --good: #1f7a4d;
            --bad: #b3261e;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-line: color-mix(in srgb, var(--accent) 82%, #000000);
            --font: "PT Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif;
            --mono: "PT Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--desk);
            color: var(--text);
            font: 400 18px/1.45 var(--font);
        }

        a {
            color: var(--accent-line);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-line);
            outline-offset: 2px;
        }

        /* Аркуш: зовнішня тонка межа, рамка з полем для підшивки ліворуч */
        .sheet {
            min-height: calc(100vh - 40px);
            padding: 12px 12px 12px 44px;
            border: 1px solid var(--thin);
            background:
                linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                var(--paper);
        }

        .frame {
            display: grid;
            grid-template-rows: 1fr auto;
            min-height: calc(100vh - 66px);
            border: 2px solid var(--line);
        }

        .field {
            padding: 26px 36px 28px;
        }

        .lab {
            margin: 0;
            color: var(--muted);
            font-size: 19px;
        }

        h1 {
            margin: 0 0 22px;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
        }

        h2 {
            margin: 0 0 10px;
            font-size: 21px;
            font-weight: 700;
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        /* Таблиця як специфікація: товсті лінії шапки, тонкі між рядками */
        table.spec {
            border-collapse: collapse;
            font-size: 17px;
        }

        table.spec th,
        table.spec td {
            padding: 5px 12px;
            border: 1px solid var(--line);
            text-align: left;
        }

        table.spec thead th {
            border-bottom-width: 2px;
            font-weight: 700;
        }

        table.spec td.num {
            text-align: right;
        }

        /* Основний напис, як на кресленні: правий нижній кут */
        .stamp {
            display: grid;
            grid-template-columns: 96px 150px 250px;
            grid-template-areas:
                "k1 v1 title"
                "k2 v2 title"
                "k3 v3 title"
                "org org sheet";
            justify-self: end;
            border-top: 2px solid var(--line);
            border-left: 2px solid var(--line);
            background: var(--paper);
            font-size: 16px;
        }

        .stamp > * {
            margin: 0;
            padding: 5px 10px;
            border-right: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
        }

        .stamp .key {
            color: var(--muted);
        }

        .stamp .title {
            grid-area: title;
            display: grid;
            place-content: center;
            border-right: 0;
            font-size: 19px;
            font-weight: 700;
            line-height: 1.25;
            text-align: center;
        }

        .stamp .org {
            grid-area: org;
            border-top: 1px solid var(--line);
            border-bottom: 0;
        }

        .stamp .sheet-no {
            grid-area: sheet;
            border-top: 1px solid var(--line);
            border-right: 0;
            border-bottom: 0;
            text-align: center;
        }

        .stamp .mono {
            font-family: var(--mono);
            font-size: 15px;
        }

        @media (max-width: 820px) {
            body {
                padding: 10px;
            }

            .sheet {
                padding: 8px;
            }

            .field {
                padding: 20px 16px;
            }

            .stamp {
                grid-template-columns: 80px 1fr;
                grid-template-areas:
                    "title title"
                    "k1 v1"
                    "k2 v2"
                    "k3 v3"
                    "org sheet";
                justify-self: stretch;
                border-left: 0;
            }
        }

        .head {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            justify-content: space-between;
            gap: 8px 24px;
            margin-bottom: 4px;
        }

        .sheets {
            display: flex;
            border: 1px solid var(--line);
            font-size: 17px;
        }

        .sheets a {
            padding: 3px 12px;
            color: var(--text);
            text-decoration: none;
        }

        .sheets a + a {
            border-left: 1px solid var(--line);
        }

        .sheets a[aria-current] {
            background: var(--accent);
            color: var(--accent-ink);
        }

        .calc {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
            border: 1px solid var(--line);
            margin-bottom: 26px;
        }

        .calc > section {
            padding: 16px 22px 20px;
        }

        .calc > section + section {
            border-left: 1px solid var(--line);
        }

        .formulas math {
            width: fit-content;
            margin: 4px 0 14px;
            font-size: 1.45rem;
        }

        .defs math {
            font-size: 1.15rem;
        }

        .given {
            margin: 8px 0 0;
            font-size: 19px;
        }

        .note {
            margin: 12px 0 0;
            padding: 8px 12px;
            border-left: 3px solid var(--accent-line);
            background: var(--accent-soft);
            font-size: 16px;
        }

        .result table {
            width: 100%;
        }

        .result td:first-child {
            width: 30%;
        }

        .result td.num {
            font-size: 19px;
        }

        .verdict {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 16px 0 0;
            font-size: 21px;
            font-weight: 700;
        }

        .verdict svg {
            flex: none;
            width: 28px;
            height: 28px;
        }

        .verdict.ok svg {
            color: var(--accent-line);
        }

        .verdict.bad {
            color: var(--bad);
        }

        .lower {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            gap: 36px;
            align-items: start;
        }

        .lower table {
            width: 100%;
        }

        .why ol {
            margin: 0 0 12px;
            padding-left: 22px;
            font-family: var(--mono);
            font-size: 15px;
        }

        .why li {
            padding: 3px 0;
        }

        .why p {
            margin: 0;
            color: var(--muted);
            font-size: 17px;
        }

        @media (max-width: 900px) {
            .calc,
            .lower {
                grid-template-columns: 1fr;
            }

            .calc > section + section {
                border-left: 0;
                border-top: 1px solid var(--line);
            }

            .formulas math {
                overflow-x: auto;
                font-size: 1.15rem;
            }
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">

        <main class="field">
            <div class="head">
                <p class="lab">Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти</p>
                <nav class="sheets" aria-label="Програми роботи">
                    <a href="program1.php" aria-current="page">Аркуш 1: програма № 1</a>
                    <a href="program2.php">Аркуш 2: програма № 2</a>
                </nav>
            </div>
            <h1>Програма № 1. Обчислення функцій y₁ та y₂</h1>

            <div class="calc">
                <section class="formulas">
                    <h2>Завдання, варіант 9</h2>
                    <math display="block"><mrow><msub><mi>y</mi><mn>1</mn></msub><mo>=</mo><mrow><mrow><mrow><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mo>+</mo><mrow><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow></mrow><mo>+</mo><mrow><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow></mrow></mrow></math>
                    <math display="block"><mrow><msub><mi>y</mi><mn>2</mn></msub><mo>=</mo><mfrac><mrow><mrow><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mo>×</mo><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mrow><msub><mi>log</mi><mrow><mrow><mn>2</mn><mo>×</mo><mn>10</mn></mrow><mo>×</mo><mi>e</mi></mrow></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mfrac></mrow></math>
                    <p class="given">Вхідні дані: <span class="num">x = 5</span></p>
                </section>

                <section class="result">
                    <h2>Результат</h2>
                    <table class="spec">
                        <tr>
                            <td>y₁</td>
                            <td class="num"><?= format_number($y1) ?></td>
                        </tr>
                        <tr>
                            <td>y₂</td>
                            <td class="num"><?= format_number($y2) ?></td>
                        </tr>
                        <tr>
                            <td>|y₁ − y₂|</td>
                            <td class="num"><?= format_power($difference) ?></td>
                        </tr>
                    </table>
<?php if ($equal) : ?>
                    <p class="verdict ok">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>
                        Значення збігаються: y₁ = y₂
                    </p>
<?php else : ?>
                    <p class="verdict bad">Значення не збігаються: y₁ ≠ y₂</p>
<?php endif; ?>
                </section>
            </div>

            <div class="lower">
                <section>
                    <h2>Проміжні величини</h2>
                    <table class="spec">
                        <thead>
                            <tr><th>Величина</th><th>Значення</th></tr>
                        </thead>
                        <tbody>
<?php foreach ($steps as [$label, $value]) : ?>
                            <tr>
                                <td><?= htmlspecialchars($label) ?></td>
                                <td class="num"><?= format_number($value) ?></td>
                            </tr>
<?php endforeach; ?>
                        </tbody>
                    </table>
                </section>

                <section class="why">
                    <h2>Чому вирази рівні</h2>
                    <ol>
                        <li>ln 20 = ln 2 + ln 10</li>
                        <li>log₂₀ₑ x = ln x / (ln 20 + 1),   бо ln e = 1</li>
                    </ol>
                    <p>Якщо винести ln²x за дужки, перший вираз дає множник (ln 2 + ln 10 + 1) / (ln 10 · ln 2), а другий – (ln 20 + 1) / (ln 10 · ln 2). Журнал показує, що ln 2 + ln 10 + 1 і ln(20·e) – одне число: логарифм добутку дорівнює сумі логарифмів, а ln e = 1.</p>
                </section>
            </div>
        </main>

        <footer class="stamp">
            <p class="key">Розробив</p>
            <p>%%PIB_SHORT%%</p>
            <p class="key">Група</p>
            <p class="mono">%%GROUP%%</p>
            <p class="key">Варіант</p>
            <p>9</p>
            <p class="title">Лабораторна робота № 2<br>Програма № 1</p>
            <p class="org">УДУНТ, кафедра ЕОМ</p>
            <p class="sheet-no">Аркуш 1 з 2</p>
        </footer>

    </div>
</div>
</body>
</html>
