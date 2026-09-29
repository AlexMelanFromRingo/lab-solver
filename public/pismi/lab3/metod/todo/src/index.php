<?php
// Лабораторна робота № 3. Довідник «Завдання (TODO)» (таблиця todo).

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
    $title = $_POST['title'];
    $description = $_POST['description'];
    $status = $_POST['status'];
    $priority = $_POST['priority'];
    $deadline = $_POST['deadline'];

    if ($title && $description && in_array($status, ['Нове', 'В роботі', 'Виконано']) && in_array($priority, ['Низький', 'Середній', 'Високий']) && $deadline) {
        $stmt = $mysqli->prepare("INSERT INTO `todo`(`title`, `description`, `status`, `priority`, `deadline`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $title, $description, $status, $priority, $deadline);

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
        $stmt = $mysqli->prepare("DELETE FROM `todo` WHERE id = ?");
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
$sql = "SELECT `id`, `title`, `description`, `status`, `priority`, `deadline` FROM `todo` ORDER BY `deadline`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Завдання (TODO)</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Завдання (TODO)</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Назва</th><th>Опис</th><th>Статус</th><th>Пріоритет</th><th>Дедлайн</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['title']) . "</td>";
            echo "<td>" . htmlspecialchars($row['description']) . "</td>";
            echo "<td>" . htmlspecialchars($row['status']) . "</td>";
            echo "<td>" . htmlspecialchars($row['priority']) . "</td>";
            echo "<td>" . $row['deadline'] . "</td>";
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
        <h2>Додати завдання</h2>
        <form method="post">
        <input type="text" name="title" placeholder="Назва" required>
        <input type="text" name="description" placeholder="Опис" required>
        <select name="status" required><option value="">Статус</option><option>Нове</option><option>В роботі</option><option>Виконано</option></select>
        <select name="priority" required><option value="">Пріоритет</option><option>Низький</option><option>Середній</option><option>Високий</option></select>
        <input type="date" name="deadline" placeholder="Дедлайн" title="Дедлайн" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
