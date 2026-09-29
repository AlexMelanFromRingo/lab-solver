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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Math&display=swap">
    <style>
        :root {
            --field: #0f1a22;
            --field-deep: #081018;
            --glass: rgba(206, 222, 236, 0.055);
            --glass-strong: rgba(206, 222, 236, 0.09);
            --edge: rgba(206, 222, 236, 0.13);
            --edge-strong: rgba(206, 222, 236, 0.24);
            --ink: #e7edf2;
            --muted: #93a4b2;
            --good: #7fd1a8;
            --bad: #ff9b8f;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-text: color-mix(in srgb, var(--accent) 52%, #ffffff);
            --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
            --mono: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
        }

        * {
            box-sizing: border-box;
        }

        html {
            background: var(--field-deep);
        }

        body {
            margin: 0;
            min-height: 100vh;
            color: var(--ink);
            font: 400 16px/1.55 var(--sans);
            background:
                radial-gradient(760px 520px at 6% -12%, color-mix(in srgb, var(--accent) 36%, transparent), transparent 72%),
                radial-gradient(900px 640px at 105% 112%, rgba(52, 96, 128, 0.5), transparent 70%),
                linear-gradient(155deg, #13222f 0%, var(--field) 48%, var(--field-deep) 100%);
            background-attachment: fixed;
            isolation: isolate;
        }

        /* Великий профіль рейки за склом: акрилові панелі розмивають його край */
        body::before {
            content: "";
            position: fixed;
            right: -170px;
            bottom: -330px;
            z-index: -1;
            width: 820px;
            height: 820px;
            background: var(--accent);
            opacity: 0.2;
            transform: rotate(-14deg);
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
        }

        a {
            color: var(--accent-text);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-text);
            outline-offset: 2px;
        }

        .page {
            max-width: 1180px;
            margin: 0 auto;
            padding: 26px 40px 56px;
        }

        .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 30px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.35;
        }

        .top .lab {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .top svg {
            flex: none;
            width: 30px;
            height: 30px;
            color: var(--accent-text);
        }

        .top b {
            display: block;
            color: var(--ink);
            font-weight: 500;
        }

        .top .who {
            text-align: right;
        }

        .glass {
            border: 1px solid var(--edge);
            border-radius: 16px;
            background: var(--glass);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            backdrop-filter: blur(22px) saturate(150%);
        }

        .glass.strong {
            border-color: var(--edge-strong);
            background: var(--glass-strong);
        }

        h1 {
            margin: 0 0 6px;
            font-size: 30px;
            font-weight: 600;
            line-height: 1.2;
            letter-spacing: -0.01em;
        }

        h2 {
            margin: 0 0 14px;
            font-size: 17px;
            font-weight: 500;
        }

        .lede {
            max-width: 64rem;
            margin: 0 0 24px;
            color: var(--muted);
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        @media (max-width: 900px) {
            .page {
                padding: 20px 18px 40px;
            }

            .top {
                align-items: flex-start;
            }

            h1 {
                font-size: 24px;
            }
        }

        .tabs {
            display: inline-flex;
            gap: 4px;
            margin: 0 0 26px;
            padding: 4px;
            border: 1px solid var(--edge);
            border-radius: 12px;
            background: rgba(8, 16, 24, 0.35);
        }

        .tabs a {
            padding: 7px 16px;
            border-radius: 9px;
            color: var(--muted);
            font-size: 15px;
            text-decoration: none;
        }

        .tabs a:hover {
            color: var(--ink);
        }

        .tabs a[aria-current] {
            background: var(--accent);
            color: var(--accent-ink);
            font-weight: 500;
        }

        .calc {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }

        .formulas {
            padding: 24px 32px 26px;
        }

        .formulas math {
            width: fit-content;
            margin: 6px 0 16px;
            font-size: 1.5rem;
        }

        .defs {
            display: flex;
            flex-wrap: wrap;
            gap: 4px 36px;
        }

        .defs math {
            width: fit-content;
            margin: 0 0 12px;
            font-size: 1.2rem;
        }

        .given {
            margin: 4px 0 0;
            padding-top: 14px;
            border-top: 1px solid var(--edge);
            color: var(--muted);
        }

        .given .num {
            margin-left: 6px;
            color: var(--ink);
            font-size: 17px;
        }

        .note {
            margin: 14px 0 0;
            padding: 10px 14px;
            border-radius: 10px;
            background: var(--accent-soft);
            font-size: 14px;
        }

        .result {
            display: flex;
            flex-direction: column;
            padding: 24px 28px 26px;
        }

        .value {
            display: grid;
            grid-template-columns: 42px 1fr;
            align-items: baseline;
            padding: 12px 0;
            border-bottom: 1px solid var(--edge);
        }

        .value span {
            color: var(--muted);
            font-size: 20px;
        }

        .value output {
            font: 500 30px/1.2 var(--mono);
            font-variant-numeric: tabular-nums;
            overflow-wrap: anywhere;
        }

        .verdict {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 22px 0 6px;
            font-size: 19px;
            font-weight: 500;
        }

        .verdict svg {
            flex: none;
            width: 26px;
            height: 26px;
        }

        .verdict.ok svg {
            color: var(--good);
        }

        .verdict.bad svg {
            color: var(--bad);
        }

        .diff {
            margin: 0;
            color: var(--muted);
            font-size: 14px;
        }

        .more {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
            gap: 20px;
        }

        .more > section {
            padding: 22px 28px 24px;
        }

        .steps table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15px;
        }

        .steps td {
            padding: 7px 0;
            border-bottom: 1px solid var(--edge);
            vertical-align: baseline;
        }

        .steps tr:last-child td {
            border-bottom: 0;
        }

        .steps td.num {
            padding-left: 18px;
            text-align: right;
            white-space: nowrap;
        }

        .why ul {
            margin: 0 0 14px;
            padding: 0;
            list-style: none;
        }

        .why li {
            padding: 6px 12px;
            margin-bottom: 6px;
            border-left: 2px solid var(--accent);
            background: rgba(206, 222, 236, 0.04);
            font-family: var(--mono);
            font-size: 14px;
        }

        .why p {
            margin: 0;
            color: var(--muted);
            font-size: 15px;
        }

        @media (max-width: 900px) {
            .calc,
            .more {
                grid-template-columns: 1fr;
            }

            .formulas math {
                font-size: 1.2rem;
                overflow-x: auto;
            }
        }
    </style>
</head>
<body>
<div class="page">

    <header class="top">
        <div class="lab">
            <!-- Профіль рейки: університет виріс із залізничного інституту -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z"/>
            </svg>
            <div>
                <b>Лабораторна робота № 2</b>
                PHP. Сценарії, функції, об’єкти
            </div>
        </div>
        <div class="who">
            <b>%%PIB%%</b>
            студент групи %%GROUP%%
        </div>
    </header>

    <nav class="tabs" aria-label="Програми роботи">
        <a href="program1.php" aria-current="page">Програма № 1</a>
        <a href="program2.php">Програма № 2</a>
    </nav>

    <h1>Обчислення функцій y₁ та y₂</h1>
    <p class="lede">
        Варіант 9. Функції обчислюються за формулами завдання при заданих
        вхідних даних, і їхні значення мають збігтися.
    </p>

    <div class="calc">
        <section class="glass strong formulas">
            <h2>Формули</h2>
            <math display="block"><mrow><msub><mi>y</mi><mn>1</mn></msub><mo>=</mo><mrow><mrow><mrow><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mo>+</mo><mrow><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow></mrow><mo>+</mo><mrow><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow></mrow></mrow></math>
            <math display="block"><mrow><msub><mi>y</mi><mn>2</mn></msub><mo>=</mo><mfrac><mrow><mrow><mrow><mi>ln</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow><mo>×</mo><mrow><mi>lg</mi><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mo>×</mo><mrow><msub><mi>log</mi><mn>2</mn></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mrow><mrow><msub><mi>log</mi><mrow><mrow><mn>2</mn><mo>×</mo><mn>10</mn></mrow><mo>×</mo><mi>e</mi></mrow></msub><mo>&#x2061;</mo><mspace width="0.17em"></mspace><mi>x</mi></mrow></mfrac></mrow></math>
            <p class="given">Вхідні дані: <span class="num">x = 5</span></p>
        </section>

        <section class="glass result">
            <h2>Результат</h2>
            <div class="value">
                <span>y₁</span>
                <output><?= format_number($y1) ?></output>
            </div>
            <div class="value">
                <span>y₂</span>
                <output><?= format_number($y2) ?></output>
            </div>
<?php if ($equal) : ?>
            <p class="verdict ok">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                y₁ = y₂, значення збігаються
            </p>
<?php else : ?>
            <p class="verdict bad">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 8.5l7 7m0-7l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                y₁ ≠ y₂, значення не збігаються
            </p>
<?php endif; ?>
            <p class="diff">
                Різниця |y₁ − y₂| = <span class="num"><?= format_power($difference) ?></span>:
                у межах похибки обчислень з подвійною точністю.
            </p>
        </section>
    </div>

    <div class="more">
        <section class="glass steps">
            <h2>Проміжні величини</h2>
            <table>
<?php foreach ($steps as [$label, $value]) : ?>
                <tr>
                    <td><?= htmlspecialchars($label) ?></td>
                    <td class="num"><?= format_number($value) ?></td>
                </tr>
<?php endforeach; ?>
            </table>
        </section>

        <section class="glass why">
            <h2>Чому вирази рівні</h2>
            <ul>
                <li>ln 20 = ln 2 + ln 10</li>
                <li>log₂₀ₑ x = ln x / (ln 20 + 1),   бо ln e = 1</li>
            </ul>
            <p>Якщо винести ln²x за дужки, перший вираз дає множник (ln 2 + ln 10 + 1) / (ln 10 · ln 2), а другий – (ln 20 + 1) / (ln 10 · ln 2). Журнал показує, що ln 2 + ln 10 + 1 і ln(20·e) – одне число: логарифм добутку дорівнює сумі логарифмів, а ln e = 1.</p>
        </section>
    </div>

</div>
</body>
</html>
