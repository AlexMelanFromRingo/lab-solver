<?php

/**
 * Лабораторна робота № 2. PHP. Сценарії, функції, об’єкти.
 * Вхідна сторінка: перелік аркушів, як на титулі креслення.
 */
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Лабораторна робота № 2</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">
    <style>
        :root {
            --desk: #d6dde3;
            --paper: #ffffff;
            --line: #1b2630;
            --thin: #8a98a4;
            --hair: #c5ced6;
            --grid: rgba(27, 38, 48, 0.05);
            --text: #1b2630;
            --muted: #56646f;
            --good: #1f7a4d;
            --bad: #b3261e;
            --accent: %%ACCENT%%;
            --accent-soft: %%ACCENT_SOFT%%;
            --accent-ink: %%ACCENT_INK%%;
            --accent-line: color-mix(in srgb, var(--accent) 82%, #000000);
            --font: "PT Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif;
            --mono: "PT Mono", ui-monospace, "Cascadia Mono", monospace;
            --math: "Noto Sans Math", "Cambria Math", "Latin Modern Math", math;
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

        a {
            color: var(--accent-line);
            text-underline-offset: 3px;
        }

        :focus-visible {
            outline: 2px solid var(--accent-line);
            outline-offset: 2px;
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
            padding: 26px 36px 28px;
        }

        .lab {
            margin: 0;
            color: var(--muted);
            font-size: 19px;
        }

        h1 {
            margin: 0 0 22px;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
        }

        h2 {
            margin: 0 0 10px;
            font-size: 21px;
            font-weight: 700;
        }

        .num {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
        }

        math {
            font-family: var(--math);
        }

        /* Таблиця як специфікація: товсті лінії шапки, тонкі між рядками */
        table.spec {
            border-collapse: collapse;
            font-size: 17px;
        }

        table.spec th,
        table.spec td {
            padding: 5px 12px;
            border: 1px solid var(--line);
            text-align: left;
        }

        table.spec thead th {
            border-bottom-width: 2px;
            font-weight: 700;
        }

        table.spec td.num {
            text-align: right;
        }

        /* Основний напис, як на кресленні: правий нижній кут */
        .stamp {
            display: grid;
            grid-template-columns: 96px 150px 250px;
            grid-template-areas:
                "k1 v1 title"
                "k2 v2 title"
                "k3 v3 title"
                "org org sheet";
            justify-self: end;
            border-top: 2px solid var(--line);
            border-left: 2px solid var(--line);
            background: var(--paper);
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
            font-size: 19px;
            font-weight: 700;
            line-height: 1.25;
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
                padding: 20px 16px;
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

        .sheets-list {
            width: 100%;
            max-width: 760px;
        }

        .sheets-list td:first-child {
            width: 90px;
            font-family: var(--mono);
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">

        <main class="field">
            <p class="lab">Лабораторна робота № 2</p>
            <h1>PHP. Сценарії, функції, об’єкти</h1>
            <table class="spec sheets-list">
                <thead>
                    <tr><th>Аркуш</th><th>Зміст</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td><a href="program1.php">Програма № 1</a>: обчислення функцій y₁ та y₂</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td><a href="program2.php">Програма № 2</a>: завдання виконує об’єкт, параметри з рядка браузера</td>
                    </tr>
                </tbody>
            </table>
        </main>

        <footer class="stamp">
            <p class="key">Розробив</p>
            <p>%%PIB_SHORT%%</p>
            <p class="key">Група</p>
            <p class="mono">%%GROUP%%</p>
            <p class="key">PHP</p>
            <p><?= PHP_VERSION ?></p>
            <p class="title">Лабораторна<br>робота № 2</p>
            <p class="org">УДУНТ, кафедра ЕОМ</p>
            <p class="sheet-no">Аркушів 2</p>
        </footer>

    </div>
</div>
</body>
</html>
