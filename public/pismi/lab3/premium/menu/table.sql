-- Лабораторна робота № 3. Таблиця довідника «Меню ресторану».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish VARCHAR(120) NOT NULL,
    category VARCHAR(30) NOT NULL,
    price DECIMAL(8, 2) NOT NULL,
    ingredients VARCHAR(255) NOT NULL,
    calories SMALLINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO menu (dish, category, price, ingredients, calories) VALUES
('Борщ український', 'Перші страви', 145.00, 'буряк, капуста, картопля, яловичина, сметана', 320),
('Деруни зі сметаною', 'Основні страви', 160.00, 'картопля, цибуля, яйце, сметана', 540),
('Вареники з вишнею', 'Десерти', 120.00, 'борошно, вишня, цукор', 410),
('Узвар', 'Напої', 45.00, 'сушені яблука, груші, мед', 90);
