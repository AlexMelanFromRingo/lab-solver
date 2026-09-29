<?php
// Лабораторна робота № 3. Довідник «Список автомобілів» (таблиця cars).

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
    $brand = $_POST['brand'];
    $model = $_POST['model'];
    $made_year = $_POST['made_year'];
    $price = $_POST['price'];
    $color = $_POST['color'];

    if ($brand && $model && is_numeric($made_year) && is_numeric($price) && $color) {
        $stmt = $mysqli->prepare("INSERT INTO `cars`(`brand`, `model`, `made_year`, `price`, `color`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssids", $brand, $model, $made_year, $price, $color);

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
        $stmt = $mysqli->prepare("DELETE FROM `cars` WHERE id = ?");
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
$sql = "SELECT `id`, `brand`, `model`, `made_year`, `price`, `color` FROM `cars` ORDER BY `id` DESC";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Список автомобілів</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Список автомобілів</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Марка</th><th>Модель</th><th>Рік випуску</th><th>Ціна</th><th>Колір</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['brand']) . "</td>";
            echo "<td>" . htmlspecialchars($row['model']) . "</td>";
            echo "<td>" . $row['made_year'] . "</td>";
            echo "<td>" . number_format($row['price'], 2) . " грн" . "</td>";
            echo "<td>" . htmlspecialchars($row['color']) . "</td>";
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
        <h2>Додати автомобіль</h2>
        <form method="post">
        <input type="text" name="brand" placeholder="Марка" required>
        <input type="text" name="model" placeholder="Модель" required>
        <input type="number" name="made_year" placeholder="Рік випуску" required>
        <input type="number" name="price" placeholder="Ціна" step="0.01" required>
        <input type="text" name="color" placeholder="Колір" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
