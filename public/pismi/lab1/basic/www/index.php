<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 1. Індивідуальне завдання.
 *
 * За умовою програма має виводити ПІБ та навчальну групу студента. Поруч
 * показано кілька значень середовища – вони підтверджують, що сторінку
 * справді видав контейнер, а не локальний сервер.
 *
 * Дані беруться з рядка браузера, тому одним контейнером може скористатися
 * будь-хто:
 *     index.php?name=Іваненко+Іван+Іванович&group=101М
 *
 * Файл самодостатній: більше нічого доносити не потрібно.
 */

const DEFAULT_NAME = 'Іваненко Іван Іванович';
const DEFAULT_GROUP = '101М';

/** Екранування для виводу в HTML. */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Текстовий параметр рядка браузера з обрізанням зайвого. */
function text_param(string $name, string $default, int $limit = 80): string
{
    if (!isset($_GET[$name]) || !is_string($_GET[$name])) {
        return $default;
    }

    $value = trim($_GET[$name]);

    return $value === '' ? $default : mb_substr($value, 0, $limit);
}

$student = text_param('name', DEFAULT_NAME);
$group = text_param('group', DEFAULT_GROUP);

$environment = [
    'Версія PHP' => PHP_VERSION,
    'Інтерфейс PHP' => PHP_SAPI,
    'Веб-сервер' => $_SERVER['SERVER_SOFTWARE'] ?? 'невідомо',
    'Ім’я контейнера' => php_uname('n'),
    'Корінь сайту' => $_SERVER['DOCUMENT_ROOT'] ?? 'невідомо',
    'Час формування' => date('d.m.Y, H:i:s'),
];
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Лабораторна робота № 1</title>
    <style>
        body {
            margin: 2rem auto;
            max-width: 44rem;
            padding: 0 1rem;
            font-family: Georgia, "Times New Roman", serif;
            line-height: 1.6;
            color: #1b1b1b;
        }

        h1 { font-size: 1.5rem; }

        table { border-collapse: collapse; margin-top: 0.5rem; }

        td { border: 1px solid #999; padding: 0.3rem 0.7rem; }

        td.value { font-family: "Courier New", monospace; }

        .hint { color: #555; font-size: 0.9rem; }
    </style>
</head>
<body>

<h1>Лабораторна робота № 1</h1>

<p>Підготування платформи для розгортання web-додатку.</p>

<h2>Індивідуальне завдання</h2>

<p>
    Студент: <strong><?= h($student) ?></strong><br>
    Група: <strong><?= h($group) ?></strong>
</p>

<h2>Середовище виконання</h2>

<table>
    <?php foreach ($environment as $label => $value): ?>
        <tr>
            <td><?= h($label) ?></td>
            <td class="value"><?= h($value) ?></td>
        </tr>
    <?php endforeach; ?>
</table>

<p class="hint">
    Значення зчитані самим інтерпретатором під час формування відповіді.
    Повний звіт – на сторінці <a href="phpinfo.php">phpinfo</a>.
</p>

</body>
</html>
