-- Лабораторна робота № 3. Таблиця довідника «Каталог книг».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(120) NOT NULL,
    pub_year SMALLINT NOT NULL,
    isbn VARCHAR(20) NOT NULL,
    pages SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO books (title, author, pub_year, isbn, pages) VALUES
('Тіні забутих предків', 'Михайло Коцюбинський', 1911, '978-966-03-1234-5', 128),
('Місто', 'Валер’ян Підмогильний', 1928, '978-966-03-4567-8', 320),
('Сад Гетсиманський', 'Іван Багряний', 1950, '978-966-501-234-1', 544),
('Інтернат', 'Сергій Жадан', 2017, '978-617-614-123-4', 336);
