<?php
// Лабораторна робота № 3. Довідник «Контакти» (таблиця contacts).

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
    $full_name = $_POST['full_name'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $company = $_POST['company'];
    $job_title = $_POST['job_title'];

    if ($full_name && $phone && $email && $company && $job_title) {
        $stmt = $mysqli->prepare("INSERT INTO `contacts`(`full_name`, `phone`, `email`, `company`, `job_title`) VALUES(?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $full_name, $phone, $email, $company, $job_title);

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
        $stmt = $mysqli->prepare("DELETE FROM `contacts` WHERE id = ?");
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
$sql = "SELECT `id`, `full_name`, `phone`, `email`, `company`, `job_title` FROM `contacts` ORDER BY `full_name`";
$stmt = $mysqli->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Контакти</title>
    <style>
        table { border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #999; padding: 4px 8px; }
    </style>
</head>
<body>
    <h1>Контакти</h1>

    <?php
    echo $message;

    if ($result && $result->num_rows > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Ім’я</th><th>Телефон</th><th>Email</th><th>Компанія</th><th>Посада</th><th>Дії</th></tr>";

        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['full_name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['phone']) . "</td>";
            echo "<td>" . htmlspecialchars($row['email']) . "</td>";
            echo "<td>" . htmlspecialchars($row['company']) . "</td>";
            echo "<td>" . htmlspecialchars($row['job_title']) . "</td>";
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
        <h2>Додати контакт</h2>
        <form method="post">
        <input type="text" name="full_name" placeholder="Ім’я" required>
        <input type="tel" name="phone" placeholder="Телефон" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="text" name="company" placeholder="Компанія" required>
        <input type="text" name="job_title" placeholder="Посада" required>
        <button type="submit" name="add">Додати</button>
        </form>
    </div>
</body>
</html>
