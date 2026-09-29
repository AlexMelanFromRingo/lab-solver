<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Будинок, що збудував Джек.
 *
 * Використавши текст вірша С. Маршака «Будинок, що збудував Джек»,
 * побудувати перші три куплети. Текст вирівняти згідно з останнім параметром
 * у рядку браузера; рядки тексту задати в тілі програми.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Перші три куплети вірша «Будинок, що збудував Джек» (С. Маршак, переклад
 * українською).
 *
 * Куплети не зберігаються готовими: кожен наступний починається новим рядком
 * і повторює ланцюжок попередніх, тому текст складається в циклі.
 */
class JackHouse
{
    /** Початок куплета й рядок, яким він продовжує ланцюжок. */
    private const LINKS = [
        ['А це пшениця,', 'Яка в темній коморі зберігається'],
        ['А це весела птиця-синиця,', 'Яка часто краде пшеницю,'],
    ];

    private const ENDING = ['В будинку,', 'Який збудував Джек.'];

    private const ALIGN = ['left' => 'за лівим краєм', 'center' => 'по центру', 'right' => 'за правим краєм'];

    private string $align;

    public function __construct(mixed $align)
    {
        if (!is_string($align) || !isset(self::ALIGN[$align])) {
            throw new InvalidArgumentException('Вирівнювання: допустимі значення left, center, right.');
        }

        $this->align = $align;
    }

    /**
     * Куплети як масиви рядків.
     *
     * @return array<int, string[]>
     */
    public function verses(): array
    {
        $verses = [['Ось будинок,', 'Який збудував Джек.']];
        foreach (self::LINKS as $i => [$opening]) {
            $lines = [$opening];
            // Ланцюжок іде у зворотному порядку: від нової ланки до першої.
            for ($j = $i; $j >= 0; $j--) {
                $lines[] = self::LINKS[$j][1];
            }
            $verses[] = array_merge($lines, self::ENDING);
        }

        return $verses;
    }

    public function render(): string
    {
        $html = '<div class="poem" style="text-align: ' . $this->align . ';">';
        foreach ($this->verses() as $verse) {
            $html .= '<p>' . implode('<br>', $verse) . '</p>';
        }

        return $html . '</div><p class="caption">Вирівнювання: ' . self::ALIGN[$this->align] . '.</p>';
    }
}

// Параметр з рядка браузера: вирівнювання тексту (останній параметр).
$params = [
    'align' => 'вирівнювання: left, center або right',
];
$example = ['align' => 'center'];

$result = null;
$error = null;

if (isset($_GET['align'])) {
    try {
        $poem = new JackHouse($_GET['align']);
        $result = $poem->render();
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

        .poem {
            max-width: 34rem;
            font-size: 19px;
            line-height: 1.55;
        }

        .poem p {
            margin: 0 0 18px;
        }

        .caption {
            margin: 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Використавши текст вірша С. Маршака «Будинок, що збудував Джек», побудувати
перші три куплети. Текст вирівняти згідно з останнім параметром у рядку
браузера; рядки тексту задати в тілі програми.</p>

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
