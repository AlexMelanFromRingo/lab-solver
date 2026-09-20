<?php

declare(strict_types=1);

/**
 * Початок документа та дрібні помічники.
 *
 * Тут навмисно немає ані розкладки, ані «панелей»: кожна робота верстає
 * сторінку під свій зміст і підключає власний style.css. Спільними лишаються
 * тільки початок документа, набір акцентних кольорів і кілька помічників.
 *
 * Оформлення коду – за PSR-12.
 */

/** Акцентний колір роботи. */
const ACCENT = '#a6b04a';

/**
 * Екранування для виводу в HTML.
 */
function h(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Початок документа: <head> з гарнітурами, спільними основами та власним
 * файлом оформлення роботи. Розмітку <body> кожна робота пише сама.
 */
function ust_head(string $title, string $stylesheet = 'style.css', string $accent = ACCENT): void
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
