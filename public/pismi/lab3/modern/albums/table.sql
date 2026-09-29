-- Лабораторна робота № 3. Таблиця довідника «Дискографія».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    album VARCHAR(150) NOT NULL,
    artist VARCHAR(120) NOT NULL,
    release_year SMALLINT NOT NULL,
    tracks TINYINT UNSIGNED NOT NULL,
    minutes SMALLINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO albums (album, artist, release_year, tracks, minutes) VALUES
('Модель', 'Океан Ельзи', 2001, 12, 50),
('Янанебібув', 'Бумбокс', 2017, 11, 42),
('Соняшники', 'ДахаБраха', 2020, 9, 44);
