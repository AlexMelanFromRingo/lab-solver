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
    <p>Відобразити у таблиці у двійковій формі розрахунок (за допомогою логічної
функції «І») IP-адреси мережі. Як початкові дані використати задані вісьмома
параметрами в рядку браузера IP-адресу та маску локального вузла мережі.</p>

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
