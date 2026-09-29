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
     * Двійковий запис байтів; біти мережевої частини — у span.net.
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
    <h1>Лабораторна робота № 2. Програма № 2</h1>
    <p>Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічних
функцій «І» та «НЕ») IP-адреси вузла. Як початкові дані використати адресу,
задану п’ятьма параметрами в рядку браузера (наприклад, для мережі
192.168.0.0/16 параметрами будуть 192, 168, 0, 0, 16).</p>

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
