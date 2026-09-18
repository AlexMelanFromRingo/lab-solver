<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2: вхідна сторінка з переліком програм.
 */

require __DIR__ . '/_shared/chrome.php';
require __DIR__ . '/lib/formulas.php';

ust_head('ЛР2 · варіант 9', ust_accent(9)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Український державний університет науки і технологій · кафедра ЕОМ</span>
        <span>Лабораторна робота № 2 · варіант <b>9</b></span>
        <span>PHP. Сценарії, функції, об’єкти</span>
    </header>

    <h1 class="title">PHP. Сценарії, функції, об’єкти</h1>
    <p class="subtitle">
        Дві програми за індивідуальним завданням: обчислювальна та побудована
        навколо власного об’єкта.
    </p>

    <div class="programs">
        <section class="program">
            <div class="program__num">01</div>
            <div>
                <h2>Перехід між основами логарифмів</h2>
                <p>
                    Обчислює два вирази й перевіряє, що при заданих значеннях вони
                    дають однаковий результат. Рівність не випадкова — за нею стоїть
                    тотожне перетворення, і відомість обчислення показує його в числах.
                </p>
                <a href="prog1.php">Обчислити й перевірити рівність</a>
            </div>
        </section>

        <section class="program">
            <div class="program__num">02</div>
            <div>
                <h2>Текстова піраміда</h2>
                <p>
                    Завдання виконує об’єкт класу <code>TextPyramidTask</code>; параметри
                    читаються з рядка браузера.
                </p>
                <a href="prog2.php">Виконати завдання</a>
            </div>
        </section>
    </div>

</div>
</body>
</html>
