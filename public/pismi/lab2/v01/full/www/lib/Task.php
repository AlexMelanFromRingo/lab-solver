<?php

declare(strict_types=1);

/**
 * Основа для завдання другої програми.
 *
 * Методичні вказівки вимагають, щоб завдання виконував створений
 * об'єкт. Клас оголошує, які параметри читає з рядка браузера, сам
 * приводить їх до допустимих меж і сам будує розмітку відповіді.
 */
abstract class Task
{
    /** Назва завдання з методичних вказівок. */
    abstract public function title(): string;

    /**
     * Параметри, які завдання читає з рядка браузера.
     *
     * @return array<string, array{label: string, default: string}>
     */
    abstract public function params(): array;

    /**
     * Результат роботи у вигляді HTML.
     *
     * @param array<string, string> $p значення параметрів
     */
    abstract public function render(array $p): string;

    /** Висновок саме про це завдання. */
    abstract public function conclusion(): string;

    /**
     * Ціле значення параметра із затиском у межі.
     */
    protected function int(array $p, string $name, int $default, int $min, int $max): int
    {
        $value = isset($p[$name]) && is_numeric($p[$name]) ? (int) $p[$name] : $default;

        return max($min, min($max, $value));
    }
}

/**
 * Октети маски за довжиною префікса.
 *
 * @return list<int>
 */
function mask_octets(int $prefix): array
{
    $octets = [];
    for ($i = 0; $i < 4; $i++) {
        $bits = max(0, min(8, $prefix - $i * 8));
        $octets[] = $bits === 0 ? 0 : (0xFF << (8 - $bits)) & 0xFF;
    }

    return $octets;
}

/**
 * Таблиця з двійковим поданням адрес.
 *
 * @param list<array{0: string, 1: list<int>, 2?: bool}> $rows
 */
function binary_rows(array $rows): string
{
    $html = '<table class="data"><thead><tr><th>Величина</th>'
        . '<th>Десятковий запис</th><th>Двійковий запис</th></tr></thead><tbody>';

    foreach ($rows as $row) {
        $accent = ($row[2] ?? false) ? ' style="color: var(--accent)"' : '';
        $binary = implode(' . ', array_map(
            static fn (int $o): string => str_pad(decbin($o), 8, '0', STR_PAD_LEFT),
            $row[1]
        ));
        $html .= '<tr><td>' . h($row[0]) . '</td>'
            . '<td class="num"' . $accent . '>' . h(implode('.', $row[1])) . '</td>'
            . '<td class="num"' . $accent . '>' . h($binary) . '</td></tr>';
    }

    return $html . '</tbody></table>';
}
