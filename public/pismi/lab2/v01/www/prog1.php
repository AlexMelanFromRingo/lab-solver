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

$x = GIVEN_X;

$first = y1($x);
$second = y2($x);
$matched = values_match($first, $second);
$difference = abs($first - $second);

ust_head('ЛР2 · програма № 1 · варіант 1', ust_accent(1)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 1 · варіант <b>1</b></span>
    </header>

    <h1 class="title">Зниження степеня через косинус подвійного кута</h1>
    <p class="subtitle">
        Обчислити два вирази й переконатися, що при заданих значеннях аргументів
        вони дають однаковий результат.
    </p>

    <div class="given">
        y₁ = sin⁴x + cos⁴x<br>
        y₂ = ((1 − cos 2x) / 2)² + ((1 + cos 2x) / 2)²
        <span class="given__arg">де x = <?= h(fmt($x)) ?> — значення з умови варіанта</span>
    </div>

    <div class="split">
        <section class="prose">
            <h2 class="head">Чому вирази рівні</h2>
            <div class="identity">
                sin²x = (1 − cos 2x) / 2<br>
                cos²x = (1 + cos 2x) / 2
            </div>
            <p>
                Другий вираз – це перший, у якому кожен квадрат синуса й косинуса замінено
                формулою зниження степеня. Журнал показує головне: sin²x і (1 − cos 2x)/2
                збігаються ще до піднесення до квадрата, тому рівність виконується не лише
                при заданому x, а при будь-якому.
            </p>
            <p>
                Обидва вирази обчислюються прямо за умовою, без спрощень: сенс завдання
                саме в тому, щоб зійшлися два різні шляхи обчислення.
            </p>
            <p class="hint" style="margin-top: 1rem;">
                У методичних вказівках обидва доданки y₂ надруковані однаково, з (1 − cos
                2x). Це помилка набору: другий доданок замінює cos²x, тому в ньому має
                стояти (1 + cos 2x). З надрукованим виразом рівність не виконується в
                жодній точці.
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
<?php foreach (trace_values($x) as $line) : ?>
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
