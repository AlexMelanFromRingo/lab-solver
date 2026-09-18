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

$first = y1($alpha);
$second = y2($alpha);
$matched = values_match($first, $second);
$difference = abs($first - $second);

ust_head('ЛР2 · програма № 1 · варіант 12', ust_accent(12)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 1 · варіант <b>12</b></span>
    </header>

    <h1 class="title">Тангенс половинного кута під коренем</h1>
    <p class="subtitle">
        Обчислити два вирази й переконатися, що при заданих значеннях аргументів
        вони дають однаковий результат.
    </p>

    <div class="given">
        y₁ = √((1 − cos α)/(1 + cos α)) − √((1 + cos α)/(1 − cos α))<br>
        y₂ = 2 / tg α
        <span class="given__arg">де alpha = <?= h(fmt($alpha)) ?> — значення з умови варіанта</span>
    </div>

    <div class="split">
        <section class="prose">
            <h2 class="head">Чому вирази рівні</h2>
            <div class="identity">
                √((1 − cos α)/(1 + cos α)) = |tg(α/2)|<br>
                ctg(α/2) − tg(α/2) = 2·ctg α
            </div>
            <p>
                Корені дорівнюють модулям тангенса й котангенса половинного кута. При α =
                4,987 рад половинний кут лежить у другій чверті, тангенс там від’ємний,
                тому модулі змінюють знак виразу на протилежний – і різниця дає не −2·ctg
                α, а +2/tg α. Журнал показує обидві величини, тому знак видно явно, а не
                береться на віру.
            </p>
            <p>
                Обидва вирази обчислюються прямо за умовою, без спрощень: сенс завдання
                саме в тому, щоб зійшлися два різні шляхи обчислення.
            </p>
            <p class="hint" style="margin-top: 1rem;">
                Знак результату залежить від чверті, у яку потрапляє α/2. Для інших
                значень α той самий вираз дасть −2/tg α, тому переносити відповідь на
                довільне α не можна.
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
<?php foreach (trace_values($alpha) as $line) : ?>
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
