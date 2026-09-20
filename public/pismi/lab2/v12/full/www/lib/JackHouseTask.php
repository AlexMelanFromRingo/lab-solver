<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class JackHouseTask extends Task
{
    /**
     * Ланки лічилки: перша частина називає предмет, друга продовжує ланцюг.
     * Верхня ланка приєднує до себе всі попередні, тому куплет складається
     * сам, без переписування тексту.
     */
    private const LINKS = [
        ['дім', 'який збудував Джек'],
        ['пшениця', 'яка в темній комірчині зберігається в домі'],
        ['весела синиця', 'яка часто краде пшеницю'],
        ['кіт', 'який лякає й ловить синицю'],
        ['пес без хвоста', 'який за комір термосить кота'],
    ];

    public function title(): string
    {
        return 'Будинок, що збудував Джек';
    }

    public function params(): array
    {
        return [
            'verses' => ['label' => 'Скільки куплетів', 'default' => '3'],
            'align' => ['label' => 'Вирівнювання', 'default' => 'justify'],
        ];
    }

    public function render(array $p): string
    {
        $verses = $this->int($p, 'verses', 3, 1, count(self::LINKS));
        $align = (string) ($p['align'] ?? 'justify');
        $allowed = ['left' => 'за лівим краєм', 'center' => 'по центру',
                    'right' => 'за правим краєм', 'justify' => 'за шириною'];
        if (!isset($allowed[$align])) {
            $align = 'justify';
        }

        $out = '';
        for ($k = 0; $k < $verses; $k++) {
            $parts = [self::LINKS[$k][0] . ', ' . self::LINKS[$k][1]];
            for ($j = $k - 1; $j >= 0; $j--) {
                $parts[] = self::LINKS[$j][1];
            }
            $out .= '<p style="text-align: ' . h($align) . '">Ось '
                . h(implode(', ', $parts)) . '.</p>';
        }

        return $out . '<p class="hint">Вирівнювання: ' . h($allowed[$align]) . '.</p>';
    }

    public function conclusion(): string
    {
        return 'Текст лічилки не зберігається куплетами – зберігаються лише '
            . 'ланки. Кожен наступний куплет дописує до себе всі попередні у '
            . 'зворотному порядку, тому додати шосту ланку означає дописати '
            . 'один рядок даних, а не новий абзац. Вирівнювання приходить '
            . 'останнім параметром і впливає лише на подання.';
    }
}
