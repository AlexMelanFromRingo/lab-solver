<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 3. Використання MySQL у якості бази даних web-додатку.
 *
 * Довідник «Завдання (TODO)»: таблиця `todo` у базі appdb.
 * Таблицю створює запит із table.sql (phpMyAdmin, вкладка SQL).
 * Сторінка реалізує операції CRUD – додавання, перегляд, редагування й
 * видалення записів – і пошук з фільтром за полем «Статус».
 * Усі запити з даними користувача – підготовлені (prepare + bind_param).
 */

/** Допустимі значення поля «Статус». */
const STATUS_OPTIONS = ['Нове', 'В роботі', 'Виконано'];

/** Допустимі значення поля «Пріоритет». */
const PRIORITY_OPTIONS = ['Низький', 'Середній', 'Високий'];

/**
 * Підключення до MySQL.
 *
 * Контейнер бази запускається довше, ніж PHP, тож одразу після
 * docker compose up перша спроба може не вдатися: вона повторюється
 * до 10 разів з паузою в секунду.
 */
function connect(): ?mysqli
{
    for ($attempt = 1; $attempt <= 10; $attempt++) {
        try {
            $mysqli = new mysqli('db', 'appuser', 'apppass', 'appdb');
            $mysqli->set_charset('utf8mb4');

            return $mysqli;
        } catch (mysqli_sql_exception $e) {
            sleep(1);
        }
    }

    return null;
}

/**
 * Значення з форми (POST) без пробілів по краях.
 */
function post(string $name): string
{
    $value = $_POST[$name] ?? '';

    return is_string($value) ? trim($value) : '';
}

/**
 * Параметр рядка браузера (пошук, фільтр, редагування).
 */
function query(string $name): string
{
    $value = $_GET[$name] ?? '';

    return is_string($value) ? trim($value) : '';
}

/**
 * Екранування значення для виводу в HTML.
 */
function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Форма слова для числа: 1 завдання, 2 завдання, 5 завдань.
 */
function plural(int $n, string $one, string $few, string $many): string
{
    if ($n % 10 === 1 && $n % 100 !== 11) {
        return $one;
    }

    return $n % 10 >= 2 && $n % 10 <= 4 && ($n % 100 < 12 || $n % 100 > 14) ? $few : $many;
}

/**
 * Значення полів із форми та перелік помилок перевірки.
 *
 * @return array{0: array<string, string>, 1: string[]}
 */
function read_form(): array
{
    $values = [
        'title' => post('title'),
        'description' => post('description'),
        'status' => post('status'),
        'priority' => post('priority'),
        'deadline' => post('deadline'),
    ];
    $errors = [];

    if ($values['title'] === '' || mb_strlen($values['title']) > 150) {
        $errors[] = 'Назва: обов’язкове поле, до 150 символів.';
    }
    if ($values['description'] === '' || mb_strlen($values['description']) > 255) {
        $errors[] = 'Опис: обов’язкове поле, до 255 символів.';
    }
    if (!in_array($values['status'], STATUS_OPTIONS, true)) {
        $errors[] = 'Статус: оберіть значення зі списку.';
    }
    if (!in_array($values['priority'], PRIORITY_OPTIONS, true)) {
        $errors[] = 'Пріоритет: оберіть значення зі списку.';
    }
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $values['deadline'], $d) || !checkdate((int) $d[2], (int) $d[3], (int) $d[1])) {
        $errors[] = 'Дедлайн: потрібна дата у форматі РРРР-ММ-ДД.';
    }

    return [$values, $errors];
}

/**
 * Сторінка-повідомлення, коли працювати з таблицею ще не можна.
 */
function stop(string $title, string $text): never
{
    http_response_code(503);
    echo '<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        . '<title>' . h($title) . '</title><style>body{margin:0;min-height:100vh;background:#0f1a22;color:#e7edf2;font:16px/1.6 system-ui,sans-serif}main{max-width:640px;margin:15vh auto;padding:28px 36px;border:1px solid rgba(206,222,236,.2);border-radius:16px;background:rgba(206,222,236,.06)}h1{margin:0 0 8px;font-size:24px}a,code{color:%%ACCENT%%;filter:brightness(1.6)}</style></head>'
        . '<body><main><h1>' . h($title) . '</h1>' . $text . '</main></body></html>';
    exit;
}

$mysqli = connect();
if ($mysqli === null) {
    stop('База даних запускається', '<p>MySQL ще не приймає підключень. Оновіть сторінку за кілька секунд.</p>');
}

// Таблицю створюють вручну запитом із table.sql (етап 2 роботи).
if ($mysqli->query("SHOW TABLES LIKE 'todo'")->num_rows === 0) {
    stop('Таблиці ще немає', '<p>У базі appdb немає таблиці <code>todo</code>. '
        . 'Відкрийте phpMyAdmin (<a href="http://localhost:8081">localhost:8081</a>), оберіть базу appdb '
        . 'і виконайте у вкладці SQL запит із файла table.sql.</p>');
}

$errors = [];
$form = [
    'title' => '',
    'description' => '',
    'status' => '',
    'priority' => '',
    'deadline' => '',
];
$editId = 0;

// Повідомлення після переадресації (див. обробку форм нижче).
$messages = ['added' => 'Запис додано.', 'updated' => 'Зміни збережено.', 'deleted' => 'Запис видалено.'];
$message = $messages[query('done')] ?? '';

// Обробка додавання запису
if (isset($_POST['add'])) {
    [$form, $errors] = read_form();

    if ($errors === []) {
        $stmt = $mysqli->prepare('INSERT INTO `todo` (`title`, `description`, `status`, `priority`, `deadline`) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssss', $form['title'], $form['description'], $form['status'], $form['priority'], $form['deadline']);
        $stmt->execute();
        $stmt->close();

        // Після зміни даних – переадресація: оновлення сторінки не повторить запит.
        header('Location: index.php?done=added');
        exit;
    }
}

// Обробка збереження змін
if (isset($_POST['update'])) {
    $editId = (int) post('id');
    [$form, $errors] = read_form();

    if ($errors === []) {
        $stmt = $mysqli->prepare('UPDATE `todo` SET `title` = ?, `description` = ?, `status` = ?, `priority` = ?, `deadline` = ? WHERE `id` = ?');
        $stmt->bind_param('sssssi', $form['title'], $form['description'], $form['status'], $form['priority'], $form['deadline'], $editId);
        $stmt->execute();
        $stmt->close();

        header('Location: index.php?done=updated');
        exit;
    }
}

// Обробка видалення запису
if (isset($_POST['delete'])) {
    $id = (int) post('id');
    $stmt = $mysqli->prepare('DELETE FROM `todo` WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();

    header('Location: index.php?done=deleted');
    exit;
}

// Редагування: index.php?edit=ID підставляє запис у форму
if ($editId === 0 && query('edit') !== '') {
    $id = (int) query('edit');
    $stmt = $mysqli->prepare('SELECT `title`, `description`, `status`, `priority`, `deadline` FROM `todo` WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $editId = $id;
        $form = [
            'title' => (string) $row['title'],
            'description' => (string) $row['description'],
            'status' => (string) $row['status'],
            'priority' => (string) $row['priority'],
            'deadline' => (string) $row['deadline'],
        ];
    }
}

// Пошук і фільтр
$search = query('q');
$filter = query('status');
$where = [];
$types = '';
$params = [];

if ($search !== '') {
    // Підрядок у текстових полях; символи % і _ у запиті – звичайні символи.
    $like = '%' . addcslashes($search, '%_\\') . '%';
    $where[] = '(`title` LIKE ? OR `description` LIKE ? OR `status` LIKE ? OR `priority` LIKE ?)';
    $types .= 'ssss';
    array_push($params, $like, $like, $like, $like);
}
if (in_array($filter, STATUS_OPTIONS, true)) {
    $where[] = '`status` = ?';
    $types .= 's';
    $params[] = $filter;
}

// Отримання записів
$sql = 'SELECT `id`, `title`, `description`, `status`, `priority`, `deadline` FROM `todo`'
    . ($where !== [] ? ' WHERE ' . implode(' AND ', $where) : '')
    . ' ORDER BY `deadline`';
$stmt = $mysqli->prepare($sql);
if ($params !== []) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$total = (int) $mysqli->query('SELECT COUNT(*) FROM `todo`')->fetch_row()[0];
$mysqli->close();
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Завдання (TODO) – лабораторна робота № 3</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
    <style>
        :root {
            --field: #0f1a22;
            --field-deep: #081018;
            --glass: rgba(206, 222, 236, 0.055);
            --glass-strong: rgba(206, 222, 236, 0.09);
            --edge: rgba(206, 222, 236, 0.13);
            --edge-strong: rgba(206, 222, 236, 0.24);
            --ink: #e7edf2;
            --muted: #93a4b2;
            --good: #7fd1a8;
            --bad: #ff9b8f;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-text: color-mix(in srgb, var(--accent) 52%, #ffffff);
            --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
            --mono: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
        }

        * {
            box-sizing: border-box;
        }

        html {
            background: var(--field-deep);
        }

        body {
            margin: 0;
            min-height: 100vh;
            color: var(--ink);
            font: 400 16px/1.55 var(--sans);
            background:
                radial-gradient(760px 520px at 6% -12%, color-mix(in srgb, var(--accent) 36%, transparent), transparent 72%),
                radial-gradient(900px 640px at 105% 112%, rgba(52, 96, 128, 0.5), transparent 70%),
                linear-gradient(155deg, #13222f 0%, var(--field) 48%, var(--field-deep) 100%);
            background-attachment: fixed;
            isolation: isolate;
        }

        /* Великий профіль рейки за склом: акрилові панелі розмивають його край */
        body::before {
            content: "";
            position: fixed;
            right: -170px;
            bottom: -330px;
            z-index: -1;
            width: 820px;
            height: 820px;
            background: var(--accent);
            opacity: 0.2;
            transform: rotate(-14deg);
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
        }

        a {
            color: var(--accent-text);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-text);
            outline-offset: 2px;
        }

        .page {
            max-width: 1180px;
            margin: 0 auto;
            padding: 26px 40px 56px;
        }

        .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 30px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.35;
        }

        .top .lab {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .top svg {
            flex: none;
            width: 30px;
            height: 30px;
            color: var(--accent-text);
        }

        .top b {
            display: block;
            color: var(--ink);
            font-weight: 500;
        }

        .top .who {
            text-align: right;
        }

        .glass {
            border: 1px solid var(--edge);
            border-radius: 16px;
            background: var(--glass);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            backdrop-filter: blur(22px) saturate(150%);
        }

        .glass.strong {
            border-color: var(--edge-strong);
            background: var(--glass-strong);
        }

        h1 {
            margin: 0 0 6px;
            font-size: 30px;
            font-weight: 600;
            line-height: 1.2;
            letter-spacing: -0.01em;
        }

        h2 {
            margin: 0 0 14px;
            font-size: 17px;
            font-weight: 500;
        }

        .lede {
            max-width: 64rem;
            margin: 0 0 24px;
            color: var(--muted);
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        @media (max-width: 900px) {
            .page {
                padding: 20px 18px 40px;
            }

            .top {
                align-items: flex-start;
            }

            h1 {
                font-size: 24px;
            }
        }

        .page {
            max-width: 1220px;
        }

        .title {
            display: flex;
            align-items: baseline;
            gap: 16px;
        }

        .count {
            color: var(--muted);
            font-size: 18px;
        }

        .lede {
            margin-bottom: 18px;
        }

        .flash {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin: 0 0 16px;
            padding: 8px 16px 8px 12px;
            border: 1px solid rgba(127, 209, 168, 0.35);
            border-radius: 10px;
            background: rgba(127, 209, 168, 0.08);
            color: var(--good);
        }

        .flash svg {
            width: 18px;
            height: 18px;
        }

        .layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            gap: 20px;
            align-items: start;
        }

        .board {
            padding: 18px 22px 22px;
            overflow-x: auto;
        }

        /* Пошук над таблицею */
        .search {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
        }

        .search input {
            flex: 1 1 260px;
        }

        .search select {
            flex: 0 0 170px;
        }

        .found {
            margin: -4px 0 12px;
            color: var(--muted);
            font-size: 14px;
        }

        input,
        select {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid var(--edge);
            border-radius: 10px;
            background: rgba(8, 16, 24, 0.45);
            color: var(--ink);
            font: inherit;
            font-size: 15px;
            color-scheme: dark;
        }

        input:focus,
        select:focus {
            border-color: var(--accent-text);
            outline: none;
        }

        button,
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 9px 18px;
            border: 0;
            border-radius: 10px;
            background: var(--accent);
            color: var(--accent-ink);
            font: 500 15px/1.4 var(--sans);
            text-decoration: none;
            cursor: pointer;
        }

        .button.quiet,
        button.quiet {
            border: 1px solid var(--edge);
            background: transparent;
            color: var(--ink);
        }

        /* Таблиця записів */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15px;
        }

        th {
            padding: 8px 10px;
            border-bottom: 1px solid var(--edge-strong);
            color: var(--muted);
            font-size: 13px;
            font-weight: 400;
            text-align: left;
        }

        td {
            padding: 9px 10px;
            border-bottom: 1px solid var(--edge);
            vertical-align: top;
        }

        td.id {
            color: var(--muted);
            font: 400 13px/1.9 var(--mono);
        }

        td.num {
            font-family: var(--mono);
            font-size: 14px;
            text-align: right;
            white-space: nowrap;
        }

        th.num {
            text-align: right;
        }

        td.short {
            white-space: nowrap;
        }

        tr.group th {
            padding: 16px 10px 6px;
            border-bottom: 0;
            color: var(--accent-text);
            font-size: 15px;
            font-weight: 500;
        }

        tr.editing td {
            background: var(--accent-soft);
        }

        td.actions {
            width: 1%;
            white-space: nowrap;
        }

        td.actions form {
            display: inline;
        }

        .icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 8px;
            background: transparent;
            color: var(--muted);
            vertical-align: middle;
        }

        .icon:hover {
            border-color: var(--edge);
            color: var(--ink);
        }

        .icon.danger:hover {
            color: var(--bad);
        }

        .icon svg {
            width: 17px;
            height: 17px;
        }

        .empty {
            margin: 18px 0 4px;
            color: var(--muted);
        }

        /* Форма додавання й редагування */
        .editor {
            position: sticky;
            top: 20px;
            padding: 20px 22px 22px;
        }

        .editor.editing {
            border-color: var(--accent-text);
        }

        .editor label {
            display: block;
            margin: 12px 0 5px;
            color: var(--muted);
            font-size: 13px;
        }

        .errors {
            margin: 0 0 6px;
            padding: 10px 14px 10px 30px;
            border: 1px solid rgba(255, 155, 143, 0.4);
            border-radius: 10px;
            color: var(--bad);
            font-size: 14px;
        }

        .editor .buttons {
            display: flex;
            gap: 8px;
            margin-top: 18px;
        }

        .editor .buttons button {
            flex: 1;
        }

        @media (max-width: 960px) {
            .layout {
                grid-template-columns: 1fr;
            }

            .editor {
                position: static;
            }
        }
    </style>
</head>
<body>
<div class="page">

    <header class="top">
        <div class="lab">
            <!-- Профіль рейки: університет виріс із залізничного інституту -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z"/>
            </svg>
            <div>
                <b>Лабораторна робота № 3</b>
                Використання MySQL у якості бази даних web-додатку
            </div>
        </div>
        <div class="who">
            <b>%%PIB%%</b>
            студент групи %%GROUP%%
        </div>
    </header>

    <div class="title">
        <h1>Завдання (TODO)</h1>
        <span class="count"><?= $total ?> <?= plural($total, 'завдання', 'завдання', 'завдань') ?></span>
    </div>
    <p class="lede">Завдання з описом, статусом, пріоритетом і дедлайном.</p>

<?php if ($message !== '') : ?>
    <p class="flash" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <?= h($message) ?>
    </p>
<?php endif; ?>

    <div class="layout">
        <section class="glass strong board">
            <form class="search" method="get" role="search">
                <input type="search" name="q" value="<?= h($search) ?>" placeholder="Пошук: назва, опис, статус, пріоритет" aria-label="Пошук">
                <select name="status" aria-label="Статус">
                    <option value="">Статус: усі</option>
<?php foreach (STATUS_OPTIONS as $option) : ?>
                    <option<?= $option === $filter ? ' selected' : '' ?>><?= h($option) ?></option>
<?php endforeach; ?>
                </select>
                <button type="submit">Знайти</button>
<?php if ($where !== []) : ?>
                <a class="button quiet" href="index.php">Скинути</a>
<?php endif; ?>
            </form>
<?php if ($where !== []) : ?>
            <p class="found">Знайдено <?= count($rows) ?> із <?= $total ?>.</p>
<?php endif; ?>

<?php if ($rows === []) : ?>
            <p class="empty"><?= $where !== [] ? 'За цим запитом записів немає.' : 'У таблиці ще немає записів – додайте перший у формі праворуч.' ?></p>
<?php else : ?>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Назва</th>
                    <th>Опис</th>
                    <th>Статус</th>
                    <th>Пріоритет</th>
                    <th>Дедлайн</th>
                    <th><span hidden>Дії</span></th>
                </tr>
<?php foreach ($rows as $row) : ?>
                <tr<?= (int) $row['id'] === $editId ? ' class="editing"' : '' ?>>
                    <td class="id"><?= $row['id'] ?></td>
                    <td><?= h($row['title']) ?></td>
                    <td><?= h($row['description']) ?></td>
                    <td class="short"><?= h($row['status']) ?></td>
                    <td class="short"><?= h($row['priority']) ?></td>
                    <td><?= date('d.m.Y', strtotime($row['deadline'])) ?></td>
                    <td class="actions">
                        <a class="icon" href="index.php?edit=<?= $row['id'] ?>#form" title="Змінити" aria-label="Змінити запис <?= $row['id'] ?>">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
                        </a>
                        <form method="post" onsubmit="return confirm('Видалити запис <?= $row['id'] ?>?');">
                            <input type="hidden" name="id" value="<?= $row['id'] ?>">
                            <button class="icon danger" type="submit" name="delete" title="Видалити" aria-label="Видалити запис <?= $row['id'] ?>">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5.5M13.5 11v5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                        </form>
                    </td>
                </tr>
<?php endforeach; ?>
            </table>
<?php endif; ?>
        </section>

        <aside class="glass editor<?= $editId > 0 ? ' editing' : '' ?>" id="form">
            <h2><?= $editId > 0 ? 'Змінити запис ' . $editId : 'Додати завдання' ?></h2>
<?php if ($errors !== []) : ?>
            <ul class="errors">
<?php foreach ($errors as $error) : ?>
                <li><?= h($error) ?></li>
<?php endforeach; ?>
            </ul>
<?php endif; ?>
            <form method="post" action="index.php">
<?php if ($editId > 0) : ?>
                <input type="hidden" name="id" value="<?= $editId ?>">
<?php endif; ?>
                <label for="f-title">Назва</label>
                <input type="text" id="f-title" name="title" maxlength="150" value="<?= h($form['title']) ?>" required>
                <label for="f-description">Опис</label>
                <input type="text" id="f-description" name="description" maxlength="255" value="<?= h($form['description']) ?>" required>
                <label for="f-status">Статус</label>
                <select id="f-status" name="status" required>
<?php foreach (STATUS_OPTIONS as $option) : ?>
                    <option<?= $option === $form['status'] ? ' selected' : '' ?>><?= h($option) ?></option>
<?php endforeach; ?>
                </select>
                <label for="f-priority">Пріоритет</label>
                <select id="f-priority" name="priority" required>
<?php foreach (PRIORITY_OPTIONS as $option) : ?>
                    <option<?= $option === $form['priority'] ? ' selected' : '' ?>><?= h($option) ?></option>
<?php endforeach; ?>
                </select>
                <label for="f-deadline">Дедлайн</label>
                <input type="date" id="f-deadline" name="deadline" value="<?= h($form['deadline']) ?>" required>
                <div class="buttons">
<?php if ($editId > 0) : ?>
                    <button type="submit" name="update">Зберегти зміни</button>
                    <a class="button quiet" href="index.php">Скасувати</a>
<?php else : ?>
                    <button type="submit" name="add">Додати</button>
<?php endif; ?>
                </div>
            </form>
        </aside>
    </div>

</div>
</body>
</html>
