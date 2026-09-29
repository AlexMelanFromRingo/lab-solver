-- Лабораторна робота № 3. Таблиця довідника «Відомість з оцінками».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student VARCHAR(120) NOT NULL,
    study_group VARCHAR(20) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    grade TINYINT UNSIGNED NOT NULL,
    exam_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO grades (student, study_group, subject, grade, exam_date) VALUES
('Коваленко Марія Іванівна', 'КІ-22', 'Бази даних', 92, '2026-06-12'),
('Шевчук Андрій Петрович', 'КІ-22', 'Бази даних', 78, '2026-06-12'),
('Мельник Олег Сергійович', 'КІ-22', 'Web-програмування', 85, '2026-06-16'),
('Ткаченко Ірина Олегівна', 'КІ-22', 'Web-програмування', 96, '2026-06-16');
