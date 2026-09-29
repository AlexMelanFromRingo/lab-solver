-- Лабораторна робота № 3. Таблиця довідника «Каталог ігор».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    studio VARCHAR(120) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    release_year SMALLINT NOT NULL,
    hours SMALLINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO games (title, studio, platform, release_year, hours) VALUES
('S.T.A.L.K.E.R. 2', 'GSC Game World', 'PC', 2024, 78),
('Metro Exodus', '4A Games', 'PC', 2019, 31),
('Cossacks 3', 'GSC Game World', 'PC', 2016, 46);
