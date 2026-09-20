-- Запит створення таблиці довідника «Розклад занять».
-- Складено функцією create_table_sql() з lib/db.php за описом схеми.
-- Той самий запит виконується автоматично під час першого відкриття
-- сторінки; тут він наведений, щоб його можна було виконати вручну
-- у вкладці SQL phpMyAdmin.

CREATE TABLE IF NOT EXISTS `timetable` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `weekday` VARCHAR(16) NOT NULL,
  `starts_at` TIME NOT NULL,
  `week` VARCHAR(16) NOT NULL,
  `room` VARCHAR(24) NOT NULL,
  `subject` VARCHAR(160) NOT NULL,
  `teacher` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
