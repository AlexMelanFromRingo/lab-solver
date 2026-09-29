-- Лабораторна робота № 3. Таблиця довідника «Список автомобілів».
-- Виконати в phpMyAdmin (http://localhost:8081): база appdb, вкладка SQL.

CREATE TABLE cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    made_year SMALLINT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    color VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестові дані (необов’язково)
INSERT INTO cars (brand, model, made_year, price, color) VALUES
('Toyota', 'Corolla', 2019, 620000.00, 'сірий'),
('Škoda', 'Octavia', 2021, 780000.00, 'білий'),
('Renault', 'Duster', 2018, 480000.00, 'синій');
