<?php
// Лабораторна робота № 3. Довідник «Журнал відвідувань» (таблиця visits).

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
    $visitor = $_POST['visitor'];
    $visit_date = $_POST['visit_date'];
    $time_in = $_POST['time_in'];
    $time_out = $_POST['time_out'];
    $reason = $_POST['reason'];

    if ($visitor && $visit_date && $time_in && $time_out && $reason) {
        $stmt = $mysqli->prepare("INSERT INTO `visits`(`visitor`, `visit_date`, `time_in`, `time_out`, `reason`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $visitor, $visit_date, $time_in, $time_out, $reason);

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
        $stmt = $mysqli->prepare("DELETE FROM `visits` WHERE id = ?");
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
$sql = "SELECT `id`, `visitor`, `visit_date`, `time_in`, `time_out`, `reason` FROM `visits` ORDER BY `visit_date` DESC, `time_in` DESC";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Журнал відвідувань</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Журнал відвідувань</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>ПІБ</th><th>Дата</th><th>Час входу</th><th>Час виходу</th><th>Причина</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['visitor']) . "</td>";
            echo "<td>" . $row['visit_date'] . "</td>";
            echo "<td>" . substr($row['time_in'], 0, 5) . "</td>";
            echo "<td>" . substr($row['time_out'], 0, 5) . "</td>";
            echo "<td>" . htmlspecialchars($row['reason']) . "</td>";
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
        <h2>Додати відвідування</h2>
        <form method="post">
        <input type="text" name="visitor" placeholder="ПІБ" required>
        <input type="date" name="visit_date" placeholder="Дата" title="Дата" required>
        <input type="time" name="time_in" placeholder="Час входу" title="Час входу" required>
        <input type="time" name="time_out" placeholder="Час виходу" title="Час виходу" required>
        <input type="text" name="reason" placeholder="Причина" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
