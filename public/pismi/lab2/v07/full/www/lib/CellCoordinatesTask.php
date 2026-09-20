<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class CellCoordinatesTask extends Task
{
    public function title(): string
    {
        return 'Координати комірки';
    }

    public function params(): array
    {
        return [
            'rows' => ['label' => 'Рядків', 'default' => '6'],
            'cols' => ['label' => 'Стовпців', 'default' => '9'],
            'row' => ['label' => 'Рядок комірки', 'default' => '3'],
            'col' => ['label' => 'Стовпець комірки', 'default' => '7'],
        ];
    }

    public function render(array $p): string
    {
        $rows = $this->int($p, 'rows', 6, 1, 20);
        $cols = $this->int($p, 'cols', 9, 1, 20);
        // Позначена комірка не може опинитися поза таблицею, тому її
        // координати затискаються вже за відомими розмірами.
        $row = $this->int($p, 'row', 3, 1, $rows);
        $col = $this->int($p, 'col', 7, 1, $cols);

        $head = '<tr><td class="axis"></td>';
        for ($c = 1; $c <= $cols; $c++) {
            $head .= '<td class="axis">' . $c . '</td>';
        }
        $head .= '</tr>';

        $body = '';
        for ($r = 1; $r <= $rows; $r++) {
            $body .= '<tr><td class="axis">' . $r . '</td>';
            for ($c = 1; $c <= $cols; $c++) {
                $marked = $r === $row && $c === $col;
                $body .= '<td' . ($marked ? ' class="marked"' : '') . '>'
                    . ($marked ? 'X' : '') . '</td>';
            }
            $body .= '</tr>';
        }

        return sprintf(
            '<p class="hint">Таблиця %d × %d, позначено комірку (%d; %d).</p>',
            $rows,
            $cols,
            $row,
            $col
        ) . '<table class="canvas"><tbody>' . $head . $body . '</tbody></table>';
    }

    public function conclusion(): string
    {
        return 'Таблиця будується двома вкладеними циклами, а позначена '
            . 'комірка визначається не окремою гілкою розмітки, а збігом '
            . 'лічильників із заданими координатами. Через це розмір таблиці '
            . 'і положення позначки незалежні: змінюється будь-що з них, а '
            . 'код лишається тим самим. Координати обов’язково затискаються в '
            . 'межі таблиці – інакше параметр із рядка браузера міг би '
            . 'вказати на комірку, якої немає.';
    }
}
