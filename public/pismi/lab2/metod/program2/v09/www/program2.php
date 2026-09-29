<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Текстова піраміда.
 *
 * Побудувати таблицю у вигляді піраміди, висоту якої та розмір одного блока
 * (ширину) задати в рядку браузера. Як заповнювач таблиці використати слово
 * «камінь».
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Піраміда з комірок таблиці.
 *
 * Щоб ряди зміщувалися на пів блока, таблиця має вдвічі більше стовпців, ніж
 * блоків в основі, а кожен блок займає два стовпці (colspan="2").
 */
class TextPyramid
{
    private const WORD = 'камінь';

    private int $height;
    private int $width;

    public function __construct(mixed $height, mixed $width)
    {
        $this->height = self::integer($height, 1, 10, 'Висота піраміди');
        $this->width = self::integer($width, 50, 140, 'Ширина блока');
    }

    public function render(): string
    {
        $columns = 2 * $this->height;
        $html = '<table class="pyramid"><colgroup>'
            . str_repeat('<col style="width: ' . ($this->width / 2) . 'px">', $columns)
            . '</colgroup>';

        for ($level = 1; $level <= $this->height; $level++) {
            $gap = $this->height - $level;
            $html .= '<tr>' . str_repeat('<td class="gap"></td>', $gap);
            for ($block = 0; $block < $level; $block++) {
                $html .= '<td colspan="2">' . self::WORD . '</td>';
            }
            $html .= str_repeat('<td class="gap"></td>', $gap) . '</tr>';
        }

        return $html . '</table><p class="caption">Висота ' . $this->height . ' рядів, ширина блока '
            . $this->width . ' px, усього ' . ($this->height * ($this->height + 1) / 2) . ' блоків.</p>';
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

// Параметри з рядка браузера: висота піраміди (рядів) і ширина блока (px).
$params = [
    'height' => 'висота піраміди, рядів',
    'width' => 'ширина одного блока, px',
];
$example = ['height' => 5, 'width' => 90];

$result = null;
$error = null;

if (isset($_GET['height'], $_GET['width'])) {
    try {
        $pyramid = new TextPyramid($_GET['height'], $_GET['width']);
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
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 3px;
        }

        .pyramid td {
            height: 34px;
            padding: 0;
            border: 1px solid var(--v-line);
            background: var(--v-soft);
            font-size: 14px;
            text-align: center;
            overflow: hidden;
        }

        .pyramid td.gap {
            border: 0;
            background: none;
        }

        .caption {
            margin: 14px 0 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Побудувати таблицю у вигляді піраміди, висоту якої та розмір одного блока
(ширину) задати в рядку браузера. Як заповнювач таблиці використати слово
«камінь».</p>

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
