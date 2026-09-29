<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 3. Використання MySQL у якості бази даних web-додатку.
 *
 * Довідник «Відомість з оцінками»: таблиця `grades` у базі appdb.
 * Таблицю створює запит із table.sql (phpMyAdmin, вкладка SQL).
 * Сторінка додає, показує та видаляє записи; перед записом дані перевіряються.
 * Усі запити з даними користувача — підготовлені (prepare + bind_param).
 */

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
 * Екранування значення для виводу в HTML.
 */
function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Значення полів із форми та перелік помилок перевірки.
 *
 * @return array{0: array<string, string>, 1: string[]}
 */
function read_form(): array
{
    $values = [
        'student' => post('student'),
        'study_group' => post('study_group'),
        'subject' => post('subject'),
        'grade' => post('grade'),
        'exam_date' => post('exam_date'),
    ];
    $errors = [];

    if ($values['student'] === '' || mb_strlen($values['student']) > 120) {
        $errors[] = 'ПІБ студента: обов’язкове поле, до 120 символів.';
    }
    if ($values['study_group'] === '' || mb_strlen($values['study_group']) > 20) {
        $errors[] = 'Група: обов’язкове поле, до 20 символів.';
    }
    if ($values['subject'] === '' || mb_strlen($values['subject']) > 150) {
        $errors[] = 'Дисципліна: обов’язкове поле, до 150 символів.';
    }
    $range = ['options' => ['min_range' => 0, 'max_range' => 100]];
    if (filter_var($values['grade'], FILTER_VALIDATE_INT, $range) === false) {
        $errors[] = 'Оцінка: ціле число від 0 до 100.';
    }
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $values['exam_date'], $d) || !checkdate((int) $d[2], (int) $d[3], (int) $d[1])) {
        $errors[] = 'Дата: потрібна дата у форматі РРРР-ММ-ДД.';
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
        . '<title>' . h($title) . '</title><style>body{margin:0;background:#f4f6f8;color:#1d242b;font:16px/1.6 system-ui,sans-serif}main{max-width:640px;margin:15vh auto;padding:28px 36px;background:#fff;border:1px solid #dde2e7;border-top:4px solid %%ACCENT%%;border-radius:6px}h1{margin:0 0 8px;font-size:24px}</style></head>'
        . '<body><main><h1>' . h($title) . '</h1>' . $text . '</main></body></html>';
    exit;
}

$mysqli = connect();
if ($mysqli === null) {
    stop('База даних запускається', '<p>MySQL ще не приймає підключень. Оновіть сторінку за кілька секунд.</p>');
}

// Таблицю створюють вручну запитом із table.sql (етап 2 роботи).
if ($mysqli->query("SHOW TABLES LIKE 'grades'")->num_rows === 0) {
    stop('Таблиці ще немає', '<p>У базі appdb немає таблиці <code>grades</code>. '
        . 'Відкрийте phpMyAdmin (<a href="http://localhost:8081">localhost:8081</a>), оберіть базу appdb '
        . 'і виконайте у вкладці SQL запит із файла table.sql.</p>');
}

$errors = [];
$form = [
    'student' => '',
    'study_group' => '',
    'subject' => '',
    'grade' => '',
    'exam_date' => '',
];
$message = '';

// Обробка додавання запису
if (isset($_POST['add'])) {
    [$form, $errors] = read_form();

    if ($errors === []) {
        $stmt = $mysqli->prepare('INSERT INTO `grades` (`student`, `study_group`, `subject`, `grade`, `exam_date`) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssis', $form['student'], $form['study_group'], $form['subject'], $form['grade'], $form['exam_date']);
        $stmt->execute();
        $stmt->close();
        $message = 'Запис додано.';
        $form = array_fill_keys(array_keys($form), '');
    }
}

// Обробка видалення запису
if (isset($_POST['delete'])) {
    $id = (int) post('id');
    $stmt = $mysqli->prepare('DELETE FROM `grades` WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    $message = 'Запис видалено.';
}

// Отримання всіх записів
$stmt = $mysqli->prepare('SELECT `id`, `student`, `study_group`, `subject`, `grade`, `exam_date` FROM `grades` ORDER BY `exam_date` DESC, `student`');
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$mysqli->close();
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Відомість з оцінками</title>
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

        main {
            max-width: 1040px;
        }

        .lede {
            margin: -8px 0 18px;
            color: var(--muted);
        }

        .message {
            padding: 8px 12px;
            border-left: 3px solid var(--good);
            background: #edf7f1;
            color: var(--good);
        }

        table {
            width: 100%;
            font-size: 15px;
        }

        td.id {
            color: var(--muted);
        }

        td.short {
            white-space: nowrap;
        }

        td form {
            margin: 0;
        }

        .errors {
            padding: 10px 14px 10px 32px;
            border-left: 3px solid var(--bad);
            background: #fcefee;
            color: var(--bad);
        }

        .add {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px 16px;
            align-items: end;
        }

        .add .wide {
            grid-column: span 2;
        }

        .add label {
            display: block;
            margin-bottom: 4px;
            color: var(--muted);
            font-size: 14px;
        }

        input,
        select {
            width: 100%;
            box-sizing: border-box;
            padding: 7px 10px;
            border: 1px solid #c9d1d8;
            border-radius: 4px;
            background: #ffffff;
            font: inherit;
        }

        button {
            padding: 8px 18px;
            border: 0;
            border-radius: 4px;
            background: var(--accent);
            color: var(--accent-ink);
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }

        button.delete {
            padding: 4px 10px;
            border: 1px solid #c9d1d8;
            background: #ffffff;
            color: var(--bad);
            font-weight: 400;
        }

        @media (max-width: 720px) {
            .add {
                grid-template-columns: 1fr;
            }

            .add .wide {
                grid-column: auto;
            }
        }
    </style>
</head>
<body>
<main>
    <div class="meta">
        <span>Лабораторна робота № 3. %%PIB_SHORT%%, група %%GROUP%%</span>
    </div>

    <h1>Відомість з оцінками</h1>
    <p class="lede">Оцінки студентів: ПІБ, група, дисципліна, оцінка за 100-бальною шкалою і дата.</p>

<?php if ($message !== '') : ?>
    <p class="message"><?= h($message) ?></p>
<?php endif; ?>

<?php if ($rows === []) : ?>
    <p>Немає даних у базі.</p>
<?php else : ?>
    <table>
        <tr>
            <th>ID</th>
            <th>ПІБ студента</th>
            <th>Група</th>
            <th>Дисципліна</th>
            <th>Оцінка</th>
            <th>Дата</th>
            <th>Дії</th>
        </tr>
<?php foreach ($rows as $row) : ?>
        <tr>
            <td class="id"><?= $row['id'] ?></td>
            <td><?= h($row['student']) ?></td>
            <td class="short"><?= h($row['study_group']) ?></td>
            <td><?= h($row['subject']) ?></td>
            <td class="num"><?= $row['grade'] ?></td>
            <td><?= date('d.m.Y', strtotime($row['exam_date'])) ?></td>
            <td>
                <form method="post" onsubmit="return confirm('Видалити запис <?= $row['id'] ?>?');">
                    <input type="hidden" name="id" value="<?= $row['id'] ?>">
                    <button class="delete" type="submit" name="delete">Видалити</button>
                </form>
            </td>
        </tr>
<?php endforeach; ?>
    </table>
<?php endif; ?>

    <h2>Додати оцінку</h2>
<?php if ($errors !== []) : ?>
    <ul class="errors">
<?php foreach ($errors as $error) : ?>
        <li><?= h($error) ?></li>
<?php endforeach; ?>
    </ul>
<?php endif; ?>
    <form class="add" method="post">
        <div class="wide">
            <label for="f-student">ПІБ студента</label>
            <input type="text" id="f-student" name="student" maxlength="120" value="<?= h($form['student']) ?>" required>
        </div>
        <div>
            <label for="f-study_group">Група</label>
            <input type="text" id="f-study_group" name="study_group" maxlength="20" value="<?= h($form['study_group']) ?>" required>
        </div>
        <div class="wide">
            <label for="f-subject">Дисципліна</label>
            <input type="text" id="f-subject" name="subject" maxlength="150" value="<?= h($form['subject']) ?>" required>
        </div>
        <div>
            <label for="f-grade">Оцінка</label>
            <input type="number" id="f-grade" name="grade" min="0" max="100" step="1" value="<?= h($form['grade']) ?>" required>
        </div>
        <div>
            <label for="f-exam_date">Дата</label>
            <input type="date" id="f-exam_date" name="exam_date" value="<?= h($form['exam_date']) ?>" required>
        </div>
        <div>
            <button type="submit" name="add">Додати</button>
        </div>
    </form>
</main>
</body>
</html>
