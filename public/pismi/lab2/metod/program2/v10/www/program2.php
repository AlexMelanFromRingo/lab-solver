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
 * Малюнок — векторний (SVG), вбудований у сторінку як data-URI, тож окремий
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
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Побудувати піраміду з малюнків, висоту якої та розмір одного блока (висоту та
ширину) задати в рядку браузера.</p>

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
