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
<main>
    <div class="meta">
        <span>Лабораторна робота № 2. %%PIB_SHORT%%, група %%GROUP%%</span>
        <nav aria-label="Програми роботи">
            <a href="program1.php">Програма № 1</a>
            <a href="program2.php" aria-current="page">Програма № 2</a>
        </nav>
    </div>

    <h1>Програма № 2. Будинок, що збудував Джек</h1>
    <p>Використавши текст вірша С. Маршака «Будинок, що збудував Джек», побудувати
перші три куплети. Текст вирівняти згідно з останнім параметром у рядку
браузера; рядки тексту задати в тілі програми.</p>

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
