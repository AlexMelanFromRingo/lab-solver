<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Піраміда рисунків.
 *
 * Побудувати піраміду з малюнків, висоту якої та розмір одного блока (висоту
 * та ширину) задати в рядку браузера.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Піраміда з однакових малюнків (цеглин).
 *
 * Малюнок – векторний (SVG), вбудований у сторінку як data-URI, тож окремий
 * файл зображення не потрібен, а розмір задають атрибути width і height.
 */
class PicturePyramid
{
    private const BRICK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24">'
        . '<rect x="1" y="1" width="38" height="22" rx="2" fill="#c8643b" stroke="#7a3219" stroke-width="2"/>'
        . '<path d="M1 12H39M20 1V12M10 12V23M30 12V23" stroke="#7a3219" stroke-width="1.5"/>'
        . '</svg>';

    private int $levels;
    private int $height;
    private int $width;

    public function __construct(mixed $levels, mixed $height, mixed $width)
    {
        $this->levels = self::integer($levels, 1, 10, 'Висота піраміди');
        $this->height = self::integer($height, 10, 80, 'Висота блока');
        $this->width = self::integer($width, 10, 120, 'Ширина блока');
    }

    public function render(): string
    {
        $image = '<img src="data:image/svg+xml;base64,' . base64_encode(self::BRICK) . '"'
            . ' width="' . $this->width . '" height="' . $this->height . '" alt="цеглина">';

        $html = '<div class="pyramid">';
        for ($level = 1; $level <= $this->levels; $level++) {
            $html .= '<div class="level">' . str_repeat($image, $level) . '</div>';
        }

        return $html . '</div><p class="caption">Висота ' . $this->levels . ' рядів, блок '
            . $this->width . ' × ' . $this->height . ' px, усього '
            . ($this->levels * ($this->levels + 1) / 2) . ' малюнків.</p>';
    }

    private static function integer(mixed $value, int $min, int $max, string $what): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < $min || $number > $max) {
            throw new InvalidArgumentException("$what: потрібне ціле число від $min до $max.");
        }

        return $number;
    }
}

// Параметри з рядка браузера: висота піраміди, висота й ширина блока (px).
$params = [
    'levels' => 'висота піраміди, рядів',
    'height' => 'висота блока, px',
    'width' => 'ширина блока, px',
];
$example = ['levels' => 6, 'height' => 30, 'width' => 50];

$result = null;
$error = null;

if (isset($_GET['levels'], $_GET['height'], $_GET['width'])) {
    try {
        $pyramid = new PicturePyramid($_GET['levels'], $_GET['height'], $_GET['width']);
        $result = $pyramid->render();
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

        .pyramid {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }

        .pyramid .level {
            display: flex;
            gap: 2px;
        }

        .pyramid img {
            display: block;
        }

        .caption {
            margin: 14px 0 0;
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

    <h1>Програма № 2. Піраміда рисунків</h1>
    <p>Побудувати піраміду з малюнків, висоту якої та розмір одного блока (висоту та
ширину) задати в рядку браузера.</p>

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
