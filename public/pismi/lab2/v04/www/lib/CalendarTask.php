<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class CalendarTask extends Task
{
    public function title(): string
    {
        return 'Календар';
    }

    public function params(): array
    {
        return [
            'first' => ['label' => 'День тижня 1-го числа (1–7)', 'default' => '4'],
            'days' => ['label' => 'Днів у місяці', 'default' => '30'],
        ];
    }

    public function render(array $p): string
    {
        $first = $this->int($p, 'first', 1, 1, 7);
        $days = $this->int($p, 'days', 30, 28, 31);
        $names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

        $cells = array_fill(0, 35, '');
        for ($day = 1; $day <= $days; $day++) {
            $index = $first - 2 + $day;
            if ($index >= 0 && $index < 35) {
                $cells[$index] = (string) $day;
            }
        }

        $head = '';
        foreach ($names as $i => $name) {
            $weekend = $i >= 5 ? ' style="color: var(--accent)"' : '';
            $head .= '<th' . $weekend . '>' . $name . '</th>';
        }

        $body = '';
        for ($row = 0; $row < 5; $row++) {
            $body .= '<tr>';
            for ($col = 0; $col < 7; $col++) {
                $body .= '<td>' . h($cells[$row * 7 + $col]) . '</td>';
            }
            $body .= '</tr>';
        }

        return '<table class="canvas"><thead><tr>' . $head . '</tr></thead>'
            . '<tbody>' . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Календар не потребує ні дати, ні назви місяця: досить знати, '
            . 'на який день тижня припадає перше число й скільки днів у '
            . 'місяці. Решта – зсув: номер дня перетворюється на номер '
            . 'комірки додаванням сталої, а таблиця 5 × 7 вміщує будь-який '
            . 'місяць, який починається не пізніше неділі.';
    }
}
