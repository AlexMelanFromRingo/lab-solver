<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 1.
 *
 * Обчислює два вирази індивідуального завдання й перевіряє, що при заданих
 * значеннях вони збігаються. Самі обчислення – у lib/formulas.php, сторінка
 * лише показує результат.
 */

require __DIR__ . '/_shared/chrome.php';
require __DIR__ . '/lib/formulas.php';

$t = GIVEN_T;

$first = y1($t);
$second = y2($t);
$matched = values_match($first, $second);
$difference = abs($first - $second);

ust_head('ЛР2 · програма № 1 · варіант 11', ust_accent(11)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 1 · варіант <b>11</b></span>
    </header>

    <h1 class="title">Заміна змінної під коренем</h1>
    <p class="subtitle">
        Обчислити два вирази й переконатися, що при заданих значеннях аргументів
        вони дають однаковий результат.
    </p>

    <div class="given">
        y₁ = t·(1 + 2/√(t+4)) / (2 − √(t+4)) + √(t+4) + 4/√(t+4) + t<br>
        y₂ = t − 4
        <span class="given__arg">де t = <?= h(fmt($t)) ?> — значення з умови варіанта</span>
    </div>

    <div class="split">
        <section class="prose">
            <h2 class="head">Чому вирази рівні</h2>
            <div class="identity">
                при u = √(t + 4):   t = u² − 4 = (u − 2)(u + 2)
            </div>
            <p>
                Заміна u = √(t + 4) робить перший доданок раціональним: t розкладається на
                (u − 2)(u + 2), множник (u − 2) скорочується зі знаменником (2 − u) і дає
                знак мінус. Журнал підтверджує, що доданок дорівнює −(u + 2)²/u, тобто −u
                − 4 − 4/u. Доданки з u і 4/u його гасять, лишається t − 4.
            </p>
            <p>
                Обидва вирази обчислюються прямо за умовою, без спрощень: сенс завдання
                саме в тому, щоб зійшлися два різні шляхи обчислення.
            </p>
        </section>

        <section class="result">
            <h2 class="head">Результат</h2>
            <div>
                <div class="value__label">y₁</div>
                <div class="value__num"><?= h(fmt($first)) ?></div>
            </div>
            <div>
                <div class="value__label">y₂</div>
                <div class="value__num"><?= h(fmt($second)) ?></div>
            </div>
            <p class="verdict <?= $matched ? 'ok' : 'err' ?>">
                <?php if ($matched) : ?>
                    Значення збіглися. Розбіжність <?= h(sprintf('%.2e', $difference)) ?>
                    не перевищує похибки подвійної точності.
                <?php else : ?>
                    Значення розійшлися на <?= h(sprintf('%.2e', $difference)) ?> —
                    це більше за допустиму похибку обчислень.
                <?php endif; ?>
            </p>
        </section>
    </div>

    <section class="ledger">
        <h2 class="head">Відомість обчислення</h2>
<?php foreach (trace_values($t) as $line) : ?>
        <div class="ledger__row">
            <span class="ledger__name"><?= h($line['label']) ?></span>
            <span class="ledger__dots"></span>
            <span class="ledger__value"><?= h($line['value']) ?></span>
        </div>
<?php endforeach; ?>
    </section>

    <p class="foot hint">
        <a href="index.php">До переліку програм</a> · <a href="prog2.php">Програма № 2</a>
    </p>

</div>
</body>
</html>
