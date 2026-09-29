<?php
// Лабораторна робота № 3. Довідник «Відомість з оцінками» (таблиця grades).

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
    $student = $_POST['student'];
    $study_group = $_POST['study_group'];
    $subject = $_POST['subject'];
    $grade = $_POST['grade'];
    $exam_date = $_POST['exam_date'];

    if ($student && $study_group && $subject && is_numeric($grade) && $exam_date) {
        $stmt = $mysqli->prepare("INSERT INTO `grades`(`student`, `study_group`, `subject`, `grade`, `exam_date`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssis", $student, $study_group, $subject, $grade, $exam_date);

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
        $stmt = $mysqli->prepare("DELETE FROM `grades` WHERE id = ?");
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
$sql = "SELECT `id`, `student`, `study_group`, `subject`, `grade`, `exam_date` FROM `grades` ORDER BY `exam_date` DESC, `student`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Відомість з оцінками</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Відомість з оцінками</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>ПІБ студента</th><th>Група</th><th>Дисципліна</th><th>Оцінка</th><th>Дата</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['student']) . "</td>";
            echo "<td>" . htmlspecialchars($row['study_group']) . "</td>";
            echo "<td>" . htmlspecialchars($row['subject']) . "</td>";
            echo "<td>" . $row['grade'] . "</td>";
            echo "<td>" . $row['exam_date'] . "</td>";
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
        <h2>Додати оцінку</h2>
        <form method="post">
        <input type="text" name="student" placeholder="ПІБ студента" required>
        <input type="text" name="study_group" placeholder="Група" required>
        <input type="text" name="subject" placeholder="Дисципліна" required>
        <input type="number" name="grade" placeholder="Оцінка" required>
        <input type="date" name="exam_date" placeholder="Дата" title="Дата" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
