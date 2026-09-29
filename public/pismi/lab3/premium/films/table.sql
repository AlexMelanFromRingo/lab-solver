-- Лабораторна робота № 3. Таблиця довідника «Список фільмів».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE films (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    director VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    release_year SMALLINT NOT NULL,
    rating DECIMAL(3, 1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO films (title, director, genre, release_year, rating) VALUES
('Тіні забутих предків', 'Сергій Параджанов', 'драма', 1965, 8.1),
('Земля', 'Олександр Довженко', 'драма', 1930, 7.5),
('Мої думки тихі', 'Антоніо Лукіч', 'комедія', 2019, 7.4),
('Памфір', 'Дмитро Сухолиткий-Собчук', 'драма', 2022, 7.3);
