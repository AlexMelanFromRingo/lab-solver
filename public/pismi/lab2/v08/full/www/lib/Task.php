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
