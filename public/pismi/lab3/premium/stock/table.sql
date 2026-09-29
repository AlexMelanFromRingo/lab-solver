-- Лабораторна робота № 3. Таблиця довідника «Склад товарів».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(150) NOT NULL,
    sku VARCHAR(30) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO stock (product, sku, quantity, price, supplier) VALUES
('Кабель UTP cat.6, 305 м', 'UTP6-305', 24, 3450.00, 'ТОВ «Мережеві рішення»'),
('Комутатор на 24 порти', 'SW-24G', 6, 8990.00, 'ТОВ «Мережеві рішення»'),
('ДБЖ 1000 ВА', 'UPS-1000', 11, 6200.00, 'ТОВ «Енергія»');
