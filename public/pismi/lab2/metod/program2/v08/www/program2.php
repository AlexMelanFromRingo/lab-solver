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
    <title>Програма № 2</title>
    <style>
        :root {
            --v-text: #000;
            --v-muted: #555;
            --v-line: #000;
            --v-cell: transparent;
            --v-head: #555;
            --v-mark: transparent;
            --v-mark-ink: #000;
            --v-soft: #eee;
            --v-strong: #000;
            --v-light: #fff;
            --v-dark: #888;
            --v-mono: monospace;
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
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Відобразити картинку з розмірами, заданими першим і другим параметром (висота
та ширина) у рядку браузера, та виконати розрахунок її площі.</p>

<?php
if ($result !== null) {
    echo $result;
} elseif ($error !== null) {
    echo "<p style='color: red;'>" . htmlspecialchars($error) . "</p>";
} else {
    echo "<p>Задайте параметри в рядку браузера, наприклад: ";
    echo "<a href='" . htmlspecialchars($exampleUrl) . "'>" . htmlspecialchars(urldecode($exampleUrl)) . "</a></p>";
}
?>
</body>
</html>
