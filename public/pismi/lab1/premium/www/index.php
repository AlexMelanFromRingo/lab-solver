<?php

/**
 * Лабораторна робота № 1. Підготування платформи для розгортання web-додатку.
 *
 * Індивідуальне завдання: модифікувати програму на PHP так, щоб вона
 * виводила ПІБ та навчальну групу студента.
 */

$student = "%%PIB%%";
$group = "%%GROUP%%";

// Відомості про оточення зчитує сам інтерпретатор під час запиту:
// так сторінка підтверджує, що PHP справді працює в контейнері.
$environment = [
    'Інтерпретатор' => 'PHP ' . PHP_VERSION,
    'Веб-сервер' => $_SERVER['SERVER_SOFTWARE'] ?? 'невідомо',
    'Корінь сайту' => $_SERVER['DOCUMENT_ROOT'] ?? '/var/www/html',
];

// Розширення, які docker-compose.yml встановлює командою контейнера.
$extensions = ['mysqli', 'pdo_mysql', 'zip'];
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Лабораторна робота № 1 – <?= htmlspecialchars($student) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
    <style>
        :root {
            --field: #0f1a22;
            --field-deep: #081018;
            --glass: rgba(206, 222, 236, 0.055);
            --glass-strong: rgba(206, 222, 236, 0.09);
            --edge: rgba(206, 222, 236, 0.13);
            --edge-strong: rgba(206, 222, 236, 0.24);
            --ink: #e7edf2;
            --muted: #93a4b2;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-text: color-mix(in srgb, var(--accent) 52%, #ffffff);
            --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
            --mono: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
        }

        * {
            box-sizing: border-box;
        }

        html {
            background: var(--field-deep);
        }

        body {
            margin: 0;
            min-height: 100vh;
            color: var(--ink);
            font: 400 16px/1.55 var(--sans);
            background:
                radial-gradient(760px 520px at 8% -8%, color-mix(in srgb, var(--accent) 42%, transparent), transparent 72%),
                radial-gradient(900px 640px at 105% 112%, rgba(52, 96, 128, 0.5), transparent 70%),
                linear-gradient(155deg, #13222f 0%, var(--field) 48%, var(--field-deep) 100%);
            background-attachment: fixed;
            isolation: isolate;
        }

        /* Великий профіль рейки за склом: акрилові панелі розмивають його край */
        body::before {
            content: "";
            position: fixed;
            right: -170px;
            bottom: -330px;
            width: 820px;
            height: 820px;
            z-index: -1;
            background: var(--accent);
            opacity: 0.22;
            transform: rotate(-14deg);
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z'/%3E%3C/svg%3E") center / contain no-repeat;
        }

        .page {
            display: grid;
            grid-template-rows: auto 1fr;
            gap: 56px;
            max-width: 1120px;
            min-height: 100vh;
            margin: 0 auto;
            padding: 36px 48px 56px;
        }

        .top {
            display: flex;
            align-items: center;
            gap: 14px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.35;
        }

        .top svg {
            flex: none;
            width: 34px;
            height: 34px;
            color: var(--accent-text);
        }

        .top b {
            display: block;
            color: var(--ink);
            font-weight: 500;
        }

        main {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
            align-content: center;
            gap: 28px;
        }

        .lab {
            grid-column: 1 / -1;
            max-width: 46rem;
        }

        .lab p {
            margin: 0 0 6px;
            color: var(--accent-text);
            font-weight: 500;
        }

        .lab h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 500;
            line-height: 1.3;
        }

        .plate,
        .env {
            border: 1px solid var(--edge);
            border-radius: 18px;
            background: var(--glass);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            backdrop-filter: blur(22px) saturate(150%);
        }

        .plate {
            position: relative;
            overflow: hidden;
            padding: 40px 44px 44px;
            border-color: var(--edge-strong);
            background: var(--glass-strong);
        }

        .role {
            margin: 0 0 12px;
            color: var(--muted);
        }

        .name {
            margin: 0 0 30px;
            max-width: 13em;
            font-size: 54px;
            font-weight: 600;
            line-height: 1.08;
            letter-spacing: -0.015em;
        }

        .group {
            display: flex;
            align-items: center;
            gap: 14px;
            margin: 0;
            color: var(--muted);
        }

        .group b {
            padding: 6px 16px 7px;
            border-radius: 8px;
            background: var(--accent);
            color: var(--accent-ink);
            font: 500 24px/1.2 var(--mono);
            letter-spacing: 0.04em;
        }

        .env {
            align-self: end;
            padding: 26px 28px;
        }

        .env h2 {
            margin: 0 0 16px;
            font-size: 17px;
            font-weight: 500;
        }

        .env dl {
            display: grid;
            gap: 12px;
            margin: 0 0 20px;
        }

        .env dt {
            color: var(--muted);
            font-size: 13px;
        }

        .env dd {
            margin: 0;
            font: 400 15px/1.4 var(--mono);
            overflow-wrap: anywhere;
        }

        .ext {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .ext li {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 12px;
            border: 1px solid var(--edge);
            border-radius: 999px;
            font: 400 14px/1.3 var(--mono);
        }

        .ext li::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent-text);
        }

        .ext li.off {
            color: var(--muted);
        }

        .ext li.off::before {
            background: transparent;
            box-shadow: inset 0 0 0 1px var(--muted);
        }

        @media (max-width: 900px) {
            .page {
                gap: 36px;
                padding: 24px 20px 40px;
            }

            main {
                grid-template-columns: 1fr;
            }

            .plate {
                padding: 30px 26px 32px;
            }

            .name {
                font-size: 38px;
            }
        }
    </style>
</head>
<body>
<div class="page">

    <header class="top">
        <!-- Профіль рейки: університет виріс із залізничного інституту -->
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7.5 2h9a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-2.9v8.2l5.9 3.8V22H4.5v-2.5l5.9-3.8V7.5H7.5A1.5 1.5 0 0 1 6 6V3.5A1.5 1.5 0 0 1 7.5 2Z"/>
        </svg>
        <div>
            <b>Український державний університет науки і технологій</b>
            Кафедра електронних обчислювальних машин
        </div>
    </header>

    <main>
        <div class="lab">
            <p>Лабораторна робота № 1</p>
            <h1>Підготування платформи для розгортання web-додатку</h1>
        </div>

        <section class="plate">
            <p class="role">Роботу виконав</p>
            <p class="name"><?= htmlspecialchars($student) ?></p>
            <p class="group">студент групи <b><?= htmlspecialchars($group) ?></b></p>
        </section>

        <section class="env">
            <h2>Оточення контейнера</h2>
            <dl>
<?php foreach ($environment as $label => $value) : ?>
                <div>
                    <dt><?= htmlspecialchars($label) ?></dt>
                    <dd><?= htmlspecialchars($value) ?></dd>
                </div>
<?php endforeach; ?>
            </dl>
            <ul class="ext">
<?php foreach ($extensions as $extension) : ?>
                <li<?= extension_loaded($extension) ? '' : ' class="off"' ?>><?= $extension ?></li>
<?php endforeach; ?>
            </ul>
        </section>
    </main>

</div>
</body>
</html>
