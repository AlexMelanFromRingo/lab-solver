<?php

declare(strict_types=1);

/**
 * Завдання за індивідуальним варіантом.
 */
final class NodeAddressTask extends Task
{
    public function title(): string
    {
        return 'Адреса вузла';
    }

    public function params(): array
    {
        return [
            'o1' => ['label' => 'Байт 1', 'default' => '192'],
            'o2' => ['label' => 'Байт 2', 'default' => '168'],
            'o3' => ['label' => 'Байт 3', 'default' => '0'],
            'o4' => ['label' => 'Байт 4', 'default' => '0'],
            'prefix' => ['label' => 'Префікс', 'default' => '16'],
        ];
    }

    public function render(array $p): string
    {
        $address = [];
        foreach (['o1', 'o2', 'o3', 'o4'] as $key) {
            $address[] = $this->int($p, $key, 0, 0, 255);
        }
        $prefix = $this->int($p, 'prefix', 16, 0, 32);

        $mask = mask_octets($prefix);
        // Адреса вузла – це те, що лишається від адреси після зняття
        // мережевої частини: логічне «і» з інверсією маски.
        $host = [];
        foreach ($address as $i => $octet) {
            $host[] = $octet & ~$mask[$i] & 0xFF;
        }

        return binary_rows([
            ['Адреса мережі', $address],
            ['Маска /' . $prefix, $mask],
            ['НЕ маска', array_map(static fn (int $o): int => ~$o & 0xFF, $mask)],
            ['Адреса вузла', $host, true],
        ]);
    }

    public function conclusion(): string
    {
        return 'Мережева й вузлова частини адреси розділяються не '
            . 'арифметично, а порозрядно: маска лишає мережу, її інверсія – '
            . 'вузол. У двійковому поданні це видно як точну межу між '
            . 'одиницями та нулями маски, і саме на цій межі обривається '
            . 'збережена частина адреси.';
    }
}
