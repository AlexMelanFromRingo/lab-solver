-- Лабораторна робота № 3. Таблиця довідника «Книга рецептів».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish VARCHAR(120) NOT NULL,
    cuisine VARCHAR(60) NOT NULL,
    ingredients VARCHAR(255) NOT NULL,
    minutes SMALLINT UNSIGNED NOT NULL,
    servings TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO recipes (dish, cuisine, ingredients, minutes, servings) VALUES
('Вареники з вишнею', 'українська', 'борошно, вишня, цукор, сметана', 90, 6),
('Крученики', 'українська', 'свинина, гриби, цибуля, сметана', 75, 4),
('Сирники', 'українська', 'сир, яйце, борошно, родзинки', 35, 3);
