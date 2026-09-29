<?php

/**
 * Лабораторна робота № 1. Підготування платформи для розгортання web-додатку.
 *
 * Індивідуальне завдання: модифікувати програму на PHP так, щоб вона
 * виводила ПІБ та навчальну групу студента.
 */

$student = "%%PIB%%";
$group = "%%GROUP%%";
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Лабораторна робота № 1</title>
    <style>
        :root {
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --text: #1d242b;
            --muted: #5f6b76;
            --line: #dde2e7;
        }

        body {
            margin: 0;
            background: #f4f6f8;
            color: var(--text);
            font: 17px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        main {
            max-width: 680px;
            margin: 12vh auto 0;
            padding: 40px 48px 44px;
            border: 1px solid var(--line);
            border-top: 4px solid var(--accent);
            border-radius: 6px;
            background: #ffffff;
        }

        .lab {
            margin: 0 0 28px;
            color: var(--muted);
        }

        h1 {
            margin: 0 0 8px;
            font-size: 34px;
            line-height: 1.2;
        }

        .group {
            display: inline-block;
            margin: 0;
            padding: 2px 10px;
            border-radius: 4px;
            background: var(--accent-soft);
            font-weight: 600;
        }

        .note {
            margin: 32px 0 0;
            padding-top: 16px;
            border-top: 1px solid var(--line);
            color: var(--muted);
            font-size: 14px;
        }

        @media (max-width: 720px) {
            main {
                margin: 24px 16px;
                padding: 28px 24px;
            }
        }
    </style>
</head>
<body>
    <main>
        <p class="lab">
            Лабораторна робота № 1<br>
            Підготування платформи для розгортання web-додатку
        </p>
        <h1><?= htmlspecialchars($student) ?></h1>
        <p class="group">Група <?= htmlspecialchars($group) ?></p>
        <p class="note">Сторінку сформовано PHP <?= PHP_VERSION ?> у контейнері Docker.</p>
    </main>
</body>
</html>
