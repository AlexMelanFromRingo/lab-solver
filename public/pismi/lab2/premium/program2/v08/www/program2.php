<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Площа картини.
 *
 * Відобразити картинку з розмірами, заданими першим і другим параметром
 * (висота та ширина) у рядку браузера, та виконати розрахунок її площі.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Картинка заданого розміру та її площа.
 *
 * Картинка – векторна (SVG) і вбудована прямо в сторінку, тому масштабується
 * до будь-яких заданих розмірів без окремого файла зображення.
 */
class Picture
{
    private int $height;
    private int $width;

    public function __construct(mixed $height, mixed $width)
    {
        $this->height = self::integer($height, 20, 500, 'Висота');
        $this->width = self::integer($width, 20, 760, 'Ширина');
    }

    /**
     * Площа в квадратних пікселях.
     */
    public function area(): int
    {
        return $this->height * $this->width;
    }

    public function render(): string
    {
        $svg = '<svg class="picture" width="' . $this->width . '" height="' . $this->height . '"'
            . ' viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Пейзаж">'
            . '<rect width="400" height="250" fill="#9ec9e8"/>'
            . '<circle cx="300" cy="70" r="34" fill="#f6d365"/>'
            . '<path d="M0 170 L90 95 L170 160 L250 80 L400 175 V250 H0 Z" fill="#6f8fa6"/>'
            . '<path d="M0 205 Q120 160 230 200 T400 190 V250 H0 Z" fill="#4f7d4a"/>'
            . '</svg>';

        return $svg . '<p class="area">S = ' . $this->height . ' × ' . $this->width . ' = <b>'
            . number_format($this->area(), 0, ',', ' ') . '</b> px²</p>'
            . '<p class="caption">Висота ' . $this->height . ' px, ширина ' . $this->width
            . ' px; площа прямокутника – добуток сторін.</p>';
    }

    private static function integer(mixed $value, int $min, int $max, string $what): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < $min || $number > $max) {
            throw new InvalidArgumentException("$what: потрібне ціле число пікселів від $min до $max.");
        }

        return $number;
    }
}

// Параметри з рядка браузера: 1-й – висота, 2-й – ширина картинки в пікселях.
$params = [
    'height' => 'висота картинки, px',
    'width' => 'ширина картинки, px',
];
$example = ['height' => 180, 'width' => 320];

$result = null;
$error = null;

if (isset($_GET['height'], $_GET['width'])) {
    try {
        $picture = new Picture($_GET['height'], $_GET['width']);
        $result = $picture->render();
    } catch (InvalidArgumentException $e) {
        $error = $e->getMessage();
    }
}

// Посилання-приклад: з ним сторінку можна відкрити без ручного набору параметрів.
$exampleUrl = 'program2.php?' . http_build_query($example);
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Програма № 2 – лабораторна робота № 2</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
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

        /* Кольори, якими малює результат об’єкт завдання */
        :root {
            --v-text: var(--ink);
            --v-muted: var(--muted);
            --v-line: rgba(206, 222, 236, 0.2);
            --v-cell: rgba(206, 222, 236, 0.04);
            --v-head: var(--muted);
            --v-mark: var(--accent);
            --v-mark-ink: var(--accent-ink);
            --v-soft: var(--accent-soft);
            --v-strong: var(--accent-text);
            --v-light: #d4dde5;
            --v-dark: #2b3c4a;
            --v-mono: var(--mono);
        }

        .work {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 330px;
            gap: 20px;
            align-items: start;
        }

        .result {
            min-height: 320px;
            padding: 24px 30px 28px;
            overflow-x: auto;
        }

        .params {
            padding: 22px 24px 24px;
        }

        .params dl {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 14px;
            margin: 0 0 18px;
        }

        .params dt {
            font: 500 15px/1.5 var(--mono);
        }

        .params dd {
            margin: 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.5;
        }

        .params dd b {
            display: block;
            color: var(--ink);
            font: 500 15px/1.5 var(--mono);
            overflow-wrap: anywhere;
        }

        .params dd b.none {
            color: var(--muted);
            font-weight: 400;
        }

        .query {
            margin: 0;
            padding-top: 14px;
            border-top: 1px solid var(--edge);
            color: var(--muted);
            font-size: 14px;
        }

        .query a {
            display: block;
            margin-top: 4px;
            font: 400 13px/1.5 var(--mono);
            overflow-wrap: anywhere;
        }

        .empty,
        .error {
            max-width: 36rem;
            margin: 0 0 16px;
        }

        .error {
            padding: 12px 16px;
            border: 1px solid rgba(255, 155, 143, 0.4);
            border-radius: 10px;
            color: var(--bad);
        }

        .button {
            display: inline-block;
            padding: 9px 18px;
            border-radius: 10px;
            background: var(--accent);
            color: var(--accent-ink);
            font-weight: 500;
            text-decoration: none;
        }

        @media (max-width: 900px) {
            .work {
                grid-template-columns: 1fr;
            }
        }

        .picture {
            display: block;
            border: 1px solid var(--v-line);
        }

        .area {
            margin: 16px 0 4px;
            font: 400 22px/1.3 var(--v-mono);
        }

        .area b {
            color: var(--v-strong);
        }

        .caption {
            margin: 0;
            color: var(--v-muted);
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
        <a href="program1.php">Програма № 1</a>
        <a href="program2.php" aria-current="page">Програма № 2</a>
    </nav>

    <h1>Площа картини</h1>
    <p class="lede">Відобразити картинку з розмірами, заданими першим і другим параметром (висота
та ширина) у рядку браузера, та виконати розрахунок її площі.</p>

    <div class="work">
        <section class="glass strong result">
            <h2>Результат</h2>
<?php if ($result !== null) : ?>
            <?= $result ?>

<?php elseif ($error !== null) : ?>
            <p class="error"><?= htmlspecialchars($error) ?></p>
            <a class="button" href="<?= htmlspecialchars($exampleUrl) ?>">Відкрити приклад</a>
<?php else : ?>
            <p class="empty">
                Параметри в рядку браузера не задано. Допишіть їх до адреси сторінки
                або відкрийте приклад.
            </p>
            <a class="button" href="<?= htmlspecialchars($exampleUrl) ?>">Відкрити приклад</a>
<?php endif; ?>
        </section>

        <aside class="glass params">
            <h2>Параметри з рядка браузера</h2>
            <dl>
<?php foreach ($params as $name => $label) : ?>
                <dt><?= $name ?></dt>
                <dd>
<?php if (isset($_GET[$name]) && is_string($_GET[$name])) : ?>
                    <b><?= htmlspecialchars($_GET[$name]) ?></b>
<?php else : ?>
                    <b class="none">не задано</b>
<?php endif; ?>
                    <?= htmlspecialchars($label) ?>

                </dd>
<?php endforeach; ?>
            </dl>
            <p class="query">
                Приклад запиту
                <a href="<?= htmlspecialchars($exampleUrl) ?>"><?= htmlspecialchars(urldecode($exampleUrl)) ?></a>
            </p>
        </aside>
    </div>

</div>
</body>
</html>
