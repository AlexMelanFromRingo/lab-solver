<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Програма № 2: Адреса вузла.
 *
 * Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічних
 * функцій «І» та «НЕ») IP-адреси вузла. Як початкові дані використати
 * адресу, задану п’ятьма параметрами в рядку браузера (наприклад, для мережі
 * 192.168.0.0/16 параметрами будуть 192, 168, 0, 0, 16).
 *
 * Завдання виконує створений об’єкт; параметри приходять із рядка браузера
 * (масив $_GET) і перед використанням перевіряються.
 */

/**
 * Адреса вузла: та частина IP-адреси, що лишається після логічного «І»
 * з інвертованою («НЕ») маскою мережі.
 */
class HostAddress
{
    /** @var int[] чотири байти адреси */
    private array $address;
    private int $prefix;

    public function __construct(mixed $b1, mixed $b2, mixed $b3, mixed $b4, mixed $prefix)
    {
        $this->address = [];
        foreach ([$b1, $b2, $b3, $b4] as $i => $byte) {
            $this->address[] = self::integer($byte, 0, 255, ($i + 1) . '-й байт адреси');
        }
        $this->prefix = self::integer($prefix, 0, 32, 'Довжина префікса');
    }

    /**
     * Маска мережі за довжиною префікса: спершу одиниці, потім нулі.
     *
     * @return int[]
     */
    public function mask(): array
    {
        $bits = $this->prefix === 0 ? 0 : (0xFFFFFFFF << (32 - $this->prefix)) & 0xFFFFFFFF;

        return self::bytes($bits);
    }

    /**
     * Інвертована маска («НЕ»).
     *
     * @return int[]
     */
    public function inverted(): array
    {
        return array_map(fn (int $byte): int => ~$byte & 0xFF, $this->mask());
    }

    /**
     * Адреса вузла = адреса «І» («НЕ» маска).
     *
     * @return int[]
     */
    public function host(): array
    {
        $inverted = $this->inverted();

        return array_map(fn (int $byte, int $i): int => $byte & $inverted[$i], $this->address, [0, 1, 2, 3]);
    }

    public function render(): string
    {
        $rows = [
            ['IP-адреса', $this->address, false],
            ['Маска /' . $this->prefix, $this->mask(), false],
            ['НЕ маска', $this->inverted(), false],
            ['Адреса вузла = IP І (НЕ маска)', $this->host(), true],
        ];

        $html = '<table class="bits"><tr><th>Величина</th><th>Десятковий запис</th>'
            . '<th>Двійковий запис</th></tr>';
        foreach ($rows as [$name, $bytes, $answer]) {
            $html .= '<tr' . ($answer ? ' class="answer"' : '') . '>'
                . '<td>' . $name . '</td>'
                . '<td class="code">' . implode('.', $bytes) . '</td>'
                . '<td class="code">' . $this->binary($bytes) . '</td></tr>';
        }

        return $html . '</table><p class="caption">Перші ' . $this->prefix
            . ' біт (мережева частина) приглушено: після «І» з інвертованою маскою там лишаються нулі.</p>';
    }

    /**
     * Двійковий запис байтів; біти мережевої частини – у span.net.
     *
     * @param int[] $bytes
     */
    private function binary(array $bytes): string
    {
        $bits = '';
        foreach ($bytes as $byte) {
            $bits .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }

        $html = '';
        for ($i = 0; $i < 32; $i++) {
            if ($i > 0 && $i % 8 === 0) {
                $html .= '.';
            }
            $html .= $i < $this->prefix ? '<span class="net">' . $bits[$i] . '</span>' : $bits[$i];
        }

        return $html;
    }

    /**
     * @return int[]
     */
    private static function bytes(int $value): array
    {
        return [($value >> 24) & 0xFF, ($value >> 16) & 0xFF, ($value >> 8) & 0xFF, $value & 0xFF];
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

// П’ять параметрів з рядка браузера: чотири байти адреси та довжина префікса.
$params = [
    'b1' => '1-й байт адреси',
    'b2' => '2-й байт адреси',
    'b3' => '3-й байт адреси',
    'b4' => '4-й байт адреси',
    'prefix' => 'довжина префікса (маска)',
];
$example = ['b1' => 192, 'b2' => 168, 'b3' => 17, 'b4' => 43, 'prefix' => 16];

$result = null;
$error = null;

if (isset($_GET['b1'], $_GET['b2'], $_GET['b3'], $_GET['b4'], $_GET['prefix'])) {
    try {
        $address = new HostAddress($_GET['b1'], $_GET['b2'], $_GET['b3'], $_GET['b4'], $_GET['prefix']);
        $result = $address->render();
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

    <h1>Програма № 2. Адреса вузла</h1>
    <p>Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічних
функцій «І» та «НЕ») IP-адреси вузла. Як початкові дані використати адресу,
задану п’ятьма параметрами в рядку браузера (наприклад, для мережі
192.168.0.0/16 параметрами будуть 192, 168, 0, 0, 16).</p>

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
