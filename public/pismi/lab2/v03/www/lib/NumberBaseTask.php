<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class NumberBaseTask extends Task
{
    public function title(): string
    {
        return 'Система обчислення';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Число', 'default' => '2026'],
            'base' => ['label' => 'Основа (10, 2 або 16)', 'default' => '16'],
        ];
    }

    public function render(array $p): string
    {
        $value = $this->int($p, 'value', 0, 0, PHP_INT_MAX);
        $base = $this->int($p, 'base', 10, 2, 16);
        $supported = [2 => 'двійкова', 10 => 'десяткова', 16 => 'шістнадцяткова'];

        if (!isset($supported[$base])) {
            return '<p class="errors">Передбачено лише основи 2, 10 та 16.</p>';
        }

        $rows = '';
        foreach ($supported as $b => $name) {
            $digits = strtoupper(base_convert((string) $value, 10, $b));
            $current = $b === $base;
            $rows .= sprintf(
                '<tr><td>%s</td><td class="num">%d</td><td class="num"%s>%s</td></tr>',
                h($name),
                $b,
                $current ? ' style="color: var(--accent)"' : '',
                h($digits)
            );
        }

        return '<table class="data"><thead><tr><th>Система</th>'
            . '<th class="num">Основа</th><th class="num">Запис</th></tr></thead>'
            . '<tbody>' . $rows . '</tbody></table>'
            . '<p class="hint">Виділено систему, задану другим параметром.</p>';
    }

    public function conclusion(): string
    {
        return 'Число не змінюється від того, у якій системі його записано: '
            . 'змінюється лише форма запису. Основа задає, скільки різних '
            . 'цифр доступно й якою є вага розряду, тому одне й те саме '
            . 'значення виглядає то довгим ланцюжком нулів та одиниць, то '
            . 'кількома шістнадцятковими цифрами.';
    }
}
