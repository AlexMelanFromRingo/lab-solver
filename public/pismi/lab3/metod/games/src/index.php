<?php
// Лабораторна робота № 3. Довідник «Каталог ігор» (таблиця games).

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
    $studio = $_POST['studio'];
    $platform = $_POST['platform'];
    $release_year = $_POST['release_year'];
    $hours = $_POST['hours'];

    if ($title && $studio && in_array($platform, ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch']) && is_numeric($release_year) && is_numeric($hours)) {
        $stmt = $mysqli->prepare("INSERT INTO `games`(`title`, `studio`, `platform`, `release_year`, `hours`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssii", $title, $studio, $platform, $release_year, $hours);

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
        $stmt = $mysqli->prepare("DELETE FROM `games` WHERE id = ?");
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
$sql = "SELECT `id`, `title`, `studio`, `platform`, `release_year`, `hours` FROM `games` ORDER BY `id` DESC";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Каталог ігор</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Каталог ігор</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Назва</th><th>Студія</th><th>Платформа</th><th>Рік</th><th>Годин у грі</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['title']) . "</td>";
            echo "<td>" . htmlspecialchars($row['studio']) . "</td>";
            echo "<td>" . htmlspecialchars($row['platform']) . "</td>";
            echo "<td>" . $row['release_year'] . "</td>";
            echo "<td>" . $row['hours'] . "</td>";
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
        <h2>Додати гру</h2>
        <form method="post">
        <input type="text" name="title" placeholder="Назва" required>
        <input type="text" name="studio" placeholder="Студія" required>
        <select name="platform" required><option value="">Платформа</option><option>PC</option><option>PlayStation</option><option>Xbox</option><option>Nintendo Switch</option></select>
        <input type="number" name="release_year" placeholder="Рік" required>
        <input type="number" name="hours" placeholder="Годин у грі" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
