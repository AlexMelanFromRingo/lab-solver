-- Лабораторна робота № 3. Таблиця довідника «Журнал відвідувань».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor VARCHAR(120) NOT NULL,
    visit_date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO visits (visitor, visit_date, time_in, time_out, reason) VALUES
('Бондаренко Петро Сергійович', '2026-09-21', '08:15', '12:40', 'лабораторні роботи'),
('Коваль Марія Іванівна', '2026-09-21', '10:00', '11:30', 'консультація'),
('Литвиненко Ірина Олегівна', '2026-09-22', '13:20', '16:05', 'робота в бібліотеці');
