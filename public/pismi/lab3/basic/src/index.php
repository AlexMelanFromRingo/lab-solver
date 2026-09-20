<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 3. Довідник на MySQL з операціями CRUD.
 *
 * Тематику довідника методичні вказівки дозволяють обрати самостійно; обрано
 * розклад занять. Схема описана даними в lib/schedule.php, доступ до бази –
 * у lib/db.php, а ця сторінка лише показує записи таблицею та передає введене
 * на перевірку.
 *
 * Після кожної зміни сторінка відповідає переадресацією на себе саму: так
 * повторне натискання «оновити» в браузері не додає запис удруге.
 */

require __DIR__ . '/lib/schedule.php';
require __DIR__ . '/lib/db.php';

/** Екранування для виводу в HTML. */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$directory = schedule_directory();

$db = db_connect();
ensure_table($db, $directory);

$errors = [];
$form = [];
$editing = null;

// --- Зміна даних ----------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    $id = isset($_POST['id']) && is_numeric($_POST['id']) ? (int) $_POST['id'] : 0;

    if ($action === 'delete' && $id > 0) {
        delete_row($db, $directory, $id);
        header('Location: index.php?msg=' . rawurlencode('Запис видалено.'));

        exit;
    }

    $checked = validate_row($directory, $_POST);
    $errors = $checked['errors'];
    $form = $checked['values'];

    if ($errors === []) {
        if ($action === 'update' && $id > 0) {
            update_row($db, $directory, $id, $form);
            $message = 'Запис оновлено.';
        } else {
            insert_row($db, $directory, $form);
            $message = 'Запис додано.';
        }

        header('Location: index.php?msg=' . rawurlencode($message));

        exit;
    }

    if ($action === 'update' && $id > 0) {
        $editing = $id;
    }
}

// --- Читання --------------------------------------------------------------

$search = isset($_GET['q']) && is_string($_GET['q']) ? trim($_GET['q']) : '';
$rows = fetch_rows($db, $directory, $search);
$notice = isset($_GET['msg']) && is_string($_GET['msg']) ? $_GET['msg'] : null;

// Під час правки поля форми заповнюються значеннями обраного запису.
if ($editing === null && isset($_GET['edit']) && is_numeric($_GET['edit'])) {
    $found = fetch_row($db, $directory, (int) $_GET['edit']);
    if ($found !== null) {
        $editing = (int) $_GET['edit'];
        $form = $found;
    }
}

/** Поточне значення поля форми. */
function value_of(array $form, array $field): string
{
    return (string) ($form[$field['name']] ?? '');
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= h($directory['title']) ?></title>
    <style>
        body {
            margin: 2rem auto;
            max-width: 62rem;
            padding: 0 1rem;
            font-family: Georgia, "Times New Roman", serif;
            line-height: 1.6;
            color: #1b1b1b;
        }

        h1 { font-size: 1.5rem; margin-bottom: 0.2rem; }

        table { border-collapse: collapse; width: 100%; margin-top: 0.5rem; }

        th, td { border: 1px solid #999; padding: 0.35rem 0.6rem; text-align: left; }

        th { background: #f1f1f1; }

        input, select { font: inherit; padding: 0.25rem 0.4rem; }

        label { display: inline-block; margin: 0 0.8rem 0.6rem 0; }

        .notice { background: #e4f3e6; border: 1px solid #7bb587; padding: 0.5rem 0.8rem; }

        .errors { background: #fbeaea; border: 1px solid #c58b86; padding: 0.5rem 0.8rem; }

        .hint { color: #555; font-size: 0.9rem; }
    </style>
</head>
<body>

<h1><?= h($directory['title']) ?></h1>
<p class="hint"><?= h($directory['lede']) ?></p>

<?php if ($notice !== null): ?>
    <p class="notice"><?= h($notice) ?></p>
<?php endif; ?>

<?php if ($errors !== []): ?>
    <div class="errors">
        <?php foreach ($errors as $message): ?>
            <div><?= h($message) ?></div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<h2>Пошук</h2>

<form method="get">
    <label>
        Текст
        <input type="text" name="q" value="<?= h($search) ?>" size="30">
    </label>
    <button type="submit">Знайти</button>
    <?php if ($search !== ''): ?>
        <a href="index.php">скинути</a>
    <?php endif; ?>
</form>

<h2>Записи<?= $search !== '' ? ' за запитом «' . h($search) . '»' : '' ?></h2>

<?php if ($rows === []): ?>
    <p class="hint">Записів немає.</p>
<?php else: ?>
    <table>
        <tr>
            <?php foreach ($directory['fields'] as $f): ?>
                <th><?= h($f['label']) ?></th>
            <?php endforeach; ?>
            <th>Дія</th>
        </tr>
        <?php foreach ($rows as $row): ?>
            <tr>
                <?php foreach ($directory['fields'] as $f): ?>
                    <td><?= h((string) $row[$f['name']]) ?></td>
                <?php endforeach; ?>
                <td>
                    <a href="index.php?edit=<?= (int) $row['id'] ?>">змінити</a>
                    <form method="post" style="display:inline">
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">
                        <button type="submit">видалити</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
<?php endif; ?>

<h2><?= $editing === null ? 'Додати запис' : 'Змінити запис' ?></h2>

<form method="post">
    <input type="hidden" name="action" value="<?= $editing === null ? 'insert' : 'update' ?>">
    <?php if ($editing !== null): ?>
        <input type="hidden" name="id" value="<?= (int) $editing ?>">
    <?php endif; ?>

    <?php foreach ($directory['fields'] as $f): ?>
        <label>
            <?= h($f['label']) ?>
            <?php if ($f['type'] === 'enum'): ?>
                <select name="<?= h($f['name']) ?>">
                    <?php foreach ($f['options'] as $option): ?>
                        <option<?= value_of($form, $f) === $option ? ' selected' : '' ?>>
                            <?= h($option) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            <?php elseif ($f['type'] === 'time'): ?>
                <input type="time" name="<?= h($f['name']) ?>" value="<?= h(value_of($form, $f)) ?>">
            <?php else: ?>
                <input type="text" name="<?= h($f['name']) ?>"
                       value="<?= h(value_of($form, $f)) ?>"
                       size="<?= isset($f['wide']) ? 40 : 14 ?>">
            <?php endif; ?>
        </label>
    <?php endforeach; ?>

    <button type="submit"><?= $editing === null ? 'Додати' : 'Зберегти' ?></button>
    <?php if ($editing !== null): ?>
        <a href="index.php">скасувати</a>
    <?php endif; ?>
</form>

<p class="hint">
    Значення записуються підготовленими запитами: дані з форми не потрапляють
    у текст запиту, тому підставити в нього щось стороннє неможливо.
</p>

</body>
</html>
