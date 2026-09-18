<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class SpelledNumberTask extends Task
{
    public function title(): string
    {
        return 'Текстове число';
    }

    public function params(): array
    {
        return [
            'value' => ['label' => 'Число від 0,0 до 9,9', 'default' => '3.3'],
        ];
    }

    public function render(array $p): string
    {
        $raw = str_replace(',', '.', (string) ($p['value'] ?? '3.3'));
        $value = is_numeric($raw) ? (float) $raw : 3.3;
        $value = max(0.0, min(9.9, $value));

        $whole = (int) floor($value);
        $tenth = (int) round(($value - $whole) * 10);

        $units = ['нуль', 'одна', 'дві', 'три', 'чотири', 'п’ять', 'шість',
                  'сім', 'вісім', 'дев’ять'];
        $words = sprintf(
            '%s %s %s %s',
            $units[$whole],
            $this->plural($whole, 'ціла', 'цілих', 'цілих'),
            $units[$tenth],
            $this->plural($tenth, 'десята', 'десятих', 'десятих')
        );

        return '<div class="facts__value">' . h(mb_strtolower($words)) . '</div>'
            . sprintf(
                '<p class="hint">Розкладено на частини: ціла – %d, дробова – %d десятих.</p>',
                $whole,
                $tenth
            );
    }

    private function plural(int $count, string $one, string $few, string $many): string
    {
        if ($count === 1) {
            return $one;
        }

        return $count >= 2 && $count <= 4 ? $few : $many;
    }

    public function conclusion(): string
    {
        return 'Переведення числа в текст спирається не на саме число, а на '
            . 'його розряди: ціла частина й десяті озвучуються окремо, а '
            . 'форма слова залежить від останньої цифри. Тому програма '
            . 'спершу розкладає число, і лише потім добирає слова.';
    }
}
