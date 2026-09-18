<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class ChessboardTask extends Task
{
    public function title(): string
    {
        return 'Шахи';
    }

    public function params(): array
    {
        return [
            'col' => ['label' => 'Вертикаль короля (1–8)', 'default' => '5'],
            'row' => ['label' => 'Горизонталь короля (1–8)', 'default' => '1'],
        ];
    }

    public function render(array $p): string
    {
        $col = $this->int($p, 'col', 5, 1, 8);
        $row = $this->int($p, 'row', 1, 1, 8);
        $files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        $body = '';
        // Восьма горизонталь угорі, як на шаховій дошці.
        for ($r = 8; $r >= 1; $r--) {
            $body .= '<tr><td class="axis">' . $r . '</td>';
            for ($c = 1; $c <= 8; $c++) {
                $light = ($r + $c) % 2 === 0;
                $king = $c === $col && $r === $row;
                $style = $light
                    ? 'background: rgba(230, 240, 248, 0.10)'
                    : 'background: rgba(0, 0, 0, 0.30)';
                $body .= '<td style="' . $style . '"'
                    . ($king ? ' class="marked"' : '') . '>'
                    . ($king ? 'K' : '') . '</td>';
            }
            $body .= '</tr>';
        }

        $footer = '<tr><td class="axis"></td>';
        foreach ($files as $file) {
            $footer .= '<td class="axis">' . $file . '</td>';
        }
        $footer .= '</tr>';

        return sprintf(
            '<p class="hint">Король стоїть на полі %s%d.</p>',
            $files[$col - 1],
            $row
        ) . '<table class="canvas"><tbody>' . $body . $footer . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Колір поля визначається парністю суми координат – одна умова '
            . 'замість шістдесяти чотирьох окремих комірок. Нумерація '
            . 'горизонталей іде згори вниз, тому зовнішній цикл рахує у '
            . 'зворотному напрямку: інакше дошка вийшла б перевернутою '
            . 'відносно звичного запису.';
    }
}
