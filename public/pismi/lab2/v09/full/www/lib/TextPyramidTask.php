<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class TextPyramidTask extends Task
{
    public function title(): string
    {
        return 'Текстова піраміда';
    }

    public function params(): array
    {
        return [
            'height' => ['label' => 'Висота, рядів', 'default' => '6'],
            'block' => ['label' => 'Ширина блока, символів', 'default' => '8'],
            'word' => ['label' => 'Слово-заповнювач', 'default' => 'камінь'],
        ];
    }

    public function render(array $p): string
    {
        $height = $this->int($p, 'height', 6, 1, 14);
        $block = $this->int($p, 'block', 8, 3, 16);
        $word = trim((string) ($p['word'] ?? 'камінь')) ?: 'камінь';

        $cell = mb_substr(str_repeat($word, $block), 0, $block);
        $rows = '';
        for ($level = 1; $level <= $height; $level++) {
            $rows .= '<tr>';
            for ($i = 0; $i < $level; $i++) {
                $rows .= '<td style="width: auto; padding: 0 0.5rem">' . h($cell) . '</td>';
            }
            $rows .= '</tr>';
        }

        return '<table class="canvas" style="margin-left: auto; margin-right: auto">'
            . '<tbody>' . $rows . '</tbody></table>'
            . sprintf(
                '<p class="hint">Висота %d рядів, у блоці %d символів слова «%s».</p>',
                $height,
                $block,
                h($word)
            );
    }

    public function conclusion(): string
    {
        return 'Піраміда будується вкладеними циклами, де внутрішній '
            . 'виконується стільки разів, який зараз рівень. Слово-заповнювач '
            . 'підрізається до заданої ширини, тому блоки лишаються '
            . 'однаковими незалежно від того, довше слово за блок чи коротше.';
    }
}
