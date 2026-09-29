<?php
// Лабораторна робота № 3. Довідник «Дискографія» (таблиця albums).

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
    $album = $_POST['album'];
    $artist = $_POST['artist'];
    $release_year = $_POST['release_year'];
    $tracks = $_POST['tracks'];
    $minutes = $_POST['minutes'];

    if ($album && $artist && is_numeric($release_year) && is_numeric($tracks) && is_numeric($minutes)) {
        $stmt = $mysqli->prepare("INSERT INTO `albums`(`album`, `artist`, `release_year`, `tracks`, `minutes`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssiii", $album, $artist, $release_year, $tracks, $minutes);

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
        $stmt = $mysqli->prepare("DELETE FROM `albums` WHERE id = ?");
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
$sql = "SELECT `id`, `album`, `artist`, `release_year`, `tracks`, `minutes` FROM `albums` ORDER BY `release_year` DESC";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Дискографія</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Дискографія</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Альбом</th><th>Виконавець</th><th>Рік</th><th>Треків</th><th>Тривалість</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['album']) . "</td>";
            echo "<td>" . htmlspecialchars($row['artist']) . "</td>";
            echo "<td>" . $row['release_year'] . "</td>";
            echo "<td>" . $row['tracks'] . "</td>";
            echo "<td>" . $row['minutes'] . " хв" . "</td>";
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
        <h2>Додати альбом</h2>
        <form method="post">
        <input type="text" name="album" placeholder="Альбом" required>
        <input type="text" name="artist" placeholder="Виконавець" required>
        <input type="number" name="release_year" placeholder="Рік" required>
        <input type="number" name="tracks" placeholder="Треків" required>
        <input type="number" name="minutes" placeholder="Тривалість" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
