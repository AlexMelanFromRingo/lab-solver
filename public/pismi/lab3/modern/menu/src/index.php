<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 3. Використання MySQL у якості бази даних web-додатку.
 *
 * Довідник «Меню ресторану»: таблиця `menu` у базі appdb.
 * Таблицю створює запит із table.sql (phpMyAdmin, вкладка SQL).
 * Сторінка реалізує операції CRUD — додавання, перегляд, редагування й
 * видалення записів — і пошук.
 * Усі запити з даними користувача — підготовлені (prepare + bind_param).
 */

/** Допустимі значення поля «Категорія». */
const CATEGORY_OPTIONS = ['Закуски', 'Перші страви', 'Основні страви', 'Десерти', 'Напої'];

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
 * Значення полів із форми та перелік помилок перевірки.
 *
 * @return array{0: array<string, string>, 1: string[]}
 */
function read_form(): array
{
    $values = [
        'dish' => post('dish'),
        'category' => post('category'),
        'price' => str_replace(',', '.', post('price')),
        'ingredients' => post('ingredients'),
        'calories' => post('calories'),
    ];
    $errors = [];

    if ($values['dish'] === '' || mb_strlen($values['dish']) > 120) {
        $errors[] = 'Назва страви: обов’язкове поле, до 120 символів.';
    }
    if (!in_array($values['category'], CATEGORY_OPTIONS, true)) {
        $errors[] = 'Категорія: оберіть значення зі списку.';
    }
    if (!is_numeric($values['price']) || $values['price'] < 0 || $values['price'] > 100000) {
        $errors[] = 'Ціна: число від 0 до 100000.';
    }
    if ($values['ingredients'] === '' || mb_strlen($values['ingredients']) > 255) {
        $errors[] = 'Склад: обов’язкове поле, до 255 символів.';
    }
    $range = ['options' => ['min_range' => 0, 'max_range' => 5000]];
    if (filter_var($values['calories'], FILTER_VALIDATE_INT, $range) === false) {
        $errors[] = 'Калорійність: ціле число від 0 до 5000.';
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
        . '<title>' . h($title) . '</title><style>body{margin:0;padding:20px;background:#d6dde3;color:#1b2630;font:18px/1.5 Arial Narrow,sans-serif}main{max-width:720px;margin:12vh auto;padding:28px 36px;background:#fff;border:2px solid #1b2630}h1{margin:0 0 8px;font-size:28px}a{color:inherit}</style></head>'
        . '<body><main><h1>' . h($title) . '</h1>' . $text . '</main></body></html>';
    exit;
}

$mysqli = connect();
if ($mysqli === null) {
    stop('База даних запускається', '<p>MySQL ще не приймає підключень. Оновіть сторінку за кілька секунд.</p>');
}

// Таблицю створюють вручну запитом із table.sql (етап 2 роботи).
if ($mysqli->query("SHOW TABLES LIKE 'menu'")->num_rows === 0) {
    stop('Таблиці ще немає', '<p>У базі appdb немає таблиці <code>menu</code>. '
        . 'Відкрийте phpMyAdmin (<a href="http://localhost:8081">localhost:8081</a>), оберіть базу appdb '
        . 'і виконайте у вкладці SQL запит із файла table.sql.</p>');
}

$errors = [];
$form = [
    'dish' => '',
    'category' => '',
    'price' => '',
    'ingredients' => '',
    'calories' => '',
];
$editId = 0;

// Повідомлення після переадресації (див. обробку форм нижче).
$messages = ['added' => 'Запис додано.', 'updated' => 'Зміни збережено.', 'deleted' => 'Запис видалено.'];
$message = $messages[query('done')] ?? '';

// Обробка додавання запису
if (isset($_POST['add'])) {
    [$form, $errors] = read_form();

    if ($errors === []) {
        $stmt = $mysqli->prepare('INSERT INTO `menu` (`dish`, `category`, `price`, `ingredients`, `calories`) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('ssdsi', $form['dish'], $form['category'], $form['price'], $form['ingredients'], $form['calories']);
        $stmt->execute();
        $stmt->close();

        // Після зміни даних — переадресація: оновлення сторінки не повторить запит.
        header('Location: index.php?done=added');
        exit;
    }
}

// Обробка збереження змін
if (isset($_POST['update'])) {
    $editId = (int) post('id');
    [$form, $errors] = read_form();

    if ($errors === []) {
        $stmt = $mysqli->prepare('UPDATE `menu` SET `dish` = ?, `category` = ?, `price` = ?, `ingredients` = ?, `calories` = ? WHERE `id` = ?');
        $stmt->bind_param('ssdsii', $form['dish'], $form['category'], $form['price'], $form['ingredients'], $form['calories'], $editId);
        $stmt->execute();
        $stmt->close();

        header('Location: index.php?done=updated');
        exit;
    }
}

// Обробка видалення запису
if (isset($_POST['delete'])) {
    $id = (int) post('id');
    $stmt = $mysqli->prepare('DELETE FROM `menu` WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();

    header('Location: index.php?done=deleted');
    exit;
}

// Редагування: index.php?edit=ID підставляє запис у форму
if ($editId === 0 && query('edit') !== '') {
    $id = (int) query('edit');
    $stmt = $mysqli->prepare('SELECT `dish`, `category`, `price`, `ingredients`, `calories` FROM `menu` WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $editId = $id;
        $form = [
            'dish' => (string) $row['dish'],
            'category' => (string) $row['category'],
            'price' => (string) $row['price'],
            'ingredients' => (string) $row['ingredients'],
            'calories' => (string) $row['calories'],
        ];
    }
}

// Пошук
$search = query('q');
$where = [];
$types = '';
$params = [];

if ($search !== '') {
    // Підрядок у текстових полях; символи % і _ у запиті — звичайні символи.
    $like = '%' . addcslashes($search, '%_\\') . '%';
    $where[] = '(`dish` LIKE ? OR `category` LIKE ? OR `ingredients` LIKE ?)';
    $types .= 'sss';
    array_push($params, $like, $like, $like);
}

// Отримання записів
$sql = 'SELECT `id`, `dish`, `category`, `price`, `ingredients`, `calories` FROM `menu`'
    . ($where !== [] ? ' WHERE ' . implode(' AND ', $where) : '')
    . " ORDER BY FIELD(`category`, 'Закуски', 'Перші страви', 'Основні страви', 'Десерти', 'Напої'), `dish`";
$stmt = $mysqli->prepare($sql);
if ($params !== []) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$total = (int) $mysqli->query('SELECT COUNT(*) FROM `menu`')->fetch_row()[0];
$mysqli->close();
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Меню ресторану – лабораторна робота № 3</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">
    <style>
        :root {
            --desk: #d6dde3;
            --paper: #ffffff;
            --line: #1b2630;
            --thin: #8a98a4;
            --hair: #c5ced6;
            --grid: rgba(27, 38, 48, 0.05);
            --text: #1b2630;
            --muted: #56646f;
            --good: #1f7a4d;
            --bad: #b3261e;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-line: color-mix(in srgb, var(--accent) 82%, #000000);
            --font: "PT Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif;
            --mono: "PT Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--desk);
            color: var(--text);
            font: 400 18px/1.45 var(--font);
        }

        a {
            color: var(--accent-line);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-line);
            outline-offset: 2px;
        }

        /* Аркуш: зовнішня тонка межа, рамка з полем для підшивки ліворуч */
        .sheet {
            min-height: calc(100vh - 40px);
            padding: 12px 12px 12px 44px;
            border: 1px solid var(--thin);
            background:
                linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                var(--paper);
        }

        .frame {
            display: grid;
            grid-template-rows: 1fr auto;
            min-height: calc(100vh - 66px);
            border: 2px solid var(--line);
        }

        .field {
            padding: 26px 36px 28px;
        }

        .lab {
            margin: 0;
            color: var(--muted);
            font-size: 19px;
        }

        h1 {
            margin: 0 0 22px;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
        }

        h2 {
            margin: 0 0 10px;
            font-size: 21px;
            font-weight: 700;
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        /* Таблиця як специфікація: товсті лінії шапки, тонкі між рядками */
        table.spec {
            border-collapse: collapse;
            font-size: 17px;
        }

        table.spec th,
        table.spec td {
            padding: 5px 12px;
            border: 1px solid var(--line);
            text-align: left;
        }

        table.spec thead th {
            border-bottom-width: 2px;
            font-weight: 700;
        }

        table.spec td.num {
            text-align: right;
        }

        /* Основний напис, як на кресленні: правий нижній кут */
        .stamp {
            display: grid;
            grid-template-columns: 96px 150px 250px;
            grid-template-areas:
                "k1 v1 title"
                "k2 v2 title"
                "k3 v3 title"
                "org org sheet";
            justify-self: end;
            border-top: 2px solid var(--line);
            border-left: 2px solid var(--line);
            background: var(--paper);
            font-size: 16px;
        }

        .stamp > * {
            margin: 0;
            padding: 5px 10px;
            border-right: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
        }

        .stamp .key {
            color: var(--muted);
        }

        .stamp .title {
            grid-area: title;
            display: grid;
            place-content: center;
            border-right: 0;
            font-size: 19px;
            font-weight: 700;
            line-height: 1.25;
            text-align: center;
        }

        .stamp .org {
            grid-area: org;
            border-top: 1px solid var(--line);
            border-bottom: 0;
        }

        .stamp .sheet-no {
            grid-area: sheet;
            border-top: 1px solid var(--line);
            border-right: 0;
            border-bottom: 0;
            text-align: center;
        }

        .stamp .mono {
            font-family: var(--mono);
            font-size: 15px;
        }

        @media (max-width: 820px) {
            body {
                padding: 10px;
            }

            .sheet {
                padding: 8px;
            }

            .field {
                padding: 20px 16px;
            }

            .stamp {
                grid-template-columns: 80px 1fr;
                grid-template-areas:
                    "title title"
                    "k1 v1"
                    "k2 v2"
                    "k3 v3"
                    "org sheet";
                justify-self: stretch;
                border-left: 0;
            }
        }

        .head {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            justify-content: space-between;
            gap: 4px 24px;
        }

        .count {
            font-family: var(--mono);
            font-size: 16px;
        }

        h1 {
            margin-bottom: 14px;
        }

        .message {
            display: inline-block;
            margin: 0 0 14px;
            padding: 4px 12px;
            border: 1px solid var(--line);
            border-left: 4px solid var(--good);
        }

        .search {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            margin-bottom: 14px;
        }

        .search input {
            flex: 0 1 420px;
        }

        .found {
            color: var(--muted);
        }

        input,
        select {
            width: 100%;
            box-sizing: border-box;
            padding: 5px 8px;
            border: 1px solid var(--line);
            border-radius: 0;
            background: var(--paper);
            color: var(--text);
            font: 400 17px/1.3 var(--font);
        }

        input:focus,
        select:focus {
            outline: 2px solid var(--accent);
            outline-offset: -1px;
        }

        button,
        .button {
            padding: 5px 16px;
            border: 2px solid var(--line);
            background: var(--paper);
            color: var(--text);
            font: 700 17px/1.3 var(--font);
            text-decoration: none;
            cursor: pointer;
        }

        button.primary {
            border-color: var(--accent);
            background: var(--accent);
            color: var(--accent-ink);
        }

        table.records {
            width: 100%;
            margin-bottom: 22px;
        }

        table.records td.id {
            color: var(--muted);
            font-family: var(--mono);
            font-size: 15px;
        }

        table.records td.short {
            white-space: nowrap;
        }

        table.records tr.editing td {
            background: var(--accent-soft);
        }

        td.actions {
            width: 1%;
            white-space: nowrap;
        }

        td.actions form {
            display: inline;
        }

        td.actions a,
        td.actions button {
            padding: 0 4px;
            border: 0;
            background: none;
            color: var(--accent-line);
            font: 400 16px/1.3 var(--font);
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        td.actions button {
            color: var(--bad);
        }

        .editor {
            padding: 14px 18px 18px;
            border: 1px solid var(--line);
        }

        .editor.editing {
            border: 2px solid var(--accent);
        }

        .editor h2 {
            margin-bottom: 8px;
        }

        .fields {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px 16px;
        }

        .fields .wide {
            grid-column: span 2;
        }

        .fields label {
            display: block;
            color: var(--muted);
            font-size: 16px;
        }

        .errors {
            margin: 0 0 10px;
            padding: 6px 12px 6px 30px;
            border: 2px solid var(--bad);
            color: var(--bad);
        }

        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 14px;
        }

        @media (max-width: 820px) {
            .fields {
                grid-template-columns: 1fr;
            }

            .fields .wide {
                grid-column: auto;
            }

            table.records {
                display: block;
                overflow-x: auto;
            }
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">

        <main class="field">
            <div class="head">
                <p class="lab">Лабораторна робота № 3. Використання MySQL у якості бази даних web-додатку</p>
                <span class="count">Записів у таблиці: <?= $total ?></span>
            </div>
            <h1>Меню ресторану</h1>

<?php if ($message !== '') : ?>
            <p class="message" role="status"><?= h($message) ?></p>
<?php endif; ?>

            <form class="search" method="get" role="search">
                <input type="search" name="q" value="<?= h($search) ?>" placeholder="Пошук: назва страви, категорія, склад" aria-label="Пошук">
                <button type="submit">Знайти</button>
<?php if ($search !== '') : ?>
                <a class="button" href="index.php">Скинути</a>
                <span class="found">Знайдено <?= count($rows) ?> із <?= $total ?></span>
<?php endif; ?>
            </form>

<?php if ($rows === []) : ?>
            <p><?= $search !== '' ? 'За цим запитом записів немає.' : 'Немає даних у базі.' ?></p>
<?php else : ?>
            <table class="spec records">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Назва страви</th>
                        <th>Категорія</th>
                        <th>Ціна</th>
                        <th>Склад</th>
                        <th>Калорійність</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
<?php foreach ($rows as $row) : ?>
                    <tr<?= (int) $row['id'] === $editId ? ' class="editing"' : '' ?>>
                        <td class="id"><?= $row['id'] ?></td>
                        <td><?= h($row['dish']) ?></td>
                        <td class="short"><?= h($row['category']) ?></td>
                        <td class="num"><?= number_format((float) $row['price'], 2, ',', ' ') . ' грн' ?></td>
                        <td><?= h($row['ingredients']) ?></td>
                        <td class="num"><?= $row['calories'] . ' ккал' ?></td>
                        <td class="actions">
                            <a href="index.php?edit=<?= $row['id'] ?>#form">змінити</a>
                            <form method="post" onsubmit="return confirm('Видалити запис <?= $row['id'] ?>?');">
                                <input type="hidden" name="id" value="<?= $row['id'] ?>">
                                <button type="submit" name="delete">видалити</button>
                            </form>
                        </td>
                    </tr>
<?php endforeach; ?>
                </tbody>
            </table>
<?php endif; ?>

            <section class="editor<?= $editId > 0 ? ' editing' : '' ?>" id="form">
                <h2><?= $editId > 0 ? 'Зміна запису ' . $editId : 'Додати страву' ?></h2>
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
                    <div class="fields">
                        <div class="wide">
                            <label for="f-dish">Назва страви</label>
                            <input type="text" id="f-dish" name="dish" maxlength="120" value="<?= h($form['dish']) ?>" required>
                        </div>
                        <div>
                            <label for="f-category">Категорія</label>
                            <select id="f-category" name="category" required>
<?php foreach (CATEGORY_OPTIONS as $option) : ?>
                                <option<?= $option === $form['category'] ? ' selected' : '' ?>><?= h($option) ?></option>
<?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label for="f-price">Ціна, грн</label>
                            <input type="number" id="f-price" name="price" min="0" max="100000" step="0.01" value="<?= h($form['price']) ?>" required>
                        </div>
                        <div class="wide">
                            <label for="f-ingredients">Склад</label>
                            <input type="text" id="f-ingredients" name="ingredients" maxlength="255" value="<?= h($form['ingredients']) ?>" required>
                        </div>
                        <div>
                            <label for="f-calories">Калорійність, ккал</label>
                            <input type="number" id="f-calories" name="calories" min="0" max="5000" step="1" value="<?= h($form['calories']) ?>" required>
                        </div>
                    </div>
                    <div class="buttons">
<?php if ($editId > 0) : ?>
                        <button class="primary" type="submit" name="update">Зберегти зміни</button>
                        <a class="button" href="index.php">Скасувати</a>
<?php else : ?>
                        <button class="primary" type="submit" name="add">Додати</button>
<?php endif; ?>
                    </div>
                </form>
            </section>
        </main>

        <footer class="stamp">
            <p class="key">Розробив</p>
            <p>%%PIB_SHORT%%</p>
            <p class="key">Група</p>
            <p class="mono">%%GROUP%%</p>
            <p class="key">Таблиця</p>
            <p>menu</p>
            <p class="title">Лабораторна<br>робота № 3</p>
            <p class="org">УДУНТ, кафедра ЕОМ</p>
            <p class="sheet-no">Аркуш 1</p>
        </footer>

    </div>
</div>
</body>
</html>
