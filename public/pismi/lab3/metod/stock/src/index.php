<?php
// Лабораторна робота № 3. Довідник «Склад товарів» (таблиця stock).

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
    $product = $_POST['product'];
    $sku = $_POST['sku'];
    $quantity = $_POST['quantity'];
    $price = $_POST['price'];
    $supplier = $_POST['supplier'];

    if ($product && $sku && is_numeric($quantity) && is_numeric($price) && $supplier) {
        $stmt = $mysqli->prepare("INSERT INTO `stock`(`product`, `sku`, `quantity`, `price`, `supplier`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssids", $product, $sku, $quantity, $price, $supplier);

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
        $stmt = $mysqli->prepare("DELETE FROM `stock` WHERE id = ?");
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
$sql = "SELECT `id`, `product`, `sku`, `quantity`, `price`, `supplier` FROM `stock` ORDER BY `product`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Склад товарів</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Склад товарів</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Назва товару</th><th>Артикул</th><th>Кількість</th><th>Ціна</th><th>Постачальник</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['product']) . "</td>";
            echo "<td>" . htmlspecialchars($row['sku']) . "</td>";
            echo "<td>" . $row['quantity'] . " шт." . "</td>";
            echo "<td>" . number_format($row['price'], 2) . " грн" . "</td>";
            echo "<td>" . htmlspecialchars($row['supplier']) . "</td>";
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
        <h2>Додати товар</h2>
        <form method="post">
        <input type="text" name="product" placeholder="Назва товару" required>
        <input type="text" name="sku" placeholder="Артикул" required>
        <input type="number" name="quantity" placeholder="Кількість" required>
        <input type="number" name="price" placeholder="Ціна" step="0.01" required>
        <input type="text" name="supplier" placeholder="Постачальник" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
