<?php

declare(strict_types=1);

/**
 * Спільні дрібниці для сторінок робіт курсу.
 *
 * Тут навмисно немає ані розкладки, ані «панелей»: кожна робота верстає
 * сторінку під свій зміст і підключає власний style.css. Спільними лишаються
 * тільки початок документа, набір акцентних кольорів і кілька помічників.
 *
 * Оформлення коду – за PSR-12.
 */

/**
 * Акцентні кольори. Номер студента в списку групи задає, який саме –
 * так у кожного робота виглядає по-своєму, але лишається в одній системі.
 *
 * @return list<array{name: string, hex: string}>
 */
function ust_palette(): array
{
    return [
        ['name' => 'лазур',     'hex' => '#5ba7d6'],
        ['name' => 'мідянка',   'hex' => '#4fb89a'],
        ['name' => 'сурик',     'hex' => '#c2544e'],
        ['name' => 'аметист',   'hex' => '#9b8cd6'],
        ['name' => 'бурштин',   'hex' => '#e09a3c'],
        ['name' => 'нефрит',    'hex' => '#52b07a'],
        ['name' => 'латунь',    'hex' => '#c9a227'],
        ['name' => 'індиго',    'hex' => '#6e8fe0'],
        ['name' => 'корал',     'hex' => '#e0705a'],
        ['name' => 'бірюза',    'hex' => '#46b3be'],
        ['name' => 'лаванда',   'hex' => '#b18cd9'],
        ['name' => 'олива',     'hex' => '#a6b04a'],
        ['name' => 'кварц',     'hex' => '#d9789b'],
        ['name' => 'сталь',     'hex' => '#7fa0b8'],
        ['name' => 'орхідея',   'hex' => '#c77db8'],
    ];
}

/**
 * Акцент за порядковим номером; за межами набору кольори йдуть по колу.
 *
 * @return array{name: string, hex: string}
 */
function ust_accent(int $index): array
{
    $palette = ust_palette();

    return $palette[($index - 1) % count($palette)];
}

/**
 * Екранування для виводу в HTML.
 */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Читає цілий параметр рядка браузера із затиском у межі.
 */
function ust_int_param(string $name, int $default, int $min, int $max): int
{
    if (!isset($_GET[$name]) || !is_string($_GET[$name]) || !is_numeric($_GET[$name])) {
        return $default;
    }

    return max($min, min($max, (int) $_GET[$name]));
}

/**
 * Початок документа: <head> з гарнітурами, спільними основами та власним
 * файлом оформлення роботи. Розмітку <body> кожна робота пише сама.
 */
function ust_head(string $title, string $accent, string $stylesheet = 'style.css'): void
{
    ?>
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($title) ?></title>
<link rel="icon" href="_shared/mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<link rel="stylesheet" href="_shared/tokens.css">
<link rel="stylesheet" href="<?= h($stylesheet) ?>">
<style>:root { --accent: <?= h($accent) ?>; }</style>
</head>
<?php
}
