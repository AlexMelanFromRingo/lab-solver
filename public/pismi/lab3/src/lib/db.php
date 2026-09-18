<?php

declare(strict_types=1);

/**
 * Робота з базою даних для лабораторної роботи № 3.
 *
 * Тут зібрано все, що не залежить від тематики довідника: підключення,
 * створення таблиці за описом полів, перевірка введених значень та чотири
 * операції CRUD. Тема приходить ззовні (див. lib/themes.php) і задає лише
 * назву таблиці та перелік полів.
 *
 * Усі запити, що містять дані користувача, виконуються підготовленими
 * запитами. Імена таблиці й стовпців у підготовлений запит підставити не
 * можна – їх не можна параметризувати, – тому вони проходять перевірку за
 * переліком допустимих символів і беруться у зворотні лапки.
 */

/** Параметри підключення збігаються з тими, що задані в docker-compose.yml. */
const DB_HOST = 'db';
const DB_USER = 'appuser';
const DB_PASSWORD = 'apppass';
const DB_NAME = 'appdb';

/**
 * Підключення до MySQL.
 *
 * Контейнер бази піднімається довше за контейнер PHP, тому перша спроба
 * підключення після `docker compose up` може не вдатися. Замість того щоб
 * показати помилку, сторінка кілька разів повторює спробу.
 */
function db_connect(int $attempts = 10): mysqli
{
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    for ($try = 1; ; $try++) {
        try {
            $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
            $db->set_charset('utf8mb4');

            return $db;
        } catch (mysqli_sql_exception $error) {
            if ($try >= $attempts) {
                throw $error;
            }
            sleep(1);
        }
    }
}

/**
 * Перевіряє, що ім'я придатне для підстановки в запит як ідентифікатор.
 */
function safe_identifier(string $name): string
{
    if (preg_match('/^[a-z_][a-z0-9_]*$/', $name) !== 1) {
        throw new InvalidArgumentException('Неприпустиме ім’я: ' . $name);
    }

    return '`' . $name . '`';
}

/**
 * Запит на створення таблиці за описом теми.
 *
 * @param array<string, mixed> $theme
 */
function create_table_sql(array $theme): string
{
    $lines = ['  `id` INT AUTO_INCREMENT PRIMARY KEY'];
    foreach ($theme['fields'] as $f) {
        $lines[] = '  ' . safe_identifier($f['name']) . ' ' . $f['sql'];
    }
    $lines[] = '  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

    return 'CREATE TABLE IF NOT EXISTS ' . safe_identifier($theme['table']) . " (\n"
        . implode(",\n", $lines)
        . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
}

/**
 * Створює таблицю теми, якщо її ще немає, і наповнює прикладами.
 *
 * @param array<string, mixed> $theme
 */
function ensure_table(mysqli $db, array $theme): void
{
    $db->query(create_table_sql($theme));

    $count = $db->query('SELECT COUNT(*) AS n FROM ' . safe_identifier($theme['table']))
        ->fetch_assoc()['n'] ?? 0;

    if ((int) $count > 0) {
        return;
    }

    foreach ($theme['seed'] as $row) {
        $values = [];
        foreach ($theme['fields'] as $i => $f) {
            $values[$f['name']] = $row[$i] ?? '';
        }
        insert_row($db, $theme, $values);
    }
}

/**
 * Типи для bind_param за описом полів.
 *
 * @param list<array<string, mixed>> $fields
 */
function bind_types(array $fields): string
{
    $types = '';
    foreach ($fields as $f) {
        $types .= match ($f['type']) {
            'int' => 'i',
            'decimal' => 'd',
            default => 's',
        };
    }

    return $types;
}

/**
 * Перевіряє значення, що прийшли з форми.
 *
 * Повертає готові до запису значення та перелік помилок. Порожній перелік
 * помилок означає, що запис можна зберігати.
 *
 * @param array<string, mixed> $theme
 * @param array<string, mixed> $input
 * @return array{values: array<string, mixed>, errors: array<string, string>}
 */
function validate_row(array $theme, array $input): array
{
    $values = [];
    $errors = [];

    foreach ($theme['fields'] as $f) {
        $name = $f['name'];
        $raw = trim((string) ($input[$name] ?? ''));

        if ($raw === '') {
            $errors[$name] = 'Поле «' . $f['label'] . '» не заповнене.';
            $values[$name] = $f['type'] === 'int' || $f['type'] === 'decimal' ? 0 : '';
            continue;
        }

        switch ($f['type']) {
            case 'int':
                if (!preg_match('/^-?\d+$/', $raw)) {
                    $errors[$name] = 'Поле «' . $f['label'] . '» має бути цілим числом.';
                    break;
                }
                $number = (int) $raw;
                if (isset($f['min'], $f['max']) && ($number < $f['min'] || $number > $f['max'])) {
                    $errors[$name] = sprintf(
                        'Поле «%s» має бути в межах від %s до %s.',
                        $f['label'],
                        $f['min'],
                        $f['max']
                    );
                }
                $values[$name] = $number;
                continue 2;

            case 'decimal':
                $normalised = str_replace(',', '.', $raw);
                if (!is_numeric($normalised)) {
                    $errors[$name] = 'Поле «' . $f['label'] . '» має бути числом.';
                    break;
                }
                $number = (float) $normalised;
                if (isset($f['min'], $f['max']) && ($number < $f['min'] || $number > $f['max'])) {
                    $errors[$name] = sprintf(
                        'Поле «%s» має бути в межах від %s до %s.',
                        $f['label'],
                        $f['min'],
                        $f['max']
                    );
                }
                $values[$name] = $number;
                continue 2;

            case 'date':
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                    $errors[$name] = 'Поле «' . $f['label'] . '»: очікується дата у вигляді РРРР-ММ-ДД.';
                }
                break;

            case 'time':
                if (!preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $raw)) {
                    $errors[$name] = 'Поле «' . $f['label'] . '»: очікується час у вигляді ГГ:ХХ.';
                }
                break;

            case 'enum':
                if (!in_array($raw, $f['options'], true)) {
                    $errors[$name] = 'Поле «' . $f['label'] . '»: значення поза переліком.';
                }
                break;
        }

        $values[$name] = $raw;
    }

    return ['values' => $values, 'errors' => $errors];
}

/**
 * Додає запис.
 *
 * @param array<string, mixed> $theme
 * @param array<string, mixed> $values
 */
function insert_row(mysqli $db, array $theme, array $values): void
{
    $columns = [];
    $marks = [];
    $bound = [];
    foreach ($theme['fields'] as $f) {
        $columns[] = safe_identifier($f['name']);
        $marks[] = '?';
        $bound[] = $values[$f['name']];
    }

    $sql = 'INSERT INTO ' . safe_identifier($theme['table'])
        . ' (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $marks) . ')';

    $stmt = $db->prepare($sql);
    $stmt->bind_param(bind_types($theme['fields']), ...$bound);
    $stmt->execute();
    $stmt->close();
}

/**
 * Оновлює запис за ідентифікатором.
 *
 * @param array<string, mixed> $theme
 * @param array<string, mixed> $values
 */
function update_row(mysqli $db, array $theme, int $id, array $values): void
{
    $assignments = [];
    $bound = [];
    foreach ($theme['fields'] as $f) {
        $assignments[] = safe_identifier($f['name']) . ' = ?';
        $bound[] = $values[$f['name']];
    }
    $bound[] = $id;

    $sql = 'UPDATE ' . safe_identifier($theme['table'])
        . ' SET ' . implode(', ', $assignments) . ' WHERE `id` = ?';

    $stmt = $db->prepare($sql);
    $stmt->bind_param(bind_types($theme['fields']) . 'i', ...$bound);
    $stmt->execute();
    $stmt->close();
}

/**
 * Видаляє запис за ідентифікатором.
 *
 * @param array<string, mixed> $theme
 */
function delete_row(mysqli $db, array $theme, int $id): void
{
    $stmt = $db->prepare('DELETE FROM ' . safe_identifier($theme['table']) . ' WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
}

/**
 * Один запис за ідентифікатором – потрібен формі редагування.
 *
 * @param array<string, mixed> $theme
 * @return array<string, mixed>|null
 */
function fetch_row(mysqli $db, array $theme, int $id): ?array
{
    $stmt = $db->prepare('SELECT * FROM ' . safe_identifier($theme['table']) . ' WHERE `id` = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

/**
 * Усі записи, за потреби – відфільтровані пошуковим рядком.
 *
 * Пошук іде лише текстовими полями: для чисел і дат підрядок сенсу не має.
 *
 * @param array<string, mixed> $theme
 * @return list<array<string, mixed>>
 */
function fetch_rows(mysqli $db, array $theme, string $search = ''): array
{
    $table = safe_identifier($theme['table']);
    $search = trim($search);

    if ($search === '') {
        $result = $db->query('SELECT * FROM ' . $table . ' ORDER BY `id`');

        return $result->fetch_all(MYSQLI_ASSOC);
    }

    $conditions = [];
    foreach ($theme['fields'] as $f) {
        if (in_array($f['type'], ['text', 'enum'], true)) {
            $conditions[] = safe_identifier($f['name']) . ' LIKE ?';
        }
    }

    if ($conditions === []) {
        return [];
    }

    $pattern = '%' . $search . '%';
    $bound = array_fill(0, count($conditions), $pattern);

    $stmt = $db->prepare(
        'SELECT * FROM ' . $table . ' WHERE ' . implode(' OR ', $conditions) . ' ORDER BY `id`'
    );
    $stmt->bind_param(str_repeat('s', count($conditions)), ...$bound);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    return $rows;
}
