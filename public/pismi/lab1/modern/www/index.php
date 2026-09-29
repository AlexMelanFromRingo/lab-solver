<?php

/**
 * Лабораторна робота № 1. Підготування платформи для розгортання web-додатку.
 *
 * Індивідуальне завдання: модифікувати програму на PHP так, щоб вона
 * виводила ПІБ та навчальну групу студента. Сторінка оформлена як аркуш
 * креслення: ПІБ і група стоять і в полі аркуша, і в основному написі.
 */

$student = "%%PIB%%";
$group = "%%GROUP%%";
$author = "%%PIB_SHORT%%";
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Лабораторна робота № 1 – <?= htmlspecialchars($author) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">
    <style>
        :root {
            --desk: #d6dde3;
            --paper: #ffffff;
            --line: #1b2630;
            --thin: #8a98a4;
            --grid: rgba(27, 38, 48, 0.05);
            --text: #1b2630;
            --muted: #56646f;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-line: color-mix(in srgb, var(--accent) 82%, #000000);
            --font: "PT Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif;
            --mono: "PT Mono", ui-monospace, "Cascadia Mono", monospace;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--desk);
            color: var(--text);
            font: 400 18px/1.45 var(--font);
        }

        /* Аркуш: зовнішня тонка межа, рамка з полем для підшивки ліворуч */
        .sheet {
            min-height: calc(100vh - 40px);
            padding: 12px 12px 12px 44px;
            border: 1px solid var(--thin);
            background:
                linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 20px 20px,
                var(--paper);
        }

        .frame {
            display: grid;
            grid-template-rows: 1fr auto;
            min-height: calc(100vh - 66px);
            border: 2px solid var(--line);
        }

        .field {
            padding: 34px 44px 24px;
        }

        .lab {
            margin: 0;
            color: var(--muted);
            font-size: 20px;
        }

        h1 {
            margin: 2px 0 40px;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
        }

        .name {
            margin: 0;
            font-size: 68px;
            font-weight: 700;
            line-height: 1.02;
        }

        .group {
            display: flex;
            align-items: baseline;
            gap: 12px;
            margin: 14px 0 44px;
            font-size: 24px;
        }

        .group b {
            padding: 0 10px;
            border: 2px solid var(--accent-line);
            color: var(--accent-line);
            font: 400 26px/1.3 var(--mono);
        }

        .scheme {
            display: block;
            width: 100%;
            max-width: 860px;
            height: auto;
        }

        .scheme text {
            font-family: var(--font);
            font-size: 17px;
            fill: var(--text);
        }

        .scheme .small {
            font-size: 15px;
            fill: var(--muted);
        }

        .scheme .dim {
            fill: var(--accent-line);
        }

        /* Основний напис, як на кресленні: правий нижній кут */
        .stamp {
            display: grid;
            grid-template-columns: 96px 150px 230px;
            grid-template-areas:
                "k1 v1 title"
                "k2 v2 title"
                "k3 v3 title"
                "org org sheet";
            justify-self: end;
            border-top: 2px solid var(--line);
            border-left: 2px solid var(--line);
            font-size: 16px;
        }

        .stamp > * {
            margin: 0;
            padding: 5px 10px;
            border-right: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
        }

        .stamp .key {
            color: var(--muted);
        }

        .stamp .title {
            grid-area: title;
            display: grid;
            place-content: center;
            border-right: 0;
            font-size: 20px;
            font-weight: 700;
            text-align: center;
        }

        .stamp .org {
            grid-area: org;
            border-top: 1px solid var(--line);
            border-bottom: 0;
        }

        .stamp .sheet-no {
            grid-area: sheet;
            border-top: 1px solid var(--line);
            border-right: 0;
            border-bottom: 0;
            text-align: center;
        }

        .stamp .mono {
            font-family: var(--mono);
            font-size: 15px;
        }

        @media (max-width: 820px) {
            body {
                padding: 10px;
            }

            .sheet {
                padding: 8px;
            }

            .field {
                padding: 24px 20px;
            }

            .name {
                font-size: 44px;
            }

            .stamp {
                grid-template-columns: 80px 1fr;
                grid-template-areas:
                    "title title"
                    "k1 v1"
                    "k2 v2"
                    "k3 v3"
                    "org sheet";
                justify-self: stretch;
                border-left: 0;
            }
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">

        <main class="field">
            <p class="lab">Лабораторна робота № 1</p>
            <h1>Підготування платформи для розгортання web-додатку</h1>

            <p class="name"><?= htmlspecialchars($student) ?></p>
            <p class="group">студент групи <b><?= htmlspecialchars($group) ?></b></p>

            <!-- Схема оточення з docker-compose.yml: порт і примонтований каталог -->
            <svg class="scheme" viewBox="0 0 860 150" role="img"
                 aria-label="Браузер звертається до контейнера php_web через порт 8080, каталог www примонтовано в /var/www/html">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                        <path d="M0 1 L10 5 L0 9 Z" fill="var(--accent-line)"/>
                    </marker>
                </defs>
                <g fill="none" stroke="var(--line)" stroke-width="2">
                    <rect x="1" y="44" width="170" height="74"/>
                    <rect x="318" y="30" width="238" height="102"/>
                    <rect x="703" y="44" width="156" height="74"/>
                </g>
                <g stroke="var(--accent-line)" stroke-width="1.6">
                    <line x1="171" y1="81" x2="316" y2="81" marker-end="url(#arrow)"/>
                    <line x1="703" y1="81" x2="558" y2="81" marker-end="url(#arrow)"/>
                    <line x1="171" y1="70" x2="171" y2="92"/>
                    <line x1="703" y1="70" x2="703" y2="92"/>
                </g>
                <text x="18" y="76">Браузер</text>
                <text class="small" x="18" y="100">localhost:8080</text>
                <text x="336" y="62">Контейнер php_web</text>
                <text class="small" x="336" y="88">образ php:8.2-apache</text>
                <text class="small" x="336" y="112">Apache слухає порт 80</text>
                <text x="720" y="76">Каталог www</text>
                <text class="small" x="720" y="100">index.php</text>
                <text class="dim" x="196" y="68">порт 8080 → 80</text>
                <text class="dim" x="572" y="68">/var/www/html</text>
            </svg>
        </main>

        <footer class="stamp">
            <p class="key">Розробив</p>
            <p><?= htmlspecialchars($author) ?></p>
            <p class="key">Група</p>
            <p class="mono"><?= htmlspecialchars($group) ?></p>
            <p class="key">PHP</p>
            <p class="mono"><?= PHP_VERSION ?></p>
            <p class="title">Лабораторна<br>робота № 1</p>
            <p class="org">УДУНТ, кафедра ЕОМ</p>
            <p class="sheet-no">Аркуш 1</p>
        </footer>

    </div>
</div>
</body>
</html>
