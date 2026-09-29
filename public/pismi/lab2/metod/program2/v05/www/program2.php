<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Таблиця.
 *
 * Виконати динамічну побудову таблиці. Число рядків таблиці задавати
 * непарними цифрами, а число стовпців — парними цифрами десяткового числа,
 * використаного як параметр у рядку браузера.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Таблиця, розмір якої задають цифри числа: сума непарних цифр — кількість
 * рядків, сума парних — кількість стовпців. Для двоцифрового числа це просто
 * його цифри: 47 — таблиця 7 × 4.
 */
class DigitTable
{
    private const LIMIT = 20;

    /** @var int[] */
    private array $odd = [];

    /** @var int[] */
    private array $even = [];

    public function __construct(private string $number)
    {
        if (!preg_match('/^\d{1,12}$/', $number)) {
            throw new InvalidArgumentException('Число: потрібне десяткове число без знака, до 12 цифр.');
        }

        foreach (str_split($number) as $digit) {
            if ((int) $digit % 2 === 1) {
                $this->odd[] = (int) $digit;
            } else {
                $this->even[] = (int) $digit;
            }
        }

        if (array_sum($this->odd) === 0 || array_sum($this->even) === 0) {
            throw new InvalidArgumentException('Число має містити і непарні, і ненульові парні цифри.');
        }
        if (array_sum($this->odd) > self::LIMIT || array_sum($this->even) > self::LIMIT) {
            throw new InvalidArgumentException('Сума непарних і сума парних цифр — не більше ' . self::LIMIT . '.');
        }
    }

    public function rows(): int
    {
        return array_sum($this->odd);
    }

    public function cols(): int
    {
        return array_sum($this->even);
    }

    public function render(): string
    {
        $html = '<p class="caption">Число ' . $this->number . ': непарні цифри '
            . implode(' + ', $this->odd) . ' = ' . $this->rows() . ' рядків, парні '
            . implode(' + ', $this->even) . ' = ' . $this->cols() . ' стовпців.</p>'
            . '<table class="digits">';

        $cell = 1;
        for ($r = 1; $r <= $this->rows(); $r++) {
            $html .= '<tr>';
            for ($c = 1; $c <= $this->cols(); $c++) {
                $html .= '<td>' . $cell++ . '</td>';
            }
            $html .= '</tr>';
        }

        return $html . '</table>';
    }
}

// Параметр з рядка браузера: десяткове число, цифри якого задають розмір таблиці.
$params = [
    'number' => 'десяткове число',
];
$example = ['number' => '3456'];

$result = null;
$error = null;

if (isset($_GET['number']) && is_string($_GET['number'])) {
    try {
        $table = new DigitTable($_GET['number']);
        $result = $table->render();
    } catch (InvalidArgumentException $e) {
        $error = $e->getMessage();
    }
} elseif (isset($_GET['number'])) {
    $error = 'Число: потрібне одне значення параметра number.';
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

        .caption {
            margin: 0 0 16px;
            color: var(--v-muted);
        }

        .digits {
            border-collapse: collapse;
            font-family: var(--v-mono);
            font-size: 13px;
        }

        .digits td {
            width: 40px;
            height: 32px;
            padding: 0;
            border: 1px solid var(--v-line);
            background: var(--v-cell);
            color: var(--v-muted);
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Виконати динамічну побудову таблиці. Число рядків таблиці задавати непарними
цифрами, а число стовпців — парними цифрами десяткового числа, використаного
як параметр у рядку браузера.</p>

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
