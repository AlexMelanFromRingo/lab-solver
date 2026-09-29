<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Система обчислення.
 *
 * Відобразити число, задане першим параметром у рядку браузера, у системі
 * числення, заданій другим параметром. Передбачити десяткову, двійкову та
 * шістнадцяткову системи.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Переведення невід’ємного цілого числа в систему з основою 2, 10 або 16
 * послідовним діленням на основу.
 */
class NumberSystem
{
    private const DIGITS = '0123456789ABCDEF';
    private const NAMES = [2 => 'двійковій', 10 => 'десятковій', 16 => 'шістнадцятковій'];

    private int $number;
    private int $base;

    public function __construct(mixed $number, mixed $base)
    {
        $number = filter_var($number, FILTER_VALIDATE_INT);
        if ($number === false || $number < 0) {
            throw new InvalidArgumentException('Число: потрібне невід’ємне ціле число, записане десятковими цифрами.');
        }

        $base = filter_var($base, FILTER_VALIDATE_INT);
        if ($base === false || !isset(self::NAMES[$base])) {
            throw new InvalidArgumentException('Система числення: допустимі основи 2, 10 і 16.');
        }

        $this->number = $number;
        $this->base = $base;
    }

    /**
     * Кроки ділення: [ділене, частка, остача].
     *
     * @return array<int, int[]>
     */
    public function steps(): array
    {
        $steps = [];
        $value = $this->number;
        do {
            $steps[] = [$value, intdiv($value, $this->base), $value % $this->base];
            $value = intdiv($value, $this->base);
        } while ($value > 0);

        return $steps;
    }

    /**
     * Запис числа: остачі, прочитані від останньої до першої.
     */
    public function convert(): string
    {
        $digits = '';
        foreach ($this->steps() as [, , $remainder]) {
            $digits = self::DIGITS[$remainder] . $digits;
        }

        return $digits;
    }

    public function render(): string
    {
        $html = '<p class="answer"><span>' . $this->number . '<sub>10</sub></span> = <b>'
            . $this->convert() . '<sub>' . $this->base . '</sub></b></p>'
            . '<p class="caption">Число ' . $this->number . ' у ' . self::NAMES[$this->base]
            . ' системі числення. Цифри – це остачі від ділення на ' . $this->base
            . ', прочитані знизу вгору.</p>'
            . '<table class="division"><tr><th>Ділене</th><th>Частка</th><th>Остача</th></tr>';

        foreach ($this->steps() as [$dividend, $quotient, $remainder]) {
            $html .= '<tr><td>' . $dividend . ' : ' . $this->base . '</td><td>' . $quotient
                . '</td><td class="digit">' . self::DIGITS[$remainder] . '</td></tr>';
        }

        return $html . '</table>';
    }
}

// Параметри з рядка браузера: 1-й – число, 2-й – основа системи числення.
$params = [
    'number' => 'число (десяткове)',
    'base' => 'основа системи: 2, 10 або 16',
];
$example = ['number' => 2026, 'base' => 16];

$result = null;
$error = null;

if (isset($_GET['number'], $_GET['base'])) {
    try {
        $system = new NumberSystem($_GET['number'], $_GET['base']);
        $result = $system->render();
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

        .answer {
            margin: 0 0 8px;
            font: 500 34px/1.3 var(--v-mono);
        }

        .answer span {
            color: var(--v-muted);
        }

        .answer b {
            color: var(--v-strong);
        }

        .answer sub {
            font-size: 0.45em;
        }

        .caption {
            margin: 0 0 18px;
            color: var(--v-muted);
        }

        .division {
            border-collapse: collapse;
            font-family: var(--v-mono);
        }

        .division th,
        .division td {
            padding: 6px 18px 6px 0;
            border-bottom: 1px solid var(--v-line);
            text-align: right;
        }

        .division th {
            color: var(--v-head);
            font-family: inherit;
            font-weight: 400;
        }

        .division .digit {
            color: var(--v-strong);
            font-weight: 700;
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Відобразити число, задане першим параметром у рядку браузера, у системі
числення, заданій другим параметром. Передбачити десяткову, двійкову та
шістнадцяткову системи.</p>

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
