-- Лабораторна робота № 3. Таблиця довідника «Контакти».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120) NOT NULL,
    company VARCHAR(120) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO contacts (full_name, phone, email, company, job_title) VALUES
('Іван Петренко', '+380 67 123 45 67', 'ivan.petrenko@example.com', 'ТОВ «Техносервіс»', 'інженер'),
('Марія Коваль', '+380 50 765 43 21', 'maria.koval@example.com', 'Нова пошта', 'аналітик'),
('Олег Сидоренко', '+380 63 555 12 34', 'oleh.sydorenko@example.com', 'Інтерпайп', 'адміністратор мереж');
