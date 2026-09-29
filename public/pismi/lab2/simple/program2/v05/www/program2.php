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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Таблиця</h1>
    <p>Виконати динамічну побудову таблиці. Число рядків таблиці задавати непарними
цифрами, а число стовпців — парними цифрами десяткового числа, використаного
як параметр у рядку браузера.</p>

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
