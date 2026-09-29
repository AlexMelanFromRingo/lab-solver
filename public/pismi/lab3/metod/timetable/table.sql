-- Лабораторна робота № 3. Таблиця довідника «Розклад занять».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weekday VARCHAR(12) NOT NULL,
    lesson_time TIME NOT NULL,
    room VARCHAR(20) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO timetable (weekday, lesson_time, room, subject, teacher) VALUES
('Понеділок', '08:30', '301', 'Бази даних', 'Бондаренко І. П.'),
('Понеділок', '10:10', '215', 'Комп’ютерні мережі', 'Мельник С. В.'),
('Вівторок', '08:30', '112', 'Вища математика', 'Ткаченко Н. О.'),
('Середа', '11:50', '301', 'Web-програмування', 'Бондаренко І. П.'),
('Четвер', '10:10', '207', 'Операційні системи', 'Кравчук Д. М.'),
('П’ятниця', '08:30', '118', 'Англійська мова', 'Савченко О. Л.');
