<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Адреса мережі.
 *
 * Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічної
 * функції «І») IP-адреси мережі. Як початкові дані використати задані
 * вісьмома параметрами в рядку браузера IP-адресу та маску локального вузла
 * мережі.
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Адреса мережі: IP-адреса вузла «І» маска мережі.
 */
class NetworkAddress
{
    /** @var int[] чотири байти IP-адреси */
    private array $address;

    /** @var int[] чотири байти маски */
    private array $mask;

    private int $prefix;

    /**
     * @param mixed[] $address чотири байти адреси з рядка браузера
     * @param mixed[] $mask    чотири байти маски
     */
    public function __construct(array $address, array $mask)
    {
        $this->address = [];
        $this->mask = [];
        for ($i = 0; $i < 4; $i++) {
            $this->address[] = self::integer($address[$i], ($i + 1) . '-й байт адреси');
            $this->mask[] = self::integer($mask[$i], ($i + 1) . '-й байт маски');
        }

        // Маска правильна, лише якщо в ній спершу йдуть одиниці, а потім нулі.
        $bits = $this->bitString($this->mask);
        if (!preg_match('/^1*0*$/', $bits)) {
            throw new InvalidArgumentException('Маска: одиниці мають іти підряд, а за ними – нулі (наприклад, 255.255.240.0).');
        }
        $this->prefix = substr_count($bits, '1');
    }

    /**
     * Адреса мережі = адреса «І» маска, побайтово.
     *
     * @return int[]
     */
    public function network(): array
    {
        $network = [];
        for ($i = 0; $i < 4; $i++) {
            $network[] = $this->address[$i] & $this->mask[$i];
        }

        return $network;
    }

    public function render(): string
    {
        $rows = [
            ['IP-адреса вузла', $this->address, false],
            ['Маска мережі (/' . $this->prefix . ')', $this->mask, false],
            ['Адреса мережі = IP І маска', $this->network(), true],
        ];

        $html = '<table class="bits"><tr><th>Величина</th><th>Десятковий запис</th>'
            . '<th>Двійковий запис</th></tr>';
        foreach ($rows as [$name, $bytes, $answer]) {
            $html .= '<tr' . ($answer ? ' class="answer"' : '') . '>'
                . '<td>' . $name . '</td>'
                . '<td class="code">' . implode('.', $bytes) . '</td>'
                . '<td class="code">' . $this->binary($bytes) . '</td></tr>';
        }

        return $html . '</table><p class="caption">Біти вузлової частини (після перших '
            . $this->prefix . ') приглушено: «І» з нулями маски їх обнуляє.</p>';
    }

    /**
     * @param int[] $bytes
     */
    private function bitString(array $bytes): string
    {
        $bits = '';
        foreach ($bytes as $byte) {
            $bits .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }

        return $bits;
    }

    /**
     * Двійковий запис; біти вузлової частини – у span.net.
     *
     * @param int[] $bytes
     */
    private function binary(array $bytes): string
    {
        $bits = $this->bitString($bytes);
        $html = '';
        for ($i = 0; $i < 32; $i++) {
            if ($i > 0 && $i % 8 === 0) {
                $html .= '.';
            }
            $html .= $i >= $this->prefix ? '<span class="net">' . $bits[$i] . '</span>' : $bits[$i];
        }

        return $html;
    }

    private static function integer(mixed $value, string $what): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < 0 || $number > 255) {
            throw new InvalidArgumentException("$what: потрібне ціле число від 0 до 255.");
        }

        return $number;
    }
}

// Вісім параметрів з рядка браузера: чотири байти адреси й чотири байти маски.
$params = [
    'a1' => '1-й байт IP-адреси',
    'a2' => '2-й байт IP-адреси',
    'a3' => '3-й байт IP-адреси',
    'a4' => '4-й байт IP-адреси',
    'm1' => '1-й байт маски',
    'm2' => '2-й байт маски',
    'm3' => '3-й байт маски',
    'm4' => '4-й байт маски',
];
$example = ['a1' => 192, 'a2' => 168, 'a3' => 17, 'a4' => 43, 'm1' => 255, 'm2' => 255, 'm3' => 240, 'm4' => 0];

$result = null;
$error = null;

if (isset($_GET['a1'], $_GET['a2'], $_GET['a3'], $_GET['a4'], $_GET['m1'], $_GET['m2'], $_GET['m3'], $_GET['m4'])) {
    try {
        $network = new NetworkAddress(
            [$_GET['a1'], $_GET['a2'], $_GET['a3'], $_GET['a4']],
            [$_GET['m1'], $_GET['m2'], $_GET['m3'], $_GET['m4']]
        );
        $result = $network->render();
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

        .bits {
            border-collapse: collapse;
            font-size: 15px;
        }

        .bits th,
        .bits td {
            padding: 8px 10px;
            border-bottom: 1px solid var(--v-line);
            text-align: left;
        }

        .bits th {
            color: var(--v-head);
            font-weight: 400;
        }

        .bits .code {
            font-family: var(--v-mono);
            font-size: 14px;
            white-space: nowrap;
        }

        .bits .net {
            opacity: 0.45;
        }

        .bits tr.answer td {
            background: var(--v-soft);
            color: var(--v-strong);
            font-weight: 600;
        }

        .caption {
            margin: 14px 0 0;
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

    <h1>Програма № 2. Адреса мережі</h1>
    <p>Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічної
функції «І») IP-адреси мережі. Як початкові дані використати задані вісьмома
параметрами в рядку браузера IP-адресу та маску локального вузла мережі.</p>

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
