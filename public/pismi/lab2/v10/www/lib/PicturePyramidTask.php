<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class PicturePyramidTask extends Task
{
    public function title(): string
    {
        return 'Піраміда рисунків';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, рядів', 'default' => '5'],
            'size' => ['label' => 'Сторона блока, пікселів', 'default' => '48'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 5, 1, 10);
        $size = $this->int($p, 'size', 48, 12, 96);

        $brick = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 24 24" aria-hidden="true">'
            . '<rect x="1" y="1" width="22" height="22" rx="2" fill="var(--accent-soft)" '
            . 'stroke="var(--accent)" stroke-width="1"/>'
            . '<path d="M1 12h22M12 1v22" stroke="var(--accent)" stroke-width="0.6" opacity="0.5"/>'
            . '</svg>',
            $size,
            $size
        );

        $rows = '';
        for ($level = 1; $level <= $height; $level++) {
            $rows .= '<div class="bricks__row">' . str_repeat($brick, $level) . '</div>';
        }

        return '<div class="bricks">' . $rows . '</div>'
            . sprintf(
                '<p class="hint">Висота %d рядів, сторона блока %d пікселів, '
                . 'усього %d рисунків.</p>',
                $height,
                $size,
                $height * ($height + 1) / 2
            );
    }

    public function conclusion(): string
    {
        return 'Замість готових файлів використано вбудовану векторну '
            . 'графіку: розмір блока задається параметром, а рисунок '
            . 'масштабується без втрати якості. Загальна кількість блоків '
            . 'дорівнює сумі арифметичної прогресії, тому її можна не '
            . 'рахувати циклом.';
    }
}
