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
            . ' системі числення. Цифри — це остачі від ділення на ' . $this->base
            . ', прочитані знизу вгору.</p>'
            . '<table class="division"><tr><th>Ділене</th><th>Частка</th><th>Остача</th></tr>';

        foreach ($this->steps() as [$dividend, $quotient, $remainder]) {
            $html .= '<tr><td>' . $dividend . ' : ' . $this->base . '</td><td>' . $quotient
                . '</td><td class="digit">' . self::DIGITS[$remainder] . '</td></tr>';
        }

        return $html . '</table>';
    }
}

// Параметри з рядка браузера: 1-й — число, 2-й — основа системи числення.
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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Система обчислення</h1>
    <p>Відобразити число, задане першим параметром у рядку браузера, у системі
числення, заданій другим параметром. Передбачити десяткову, двійкову та
шістнадцяткову системи.</p>

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
