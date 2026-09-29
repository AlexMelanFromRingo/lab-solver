-- Лабораторна робота № 3. Таблиця довідника «Завдання (TODO)».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE todo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO todo (title, description, status, priority, deadline) VALUES
('Підготувати звіт з ЛР3', 'Скріншоти phpMyAdmin і сторінки додатку', 'В роботі', 'Високий', '2026-10-06'),
('Прочитати про PDO', 'Порівняти з mysqli', 'Нове', 'Середній', '2026-10-13'),
('Встановити Docker', 'Docker Engine і Compose в Ubuntu', 'Виконано', 'Високий', '2026-09-22');
