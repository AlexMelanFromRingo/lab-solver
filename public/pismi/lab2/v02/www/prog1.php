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

$a = GIVEN_A;
$b = GIVEN_B;
$x = GIVEN_X;

$first = y1($a, $b, $x);
$second = y2($a, $b, $x);
$matched = values_match($first, $second);
$difference = abs($first - $second);

ust_head('ЛР2 · програма № 1 · варіант 2', ust_accent(2)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 1 · варіант <b>2</b></span>
    </header>

    <h1 class="title">Згортання суми гармонік в одну</h1>
    <p class="subtitle">
        Обчислити два вирази й переконатися, що при заданих значеннях аргументів
        вони дають однаковий результат.
    </p>

    <div class="given">
        y₁ = a·cos x + b·sin x<br>
        y₂ = A·sin(x + μ),   A = √(a² + b²),   μ = arcsin(a / √(a² + b²))
        <span class="given__arg">де a = <?= h(fmt($a)) ?> · b = <?= h(fmt($b)) ?> · x = <?= h(fmt($x)) ?> — значення з умови варіанта</span>
    </div>

    <div class="split">
        <section class="prose">
            <h2 class="head">Чому вирази рівні</h2>
            <div class="identity">
                A·sin μ = a<br>
                A·cos μ = b
            </div>
            <p>
                Сума двох коливань однакової частоти – теж коливання тієї самої частоти, у
                якого амплітуда дорівнює A = √(a² + b²), а зсув фази μ. Журнал перевіряє
                це напряму: A·sin μ дає рівно a, а A·cos μ – рівно b, тож розкриття синуса
                суми повертає вихідний вираз.
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
<?php foreach (trace_values($a, $b, $x) as $line) : ?>
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
