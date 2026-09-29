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
 * Картинка — векторна (SVG) і вбудована прямо в сторінку, тому масштабується
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
            . ' px; площа прямокутника — добуток сторін.</p>';
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

// Параметри з рядка браузера: 1-й — висота, 2-й — ширина картинки в пікселях.
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

        /* Кольори, якими малює результат об’єкт завдання */
        :root {
            --v-text: var(--text);
            --v-muted: var(--muted);
            --v-line: #c9d1d8;
            --v-cell: #ffffff;
            --v-head: var(--muted);
            --v-mark: var(--accent);
            --v-mark-ink: var(--accent-ink);
            --v-soft: var(--accent-soft);
            --v-strong: var(--accent-text);
            --v-light: #ffffff;
            --v-dark: #6b7885;
            --v-mono: ui-monospace, "Cascadia Mono", Consolas, monospace;
        }

        .result {
            margin: 20px 0;
            overflow-x: auto;
        }

        .error {
            color: var(--bad);
            font-weight: 600;
        }

        .params code {
            font-size: 15px;
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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Площа картини</h1>
    <p>Відобразити картинку з розмірами, заданими першим і другим параметром (висота
та ширина) у рядку браузера, та виконати розрахунок її площі.</p>

    <div class="result">
<?php if ($result !== null) : ?>
        <?= $result ?>

<?php elseif ($error !== null) : ?>
        <p class="error"><?= htmlspecialchars($error) ?></p>
<?php else : ?>
        <p>Параметри в рядку браузера не задано.</p>
<?php endif; ?>
    </div>

    <h2>Параметри</h2>
    <ul class="params">
<?php foreach ($params as $name => $label) : ?>
        <li><code><?= $name ?></code> – <?= htmlspecialchars($label) ?></li>
<?php endforeach; ?>
    </ul>
    <p>Приклад: <a href="<?= htmlspecialchars($exampleUrl) ?>"><?= htmlspecialchars(urldecode($exampleUrl)) ?></a></p>
</main>
</body>
</html>
