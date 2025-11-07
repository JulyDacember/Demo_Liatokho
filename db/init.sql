
-- init.sql: create schema and seed data for super_shoes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop if needed (for dev only)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    discount DECIMAL(5,2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    image_path VARCHAR(500),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    pickup_address TEXT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    UNIQUE(order_id, product_id)
);

-- Seed
INSERT INTO roles (name) VALUES ('admin'),('manager'),('client'),('guest')
ON CONFLICT (name) DO NOTHING;

-- Password: admin123
INSERT INTO users (login, password_hash, full_name, role_id)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'Администратор Системы', (SELECT id FROM roles WHERE name='admin'))
ON CONFLICT (login) DO NOTHING;

INSERT INTO categories (name) VALUES ('Кроссовки'),('Туфли'),('Ботинки'),('Сапоги'),('Сандалии')
ON CONFLICT (name) DO NOTHING;

INSERT INTO manufacturers (name) VALUES ('Nike'),('Adidas'),('Reebok'),('ECCO'),('Geox')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name) VALUES ('Поставщик Обуви №1'),('Импортер Обуви'),('Обувной Склад')
ON CONFLICT (name) DO NOTHING;

-- A few products
INSERT INTO products (name, description, price, unit, stock_quantity, discount, category_id, manufacturer_id, supplier_id)
SELECT 'Пример Кроссовки', 'Легкие и удобные', 120.00, 'пара', 10, 20.00,
       (SELECT id FROM categories WHERE name='Кроссовки'),
       (SELECT id FROM manufacturers WHERE name='Nike'),
       (SELECT id FROM suppliers WHERE name='Импортер Обуви')
WHERE NOT EXISTS (SELECT 1 FROM products);
