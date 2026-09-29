<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Текстове число.
 *
 * Відобразити число, задане параметром у рядку браузера, у межах від 0.0 до
 * 9.9 у текстовому вигляді. Наприклад, 3.3 – «три цілих три десятих».
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Число від 0.0 до 9.9 словами: «три цілих три десятих».
 */
class NumberInWords
{
    private const WORDS = ['нуль', 'одна', 'дві', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'];

    private int $whole;
    private int $tenths;

    public function __construct(mixed $number)
    {
        // Дробову частину можна відділити і крапкою, і комою.
        if (!is_string($number) || !preg_match('/^(\d)(?:[.,](\d))?$/', trim($number), $match)) {
            throw new InvalidArgumentException('Число: потрібне значення від 0.0 до 9.9 з однією цифрою після крапки.');
        }

        $this->whole = (int) $match[1];
        $this->tenths = (int) ($match[2] ?? 0);
    }

    /**
     * Число словами. Після «одна» – «ціла» і «десята», після інших – «цілих» і «десятих».
     */
    public function words(): string
    {
        return self::WORDS[$this->whole] . ($this->whole === 1 ? ' ціла ' : ' цілих ')
            . self::WORDS[$this->tenths] . ($this->tenths === 1 ? ' десята' : ' десятих');
    }

    public function render(): string
    {
        return '<p class="number">' . $this->whole . '.' . $this->tenths . '</p>'
            . '<p class="words">' . $this->words() . '</p>'
            . '<p class="caption">Ціла частина – ' . $this->whole . ', дробова – '
            . $this->tenths . ' десятих; кожна частина називається окремо.</p>';
    }
}

// Параметр з рядка браузера: число від 0.0 до 9.9.
$params = [
    'number' => 'число від 0.0 до 9.9',
];
$example = ['number' => '3.3'];

$result = null;
$error = null;

if (isset($_GET['number'])) {
    try {
        $number = new NumberInWords($_GET['number']);
        $result = $number->render();
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

        .number {
            margin: 0;
            color: var(--v-muted);
            font: 500 44px/1.2 var(--v-mono);
        }

        .words {
            margin: 4px 0 14px;
            color: var(--v-strong);
            font-size: 34px;
            font-weight: 600;
            line-height: 1.2;
        }

        .caption {
            margin: 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Відобразити число, задане параметром у рядку браузера, у межах від 0.0 до 9.9
у текстовому вигляді. Наприклад, 3.3 – «три цілих три десятих».</p>

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
