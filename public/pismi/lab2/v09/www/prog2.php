<?php

declare(strict_types=1);

/**
 * Лабораторна робота № 2, програма № 2.
 *
 * Завдання виконує об'єкт: сторінка створює його, питає перелік параметрів,
 * збирає значення з рядка браузера й просить намалювати відповідь.
 */

require __DIR__ . '/_shared/chrome.php';
require __DIR__ . '/lib/Task.php';
require __DIR__ . '/lib/TextPyramidTask.php';

$task = new TextPyramidTask();

$values = [];
foreach ($task->params() as $name => $meta) {
    $given = $_GET[$name] ?? null;
    $values[$name] = is_string($given) && $given !== '' ? $given : $meta['default'];
}

ust_head('ЛР2 · програма № 2 · варіант 9', ust_accent(9)['hex']);
?>
<body>
<div class="sheet">

    <header class="masthead">
        <span>Лабораторна робота № 2 · PHP. Сценарії, функції, об’єкти</span>
        <span>Програма № 2 · варіант <b>9</b></span>
    </header>

    <h1 class="title"><?= h($task->title()) ?></h1>

    <?= $task->render($values) ?>

    <div class="split">
        <section class="prose">
            <h2 class="head">Як це влаштовано</h2>
            <p><?= h($task->conclusion()) ?></p>
            <p>
                Методичні вказівки вимагають, щоб завдання виконував створений об’єкт,
                тому вся робота зібрана в одному класі: він приймає параметри, приводить
                їх до допустимих меж і будує розмітку відповіді.
            </p>
        </section>

        <section>
            <h2 class="head">Параметри</h2>
            <form class="form" method="get" action="prog2.php">
<?php foreach ($task->params() as $name => $meta) : ?>
                <div class="field">
                    <label for="<?= h($name) ?>"><?= h($meta['label']) ?></label>
                    <input type="text" id="<?= h($name) ?>" name="<?= h($name) ?>"
                           value="<?= h($values[$name]) ?>">
                </div>
<?php endforeach; ?>
                <button type="submit">Перерахувати</button>
            </form>
        </section>
    </div>

    <p class="foot hint">
        <a href="index.php">До переліку програм</a> · <a href="prog1.php">Програма № 1</a>
    </p>

</div>
</body>
</html>
