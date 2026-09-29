-- Лабораторна робота № 3. Таблиця довідника «Спостереження за птахами».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE birds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    species VARCHAR(120) NOT NULL,
    place VARCHAR(150) NOT NULL,
    seen_on DATE NOT NULL,
    bird_count INT UNSIGNED NOT NULL,
    weather VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO birds (species, place, seen_on, bird_count, weather) VALUES
('Лелека білий', 'Самарський ліс, Дніпро', '2026-08-14', 3, 'ясно, 27 °C'),
('Чапля сіра', 'Затока Дніпра, Обухівка', '2026-08-21', 5, 'хмарно, 22 °C'),
('Синиця велика', 'Парк Шевченка, Дніпро', '2026-09-02', 12, 'мряка, 17 °C');
