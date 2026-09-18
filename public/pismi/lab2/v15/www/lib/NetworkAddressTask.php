<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class NetworkAddressTask extends Task
{
    public function title(): string
    {
        return 'Адреса мережі';
    }

    public function params(): array
    {
        return [
            'a1' => ['label' => 'IP байт 1', 'default' => '192'],
            'a2' => ['label' => 'IP байт 2', 'default' => '168'],
            'a3' => ['label' => 'IP байт 3', 'default' => '17'],
            'a4' => ['label' => 'IP байт 4', 'default' => '43'],
            'm1' => ['label' => 'Маска байт 1', 'default' => '255'],
            'm2' => ['label' => 'Маска байт 2', 'default' => '255'],
            'm3' => ['label' => 'Маска байт 3', 'default' => '240'],
            'm4' => ['label' => 'Маска байт 4', 'default' => '0'],
        ];
    }

    public function render(array $p): string
    {
        $address = [];
        $mask = [];
        foreach ([1, 2, 3, 4] as $i) {
            $address[] = $this->int($p, 'a' . $i, 0, 0, 255);
            $mask[] = $this->int($p, 'm' . $i, 0, 0, 255);
        }

        $network = [];
        foreach ($address as $i => $octet) {
            $network[] = $octet & $mask[$i];
        }

        return binary_rows([
            ['Адреса вузла', $address],
            ['Маска підмережі', $mask],
            ['Адреса мережі', $network, true],
        ]);
    }

    public function conclusion(): string
    {
        return 'Логічне «і» з маскою обнуляє саме ті розряди, у яких маска '
            . 'містить нулі, тому адреса мережі – це адреса вузла з '
            . 'відкинутим «хвостом». Операція виконується над кожним байтом '
            . 'окремо, але сенс має лише на всій адресі: межа мережі не '
            . 'зобов’язана збігатися з межею байта.';
    }
}
