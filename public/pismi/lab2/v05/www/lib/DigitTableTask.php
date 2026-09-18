<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class DigitTableTask extends Task
{
    public function title(): string
    {
        return 'Таблиця за цифрами числа';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Десяткове число', 'default' => '385617'],
        ];
    }

    public function render(array $p): string
    {
        $digits = preg_replace('/\D/', '', (string) ($p['value'] ?? '385617')) ?: '385617';
        $odd = [];
        $even = [];
        foreach (str_split($digits) as $digit) {
            if ((int) $digit % 2 === 0) {
                $even[] = $digit;
            } else {
                $odd[] = $digit;
            }
        }

        $rows = max(1, min(12, count($odd)));
        $cols = max(1, min(12, count($even)));

        $body = '';
        for ($r = 1; $r <= $rows; $r++) {
            $body .= '<tr>';
            for ($c = 1; $c <= $cols; $c++) {
                $body .= '<td>' . $r . '·' . $c . '</td>';
            }
            $body .= '</tr>';
        }

        return sprintf(
            '<p class="hint">Непарні цифри числа %s – %s, їх %d, це число рядків. '
            . 'Парні – %s, їх %d, це число стовпців.</p>',
            h($digits),
            h(implode(', ', $odd) ?: 'відсутні'),
            $rows,
            h(implode(', ', $even) ?: 'відсутні'),
            $cols
        ) . '<table class="canvas"><tbody>' . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Розмір таблиці не задано явно – його доводиться видобувати з '
            . 'числа, розібравши його на цифри та розсортувавши за парністю. '
            . 'Це типова для web задача: дані приходять рядком, і програма '
            . 'спершу має перетворити їх на щось придатне для побудови '
            . 'розмітки, не довіряючи вхідному значенню.';
    }
}
