<?php
// Лабораторна робота № 3. Довідник «Меню ресторану» (таблиця menu).

// Контейнер MySQL запускається довше, ніж PHP, тому одразу після
// docker compose up підключення повторюється кілька разів з паузою.
$mysqli = null;
for ($i = 0; $i < 10 && $mysqli === null; $i++) {
    try {
        $mysqli = new mysqli('db', 'appuser', 'apppass', 'appdb');
    } catch (mysqli_sql_exception $e) {
        sleep(1);
    }
}

// Перевірка підключення
if ($mysqli === null) {
    die("<p>База даних ще запускається. Оновіть сторінку за кілька секунд.</p>");
}

// Встановлення кодування
$mysqli->set_charset("utf8mb4");

$message = "";

// Обробка додавання запису
if (isset($_POST['add'])) {
    $dish = $_POST['dish'];
    $category = $_POST['category'];
    $price = $_POST['price'];
    $ingredients = $_POST['ingredients'];
    $calories = $_POST['calories'];

    if ($dish && in_array($category, ['Закуски', 'Перші страви', 'Основні страви', 'Десерти', 'Напої']) && is_numeric($price) && $ingredients && is_numeric($calories)) {
        $stmt = $mysqli->prepare("INSERT INTO `menu`(`dish`, `category`, `price`, `ingredients`, `calories`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssdsi", $dish, $category, $price, $ingredients, $calories);

        if ($stmt->execute()) {
            $message = "<p style='color: green;'>Запис успішно додано!</p>";
        } else {
            $message = "<p style='color: red;'>Помилка додавання: " . $stmt->error . "</p>";
        }
        $stmt->close();
    } else {
        $message = '<p style="color: red;">Не всі поля заповнені коректно!</p>';
    }
}

// Обробка видалення запису
if (isset($_POST['delete'])) {
    $id = (int)$_POST['id'];

    if (is_numeric($id)) {
        $stmt = $mysqli->prepare("DELETE FROM `menu` WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            $message = "<p style='color: green;'>Запис успішно видалено!</p>";
        } else {
            $message = "<p style='color: red;'>Помилка видалення: " . $stmt->error . "</p>";
        }
        $stmt->close();
    }
}

// Отримання всіх записів
$sql = "SELECT `id`, `dish`, `category`, `price`, `ingredients`, `calories` FROM `menu` ORDER BY FIELD(`category`, 'Закуски', 'Перші страви', 'Основні страви', 'Десерти', 'Напої'), `dish`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Меню ресторану</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Меню ресторану</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Назва страви</th><th>Категорія</th><th>Ціна</th><th>Склад</th><th>Калорійність</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['dish']) . "</td>";
            echo "<td>" . htmlspecialchars($row['category']) . "</td>";
            echo "<td>" . number_format($row['price'], 2) . " грн" . "</td>";
            echo "<td>" . htmlspecialchars($row['ingredients']) . "</td>";
            echo "<td>" . $row['calories'] . " ккал" . "</td>";
            echo "<td>
                <form method='post' style='display:inline;'>
                <input type='hidden' name='id' value='" . $row['id'] . "'>
                <button type='submit' name='delete' class='delete-btn' onclick='return confirm(\"Ви впевнені?\")'>Видалити</button>
                </form>
            </td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='text-align: center;'>Немає даних у базі.</p>";
    }

    $result->free();
    $mysqli->close();
    ?>

    <div class="form-container">
        <h2>Додати страву</h2>
        <form method="post">
        <input type="text" name="dish" placeholder="Назва страви" required>
        <select name="category" required><option value="">Категорія</option><option>Закуски</option><option>Перші страви</option><option>Основні страви</option><option>Десерти</option><option>Напої</option></select>
        <input type="number" name="price" placeholder="Ціна" step="0.01" required>
        <input type="text" name="ingredients" placeholder="Склад" required>
        <input type="number" name="calories" placeholder="Калорійність" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
