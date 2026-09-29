<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Зодіак.
 *
 * Залежно від місяця, року народження та імені, які мають бути вказані в
 * рядку браузера як параметри, видати інформацію щодо знака зодіаку та звіра
 * року народження.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Знак зодіаку за місяцем і звір року за східним календарем.
 *
 * Дня народження серед параметрів немає, а межі знаків припадають на
 * середину місяця, тому для місяця називаються обидва його знаки з датою межі.
 */
class Zodiac
{
    /** Місяць → [знак до межі, останній день цього знака, знак після межі]. */
    private const SIGNS = [
        1 => ['Козеріг', 19, 'Водолій'],
        2 => ['Водолій', 18, 'Риби'],
        3 => ['Риби', 20, 'Овен'],
        4 => ['Овен', 19, 'Телець'],
        5 => ['Телець', 20, 'Близнюки'],
        6 => ['Близнюки', 20, 'Рак'],
        7 => ['Рак', 22, 'Лев'],
        8 => ['Лев', 22, 'Діва'],
        9 => ['Діва', 22, 'Терези'],
        10 => ['Терези', 22, 'Скорпіон'],
        11 => ['Скорпіон', 21, 'Стрілець'],
        12 => ['Стрілець', 21, 'Козеріг'],
    ];

    /** Назви місяців у родовому відмінку: «до 19 січня». */
    private const MONTHS = [
        1 => 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ];

    /** Звірі 12-річного циклу в родовому відмінку, починаючи з року Щура (4 р.). */
    private const ANIMALS = ['Щура', 'Бика', 'Тигра', 'Кролика', 'Дракона', 'Змії',
        'Коня', 'Кози', 'Мавпи', 'Півня', 'Собаки', 'Свині'];

    private string $name;
    private int $month;
    private int $year;

    public function __construct(mixed $name, mixed $month, mixed $year)
    {
        if (!is_string($name) || trim($name) === '' || mb_strlen($name) > 40) {
            throw new InvalidArgumentException('Ім’я: потрібен непорожній рядок до 40 символів.');
        }

        $month = filter_var($month, FILTER_VALIDATE_INT);
        if ($month === false || $month < 1 || $month > 12) {
            throw new InvalidArgumentException('Місяць народження: потрібне ціле число від 1 до 12.');
        }

        $year = filter_var($year, FILTER_VALIDATE_INT);
        if ($year === false || $year < 1900 || $year > 2100) {
            throw new InvalidArgumentException('Рік народження: потрібне ціле число від 1900 до 2100.');
        }

        $this->name = trim($name);
        $this->month = $month;
        $this->year = $year;
    }

    /**
     * Знаки зодіаку місяця народження з межею між ними.
     */
    public function signs(): string
    {
        [$first, $lastDay, $second] = self::SIGNS[$this->month];
        $month = self::MONTHS[$this->month];

        return $first . ' (до ' . $lastDay . ' ' . $month . ') або ' . $second
            . ' (з ' . ($lastDay + 1) . ' ' . $month . ')';
    }

    /**
     * Звір року: цикл повторюється кожні 12 років.
     */
    public function animal(int $year): string
    {
        return self::ANIMALS[($year - 4) % 12];
    }

    public function render(): string
    {
        $html = '<p class="person">' . htmlspecialchars($this->name) . '</p>'
            . '<p class="born">народження: ' . str_pad((string) $this->month, 2, '0', STR_PAD_LEFT)
            . '.' . $this->year . '</p>'
            . '<dl class="facts">'
            . '<dt>Знак зодіаку</dt><dd>' . $this->signs() . '</dd>'
            . '<dt>Звір року</dt><dd>рік ' . $this->animal($this->year) . ' (' . $this->year . ')</dd>'
            . '</dl>';

        // Східний Новий рік настає між 21 січня і 20 лютого.
        if ($this->month <= 2) {
            $html .= '<p class="caption">Східний Новий рік настає між 21 січня та 20 лютого: '
                . 'якщо день народження раніше, це ще рік ' . $this->animal($this->year - 1) . '.</p>';
        }

        return $html;
    }
}

// Параметри з рядка браузера: ім’я, місяць і рік народження.
$params = [
    'name' => 'ім’я',
    'month' => 'місяць народження, 1–12',
    'year' => 'рік народження',
];
$example = ['name' => 'Марія', 'month' => 4, 'year' => 2002];

$result = null;
$error = null;

if (isset($_GET['name'], $_GET['month'], $_GET['year'])) {
    try {
        $zodiac = new Zodiac($_GET['name'], $_GET['month'], $_GET['year']);
        $result = $zodiac->render();
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">
    <style>
        :root {
            --desk: #d6dde3;
            --paper: #ffffff;
            --line: #1b2630;
            --thin: #8a98a4;
            --hair: #c5ced6;
            --grid: rgba(27, 38, 48, 0.05);
            --text: #1b2630;
            --muted: #56646f;
            --good: #1f7a4d;
            --bad: #b3261e;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-line: color-mix(in srgb, var(--accent) 82%, #000000);
            --font: "PT Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif;
            --mono: "PT Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--desk);
            color: var(--text);
            font: 400 18px/1.45 var(--font);
        }

        a {
            color: var(--accent-line);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-line);
            outline-offset: 2px;
        }

        /* Аркуш: зовнішня тонка межа, рамка з полем для підшивки ліворуч */
        .sheet {
            min-height: calc(100vh - 40px);
            padding: 12px 12px 12px 44px;
            border: 1px solid var(--thin);
            background:
                linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                var(--paper);
        }

        .frame {
            display: grid;
            grid-template-rows: 1fr auto;
            min-height: calc(100vh - 66px);
            border: 2px solid var(--line);
        }

        .field {
            padding: 26px 36px 28px;
        }

        .lab {
            margin: 0;
            color: var(--muted);
            font-size: 19px;
        }

        h1 {
            margin: 0 0 22px;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
        }

        h2 {
            margin: 0 0 10px;
            font-size: 21px;
            font-weight: 700;
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        /* Таблиця як специфікація: товсті лінії шапки, тонкі між рядками */
        table.spec {
            border-collapse: collapse;
            font-size: 17px;
        }

        table.spec th,
        table.spec td {
            padding: 5px 12px;
            border: 1px solid var(--line);
            text-align: left;
        }

        table.spec thead th {
            border-bottom-width: 2px;
            font-weight: 700;
        }

        table.spec td.num {
            text-align: right;
        }

        /* Основний напис, як на кресленні: правий нижній кут */
        .stamp {
            display: grid;
            grid-template-columns: 96px 150px 250px;
            grid-template-areas:
                "k1 v1 title"
                "k2 v2 title"
                "k3 v3 title"
                "org org sheet";
            justify-self: end;
            border-top: 2px solid var(--line);
            border-left: 2px solid var(--line);
            background: var(--paper);
            font-size: 16px;
        }

        .stamp > * {
            margin: 0;
            padding: 5px 10px;
            border-right: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
        }

        .stamp .key {
            color: var(--muted);
        }

        .stamp .title {
            grid-area: title;
            display: grid;
            place-content: center;
            border-right: 0;
            font-size: 19px;
            font-weight: 700;
            line-height: 1.25;
            text-align: center;
        }

        .stamp .org {
            grid-area: org;
            border-top: 1px solid var(--line);
            border-bottom: 0;
        }

        .stamp .sheet-no {
            grid-area: sheet;
            border-top: 1px solid var(--line);
            border-right: 0;
            border-bottom: 0;
            text-align: center;
        }

        .stamp .mono {
            font-family: var(--mono);
            font-size: 15px;
        }

        @media (max-width: 820px) {
            body {
                padding: 10px;
            }

            .sheet {
                padding: 8px;
            }

            .field {
                padding: 20px 16px;
            }

            .stamp {
                grid-template-columns: 80px 1fr;
                grid-template-areas:
                    "title title"
                    "k1 v1"
                    "k2 v2"
                    "k3 v3"
                    "org sheet";
                justify-self: stretch;
                border-left: 0;
            }
        }

        .head {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            justify-content: space-between;
            gap: 8px 24px;
            margin-bottom: 4px;
        }

        .sheets {
            display: flex;
            border: 1px solid var(--line);
            font-size: 17px;
        }

        .sheets a {
            padding: 3px 12px;
            color: var(--text);
            text-decoration: none;
        }

        .sheets a + a {
            border-left: 1px solid var(--line);
        }

        .sheets a[aria-current] {
            background: var(--accent);
            color: var(--accent-ink);
        }

        /* Кольори, якими малює результат об’єкт завдання */
        :root {
            --v-text: var(--text);
            --v-muted: var(--muted);
            --v-line: var(--line);
            --v-cell: var(--paper);
            --v-head: var(--muted);
            --v-mark: var(--accent);
            --v-mark-ink: var(--accent-ink);
            --v-soft: var(--accent-soft);
            --v-strong: var(--accent-line);
            --v-light: #ffffff;
            --v-dark: #56646f;
            --v-mono: var(--mono);
        }

        .task {
            max-width: 62rem;
            margin: 0 0 20px;
            color: var(--muted);
        }

        .work {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            border: 1px solid var(--line);
        }

        .result {
            min-height: 300px;
            padding: 16px 22px 22px;
            overflow-x: auto;
        }

        .params {
            padding: 16px 20px 20px;
            border-left: 1px solid var(--line);
        }

        .params table {
            width: 100%;
            font-size: 16px;
        }

        .params td:first-child {
            font-family: var(--mono);
            font-size: 15px;
        }

        .params small {
            display: block;
            color: var(--muted);
            font: 400 14px/1.3 var(--font);
        }

        .params .none {
            color: var(--muted);
        }

        .query {
            margin: 14px 0 0;
            color: var(--muted);
            font-size: 16px;
        }

        .query a {
            display: block;
            font: 400 14px/1.45 var(--mono);
            overflow-wrap: anywhere;
        }

        .error {
            margin: 0 0 14px;
            padding: 8px 12px;
            border: 2px solid var(--bad);
            color: var(--bad);
        }

        .button {
            display: inline-block;
            padding: 5px 16px;
            border: 2px solid var(--line);
            color: var(--text);
            font-weight: 700;
            text-decoration: none;
        }

        .button:hover {
            background: var(--accent);
            border-color: var(--accent);
            color: var(--accent-ink);
        }

        @media (max-width: 900px) {
            .work {
                grid-template-columns: 1fr;
            }

            .params {
                border-left: 0;
                border-top: 1px solid var(--line);
            }
        }

        .person {
            margin: 0;
            font-size: 32px;
            font-weight: 600;
            line-height: 1.2;
        }

        .born {
            margin: 2px 0 20px;
            color: var(--v-muted);
            font-family: var(--v-mono);
        }

        .facts {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 22px;
            margin: 0 0 16px;
            font-size: 18px;
        }

        .facts dt {
            color: var(--v-muted);
        }

        .facts dd {
            margin: 0;
            color: var(--v-strong);
            font-weight: 600;
        }

        .caption {
            max-width: 36rem;
            margin: 0;
            color: var(--v-muted);
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">

        <main class="field">
            <div class="head">
                <p class="lab">Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти</p>
                <nav class="sheets" aria-label="Програми роботи">
                    <a href="program1.php">Аркуш 1: програма № 1</a>
                    <a href="program2.php" aria-current="page">Аркуш 2: програма № 2</a>
                </nav>
            </div>
            <h1>Програма № 2. Зодіак</h1>
            <p class="task">Залежно від місяця, року народження та імені, які мають бути вказані в рядку
браузера як параметри, видати інформацію щодо знака зодіаку та звіра року
народження.</p>

            <div class="work">
                <section class="result">
                    <h2>Результат</h2>
<?php if ($result !== null) : ?>
                    <?= $result ?>

<?php elseif ($error !== null) : ?>
                    <p class="error"><?= htmlspecialchars($error) ?></p>
                    <a class="button" href="<?= htmlspecialchars($exampleUrl) ?>">Відкрити приклад</a>
<?php else : ?>
                    <p>Параметри в рядку браузера не задано. Допишіть їх до адреси сторінки або відкрийте приклад.</p>
                    <a class="button" href="<?= htmlspecialchars($exampleUrl) ?>">Відкрити приклад</a>
<?php endif; ?>
                </section>

                <aside class="params">
                    <h2>Параметри запиту</h2>
                    <table class="spec">
                        <thead>
                            <tr><th>Ім’я</th><th>Значення</th></tr>
                        </thead>
                        <tbody>
<?php foreach ($params as $name => $label) : ?>
                            <tr>
                                <td><?= $name ?><small><?= htmlspecialchars($label) ?></small></td>
<?php if (isset($_GET[$name]) && is_string($_GET[$name])) : ?>
                                <td><?= htmlspecialchars($_GET[$name]) ?></td>
<?php else : ?>
                                <td class="none">не задано</td>
<?php endif; ?>
                            </tr>
<?php endforeach; ?>
                        </tbody>
                    </table>
                    <p class="query">
                        Приклад:
                        <a href="<?= htmlspecialchars($exampleUrl) ?>"><?= htmlspecialchars(urldecode($exampleUrl)) ?></a>
                    </p>
                </aside>
            </div>
        </main>

        <footer class="stamp">
            <p class="key">Розробив</p>
            <p>%%PIB_SHORT%%</p>
            <p class="key">Група</p>
            <p class="mono">%%GROUP%%</p>
            <p class="key">Варіант</p>
            <p>13</p>
            <p class="title">Лабораторна робота № 2<br>Програма № 2</p>
            <p class="org">УДУНТ, кафедра ЕОМ</p>
            <p class="sheet-no">Аркуш 2 з 2</p>
        </footer>

    </div>
</div>
</body>
</html>
