<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 1. Індивідуальне завдання: вивести ПІБ та навчальну
 * групу студента.
 *
 * Сторінка водночас працює як паспорт оточення – показує, на чому саме її
 * виконано: версію PHP, інтерфейс, веб-сервер та встановлені розширення. Так
 * знімок екрана до звіту підтверджує і завдання, і працездатність контейнера.
 *
 * Дані студента беруться з рядка браузера, тому одним контейнером може
 * скористатися будь-хто:
 *     index.php?name=Іваненко+Іван+Іванович&group=101М
 */

require __DIR__ . '/_shared/chrome.php';

const DEFAULT_NAME = 'Іваненко Іван Іванович';
const DEFAULT_GROUP = '101М';

/**
 * Читає текстовий параметр рядка браузера, обрізаючи зайве.
 */
function text_param(string $name, string $default, int $limit = 80): string
{
    if (!isset($_GET[$name]) || !is_string($_GET[$name])) {
        return $default;
    }

    $value = trim($_GET[$name]);

    return $value === '' ? $default : mb_substr($value, 0, $limit);
}

/**
 * Розширення, які знадобляться в наступних роботах курсу.
 *
 * @return array<string, string>
 */
function required_extensions(): array
{
    return [
        'mysqli' => 'MySQL у роботі № 3',
        'pdo_mysql' => 'той самий доступ через PDO',
        'zip' => 'розпакування архівів',
    ];
}

$student = text_param('name', DEFAULT_NAME);
$group = text_param('group', DEFAULT_GROUP);
$seat = ust_int_param('n', 7, 1, 30);
$accent = ust_accent($seat);

$environment = [
    'Версія PHP' => PHP_VERSION,
    'Інтерфейс PHP' => PHP_SAPI,
    'Веб-сервер' => $_SERVER['SERVER_SOFTWARE'] ?? 'невідомо',
    'Образ контейнера' => 'php:8.2-apache',
    'Ім’я контейнера' => php_uname('n'),
    'Ядро системи' => php_uname('s') . ' ' . php_uname('r'),
    'Корінь сайту' => $_SERVER['DOCUMENT_ROOT'] ?? 'невідомо',
    'Час формування' => date('d.m.Y, H:i:s'),
];

ust_head('ЛР1 · ' . $student, $accent['hex']);
?>
<body>
<div class="sheet">

    <div class="origin">
        Український державний університет науки і технологій<br>
        Кафедра електронних обчислювальних машин<br>
        Лабораторна робота № 1 · підготування платформи для розгортання web-додатку
    </div>

    <section class="plate">
        <p class="plate__role">Роботу виконав</p>
        <h1 class="plate__name"><?= h($student) ?></h1>
        <div>
            <span class="plate__group-label">студент групи</span>
            <span class="plate__group"><?= h($group) ?></span>
        </div>
    </section>

    <section class="section">
        <h2 class="section__title">Паспорт оточення</h2>
        <dl class="rows">
<?php foreach ($environment as $label => $value) : ?>
            <div class="row">
                <dt><?= h($label) ?></dt>
                <dd<?= $label === 'Образ контейнера' ? ' class="accent"' : '' ?>><?= h($value) ?></dd>
            </div>
<?php endforeach; ?>
        </dl>
        <p class="hint" style="padding-top: 0.9rem;">
            Значення зчитані самим інтерпретатором під час формування відповіді:
            сторінка не переказує налаштування, а показує стан, у якому працює.
        </p>
    </section>

    <section class="section">
        <h2 class="section__title">Розширення PHP</h2>
        <div class="ext">
<?php foreach (required_extensions() as $extension => $purpose) : ?>
<?php $loaded = extension_loaded($extension); ?>
            <span class="ext__item">
                <span class="ext__dot<?= $loaded ? '' : ' ext__dot--off' ?>"></span>
                <span class="ext__name"><?= h($extension) ?></span>
                <span class="ext__note"><?= h($purpose) ?></span>
            </span>
<?php endforeach; ?>
        </div>
        <p class="hint" style="padding-top: 0.9rem;">
            Ставляться командою контейнера під час запуску:
            <code>docker-php-ext-install mysqli pdo pdo_mysql zip</code>.
        </p>
    </section>

    <section class="section">
        <h2 class="section__title">Підставити інші дані</h2>
        <form class="form" method="get" action="index.php">
            <div class="field field--wide">
                <label for="name">Прізвище, ім’я та по батькові</label>
                <input type="text" id="name" name="name" value="<?= h($student) ?>" required>
            </div>
            <div class="field">
                <label for="group">Група</label>
                <input type="text" id="group" name="group" size="8" value="<?= h($group) ?>" required>
            </div>
            <div class="field">
                <label for="n">Номер у списку</label>
                <input type="number" id="n" name="n" min="1" max="30" value="<?= h($seat) ?>">
            </div>
            <button type="submit">Показати</button>
        </form>
        <p class="hint" style="padding-top: 1rem;">
            Прізвище в коді не вшите: ПІБ, група та номер приходять рядком браузера.
            Номер задає акцентний колір — зараз це <?= h($accent['name']) ?>.
        </p>
    </section>

    <p class="foot hint">
        Повний звіт інтерпретатора — на сторінці <a href="phpinfo.php">phpinfo</a>.
    </p>

</div>
</body>
</html>
