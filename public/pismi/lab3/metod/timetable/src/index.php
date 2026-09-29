<?php
// Лабораторна робота № 3. Довідник «Розклад занять» (таблиця timetable).

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
    $weekday = $_POST['weekday'];
    $lesson_time = $_POST['lesson_time'];
    $room = $_POST['room'];
    $subject = $_POST['subject'];
    $teacher = $_POST['teacher'];

    if (in_array($weekday, ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота']) && $lesson_time && $room && $subject && $teacher) {
        $stmt = $mysqli->prepare("INSERT INTO `timetable`(`weekday`, `lesson_time`, `room`, `subject`, `teacher`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $weekday, $lesson_time, $room, $subject, $teacher);

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
        $stmt = $mysqli->prepare("DELETE FROM `timetable` WHERE id = ?");
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
$sql = "SELECT `id`, `weekday`, `lesson_time`, `room`, `subject`, `teacher` FROM `timetable` ORDER BY FIELD(`weekday`, 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'), `lesson_time`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Розклад занять</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Розклад занять</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>День тижня</th><th>Час</th><th>Аудиторія</th><th>Дисципліна</th><th>Викладач</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['weekday']) . "</td>";
            echo "<td>" . substr($row['lesson_time'], 0, 5) . "</td>";
            echo "<td>" . htmlspecialchars($row['room']) . "</td>";
            echo "<td>" . htmlspecialchars($row['subject']) . "</td>";
            echo "<td>" . htmlspecialchars($row['teacher']) . "</td>";
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
        <h2>Додати заняття</h2>
        <form method="post">
        <select name="weekday" required><option value="">День тижня</option><option>Понеділок</option><option>Вівторок</option><option>Середа</option><option>Четвер</option><option>П’ятниця</option><option>Субота</option></select>
        <input type="time" name="lesson_time" placeholder="Час" title="Час" required>
        <input type="text" name="room" placeholder="Аудиторія" required>
        <input type="text" name="subject" placeholder="Дисципліна" required>
        <input type="text" name="teacher" placeholder="Викладач" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
