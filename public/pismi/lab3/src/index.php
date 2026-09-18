<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 3. Довідник на MySQL з операціями CRUD.
 *
 * Тематику довідника методичні вказівки дозволяють обрати самостійно; обрано
 * розклад занять магістратури. Схема довідника описана даними в
 * lib/schedule.php, тому створення таблиці, форма введення та перевірки
 * значень будуються з одного опису.
 *
 * Після кожної зміни сторінка відповідає переадресацією на себе саму. Так
 * повторне натискання «оновити» в браузері не додає запис удруге.
 */

require __DIR__ . '/_shared/chrome.php';
require __DIR__ . '/lib/schedule.php';
require __DIR__ . '/lib/db.php';

$directory = schedule_directory();

$db = db_connect();
ensure_table($db, $directory);

$notice = null;
$errors = [];
$editing = null;
$form = [];

// --- Зміна даних: додавання, оновлення, видалення --------------------------

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    $id = isset($_POST['id']) && is_numeric($_POST['id']) ? (int) $_POST['id'] : 0;

    if ($action === 'delete' && $id > 0) {
        delete_row($db, $directory, $id);
        redirect_back('Запис видалено.');
    }

    if ($action === 'save') {
        $checked = validate_row($directory, $_POST);
        $errors = $checked['errors'];
        $form = $checked['values'];

        if ($errors === []) {
            if ($id > 0) {
                update_row($db, $directory, $id, $checked['values']);
                redirect_back('Запис оновлено.');
            }

            insert_row($db, $directory, $checked['values']);
            redirect_back('Запис додано.');
        }

        // Значення лишаються у формі, щоб не набирати їх заново.
        $editing = $id > 0 ? $id : null;
    }
}

// --- Читання ----------------------------------------------------------------

$search = isset($_GET['q']) && is_string($_GET['q']) ? trim($_GET['q']) : '';
$rows = fetch_rows($db, $directory, $search);
$total = count(fetch_rows($db, $directory));

if ($editing === null && isset($_GET['edit']) && is_numeric($_GET['edit'])) {
    $found = fetch_row($db, $directory, (int) $_GET['edit']);
    if ($found !== null) {
        $editing = (int) $found['id'];
        $form = $found;
    }
}

if (isset($_GET['msg']) && is_string($_GET['msg'])) {
    $notice = $_GET['msg'];
}

/**
 * Переадресація на себе після зміни даних (схема «запит – переадресація – показ»).
 */
function redirect_back(string $message): never
{
    header('Location: index.php?' . http_build_query(['msg' => $message]));

    exit;
}

ust_head('ЛР3 · ' . $directory['title'], ust_accent(7)['hex']);

/**
 * Пари, згруповані за днем тижня у порядку самого розкладу.
 *
 * @param list<array<string, mixed>> $rows
 * @return array<string, list<array<string, mixed>>>
 */
function group_by_day(array $rows, array $order): array
{
    $grouped = [];
    foreach ($order as $day) {
        $grouped[$day] = [];
    }

    foreach ($rows as $row) {
        $grouped[$row['weekday']][] = $row;
    }

    return array_filter($grouped, static fn (array $slots): bool => $slots !== []);
}

/** Порядок днів береться з опису поля, а не з алфавіту. */
$weekdayField = null;
foreach ($directory['fields'] as $field) {
    if ($field['name'] === 'weekday') {
        $weekdayField = $field;
    }
}
$days = group_by_day($rows, $weekdayField['options'] ?? []);
?>
<body>
<div class="board">

    <header class="topbar">
        <span>Український державний університет науки і технологій · кафедра ЕОМ</span>
        <span>Лабораторна робота № 3 · MySQL як база даних web-додатку</span>
        <span>Сливець О. Д. · 953М</span>
    </header>

    <div class="headline">
        <h1><?= h($directory['title']) ?></h1>
        <span class="headline__count"><?= h($total) ?> пар</span>
    </div>
    <p class="lede"><?= h($directory['lede']) ?></p>

<?php if ($notice !== null) : ?>
    <p class="notice"><?= h($notice) ?></p>
<?php endif; ?>

<?php if ($rows === []) : ?>
    <p class="empty">
        <?= $search === ''
            ? 'Записів немає. Додайте перший у формі нижче.'
            : 'За запитом «' . h($search) . '» нічого не знайдено.' ?>
    </p>
<?php else : ?>
<?php foreach ($days as $day => $slots) : ?>
    <section class="day">
        <h2 class="day__name">
            <?= h($day) ?>
            <span class="day__count"><?= h(count($slots)) ?> пар</span>
        </h2>
<?php foreach ($slots as $slot) : ?>
        <div class="slot">
            <span class="slot__time"><?= h(format_value(['type' => 'time'], $slot['starts_at'])) ?></span>
<?php
$week = (string) $slot['week'];
$weekClass = match ($week) {
    'Чисельник' => ' slot__week--num',
    'Знаменник' => ' slot__week--den',
    default => '',
};
?>
            <span class="slot__week<?= $weekClass ?>"><?= h($week) ?></span>
            <span class="slot__subject"><?= h($slot['subject']) ?></span>
            <span class="slot__teacher"><?= h($slot['teacher']) ?></span>
            <span class="slot__actions">
                <span class="slot__room"><?= h($slot['room']) ?></span>
                <a href="index.php?<?= h(http_build_query(['edit' => $slot['id']])) ?>">змінити</a>
                <form method="post" style="display: inline;"
                      onsubmit="return confirm('Видалити пару о <?= h(format_value(['type' => 'time'], $slot['starts_at'])) ?>?');">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= h($slot['id']) ?>">
                    <button type="submit">видалити</button>
                </form>
            </span>
        </div>
<?php endforeach; ?>
    </section>
<?php endforeach; ?>
<?php endif; ?>

    <section class="tools">
        <h2><?= $editing !== null ? 'Змінити пару № ' . h($editing) : 'Додати пару' ?></h2>

<?php if ($errors !== []) : ?>
        <p class="errors"><?= h(implode(' ', $errors)) ?></p>
<?php endif; ?>

        <form method="post" action="index.php">
            <input type="hidden" name="action" value="save">
<?php if ($editing !== null) : ?>
            <input type="hidden" name="id" value="<?= h($editing) ?>">
<?php endif; ?>
            <div class="form">
<?php foreach ($directory['fields'] as $f) : ?>
                <div class="field<?= ($f['wide'] ?? false) ? ' field--wide' : '' ?>">
                    <label for="<?= h($f['name']) ?>"><?= h($f['label']) ?></label>
<?php if ($f['type'] === 'enum') : ?>
                    <select id="<?= h($f['name']) ?>" name="<?= h($f['name']) ?>">
<?php foreach ($f['options'] as $option) : ?>
                        <option value="<?= h($option) ?>"
                            <?= ($form[$f['name']] ?? '') === $option ? 'selected' : '' ?>>
                            <?= h($option) ?>
                        </option>
<?php endforeach; ?>
                    </select>
<?php else : ?>
                    <input type="<?= h(input_type($f)) ?>" id="<?= h($f['name']) ?>"
                           name="<?= h($f['name']) ?>"
                           value="<?= h((string) ($form[$f['name']] ?? '')) ?>"
                           <?= isset($f['min']) ? 'min="' . h($f['min']) . '"' : '' ?>
                           <?= isset($f['max']) ? 'max="' . h($f['max']) . '"' : '' ?>>
<?php endif; ?>
                </div>
<?php endforeach; ?>
                <button type="submit"><?= $editing !== null ? 'Зберегти' : 'Додати' ?></button>
<?php if ($editing !== null) : ?>
                <a href="index.php">скасувати</a>
<?php endif; ?>
            </div>
        </form>
    </section>

    <section class="tools">
        <h2>Пошук</h2>
        <form class="form" method="get" action="index.php">
            <div class="field field--wide">
                <label for="q">За текстовими полями</label>
                <input type="text" id="q" name="q" value="<?= h($search) ?>">
            </div>
            <button type="submit">Знайти</button>
<?php if ($search !== '') : ?>
            <a href="index.php">скинути</a>
<?php endif; ?>
        </form>
    </section>

    <section class="tools">
        <h2>Схема таблиці</h2>
        <p class="hint">
            Запит складається з опису схеми й виконується під час першого відкриття
            сторінки. Той самий запит можна виконати вручну у вкладці SQL
            <a href="http://localhost:8093/">phpMyAdmin</a>.
        </p>
        <div class="schema"><?= h(create_table_sql($directory)) ?></div>
    </section>

</div>
</body>
</html>

<?php
$db->close();

/**
 * Тип поля введення для HTML-форми.
 *
 * @param array<string, mixed> $field
 */
function input_type(array $field): string
{
    return match ($field['type']) {
        'int', 'decimal' => 'number',
        'date' => 'date',
        'time' => 'time',
        default => 'text',
    };
}

/**
 * Значення у вигляді, придатному для показу в таблиці.
 *
 * @param array<string, mixed> $field
 */
function format_value(array $field, mixed $value): string
{
    if ($field['type'] === 'time') {
        // MySQL віддає час із секундами; у розкладі вони лише заважають.
        return substr((string) $value, 0, 5);
    }

    if ($field['type'] === 'decimal') {
        return number_format((float) $value, 2, ',', ' ');
    }

    return (string) $value;
}
