<?php
// Лабораторна робота № 3. Довідник «Спостереження за птахами» (таблиця birds).

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
    $species = $_POST['species'];
    $place = $_POST['place'];
    $seen_on = $_POST['seen_on'];
    $bird_count = $_POST['bird_count'];
    $weather = $_POST['weather'];

    if ($species && $place && $seen_on && is_numeric($bird_count) && $weather) {
        $stmt = $mysqli->prepare("INSERT INTO `birds`(`species`, `place`, `seen_on`, `bird_count`, `weather`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssis", $species, $place, $seen_on, $bird_count, $weather);

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
        $stmt = $mysqli->prepare("DELETE FROM `birds` WHERE id = ?");
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
$sql = "SELECT `id`, `species`, `place`, `seen_on`, `bird_count`, `weather` FROM `birds` ORDER BY `seen_on` DESC";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Спостереження за птахами</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Спостереження за птахами</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Вид</th><th>Місце</th><th>Дата</th><th>Особин</th><th>Погода</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['species']) . "</td>";
            echo "<td>" . htmlspecialchars($row['place']) . "</td>";
            echo "<td>" . $row['seen_on'] . "</td>";
            echo "<td>" . $row['bird_count'] . "</td>";
            echo "<td>" . htmlspecialchars($row['weather']) . "</td>";
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
        <h2>Додати спостереження</h2>
        <form method="post">
        <input type="text" name="species" placeholder="Вид" required>
        <input type="text" name="place" placeholder="Місце" required>
        <input type="date" name="seen_on" placeholder="Дата" title="Дата" required>
        <input type="number" name="bird_count" placeholder="Особин" required>
        <input type="text" name="weather" placeholder="Погода" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
