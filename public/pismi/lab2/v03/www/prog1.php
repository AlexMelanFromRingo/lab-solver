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

$alpha = GIVEN_ALPHA;
$beta = GIVEN_BETA;

$first = y1($alpha, $beta);
$second = y2($alpha, $beta);
$matched = values_match($first, $second);
$difference = abs($first - $second);

ust_head('ЛР2 · програма № 1 · варіант 3', ust_accent(3)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 1 · варіант <b>3</b></span>
    </header>

    <h1 class="title">Формули суми та різниці синусів у знаменниках</h1>
    <p class="subtitle">
        Обчислити два вирази й переконатися, що при заданих значеннях аргументів
        вони дають однаковий результат.
    </p>

    <div class="given">
        y₁ = (1 − tg α · tg β) / (m − n)<br>
        y₂ = (1 + tg β / tg α) / (m + n),   m = 5·sin(2α + β),   n = 5·sin β
        <span class="given__arg">де alpha = <?= h(fmt($alpha)) ?> · beta = <?= h(fmt($beta)) ?> — значення з умови варіанта</span>
    </div>

    <div class="split">
        <section class="prose">
            <h2 class="head">Чому вирази рівні</h2>
            <div class="identity">
                m − n = 10·cos(α + β)·sin α<br>
                m + n = 10·sin(α + β)·cos α
            </div>
            <p>
                Обидва дроби після перетворень зводяться до одного й того самого виразу 1
                / (10·sin α·cos α·cos β). У чисельниках згортаються тангенси, у
                знаменниках – різниця та сума синусів; журнал показує, що обчислені m − n
                і m + n збігаються з добутковою формою до останнього знака.
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
<?php foreach (trace_values($alpha, $beta) as $line) : ?>
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
