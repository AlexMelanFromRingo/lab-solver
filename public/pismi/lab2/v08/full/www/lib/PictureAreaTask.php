<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class PictureAreaTask extends Task
{
    public function title(): string
    {
        return 'Площа картинки';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, пікселів', 'default' => '180'],
            'width' => ['label' => 'Ширина, пікселів', 'default' => '320'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 180, 20, 600);
        $width = $this->int($p, 'width', 320, 20, 900);
        $area = $height * $width;

        $picture = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 %d %d" role="img" '
            . 'aria-label="Зразок картинки" style="border: 1px solid var(--hairline)">'
            . '<rect width="%d" height="%d" fill="rgba(0,0,0,0.25)"/>'
            . '<path d="M0 %d L%d %d L%d %d L%d %d Z" fill="var(--accent-soft)"/>'
            . '<circle cx="%d" cy="%d" r="%d" fill="var(--accent)" opacity="0.7"/>'
            . '</svg>',
            $width,
            $height,
            $width,
            $height,
            $width,
            $height,
            (int) ($height * 0.75),
            (int) ($width * 0.35),
            (int) ($height * 0.45),
            (int) ($width * 0.7),
            (int) ($height * 0.8),
            $width,
            $height,
            (int) ($width * 0.78),
            (int) ($height * 0.28),
            (int) min($width, $height) / 8
        );

        return $picture
            . '<div class="facts">'
            . '<div><div class="facts__label">Висота</div><div class="facts__value">'
            . $height . ' px</div></div>'
            . '<div><div class="facts__label">Ширина</div><div class="facts__value">'
            . $width . ' px</div></div>'
            . '<div><div class="facts__label">Площа</div><div class="facts__value">'
            . number_format($area, 0, '.', ' ') . ' px²</div></div>'
            . '</div>';
    }

    public function conclusion(): string
    {
        return 'Розміри картинки задаються параметрами запиту й потрапляють '
            . 'одразу в два місця: в атрибути зображення та в розрахунок '
            . 'площі. Обчислення тривіальне, а от перевірка меж – ні: без неї '
            . 'параметр із рядка браузера здатен намалювати зображення '
            . 'завбільшки з екран або взагалі нульове.';
    }
}
