# Demo_Liatokho

# Создание БД, таблиц и заполнение начальными данными 
## SQL скрипт создания бд:
        -- Database: super_shoes

    -- DROP DATABASE IF EXISTS super_shoes;

    CREATE DATABASE super_shoes
        WITH
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'Russian_Russia.1252'
        LC_CTYPE = 'Russian_Russia.1252'
        LOCALE_PROVIDER = 'libc'
        TABLESPACE = pg_default
        CONNECTION LIMIT = -1
        IS_TEMPLATE = False;
## SQL скрипт создания таблиц:
        -- Таблица ролей пользователей
    CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE -- 'guest', 'client', 'manager', 'admin'
    );

    -- Таблица пользователей
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT
    );

    -- Таблица категорий товаров
    CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
    );

    -- Таблица производителей
    CREATE TABLE manufacturers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
    );

    -- Таблица поставщиков
    CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
    );

    -- Основная таблица товаров
    CREATE TABLE products (
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

    -- Таблица заказов
    CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_code VARCHAR(100) NOT NULL UNIQUE, -- Артикул заказа
        status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
        pickup_address TEXT NOT NULL, -- Адрес пункта выдачи
        order_date DATE NOT NULL,
        delivery_date DATE,
        
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Кто сделал заказ
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица элементов заказа (связь многие-ко-многим)
    CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
        
        UNIQUE(order_id, product_id)
    );
## SQL скрипт заполнения начальными данными 
        -- Заполняем роли
    INSERT INTO roles (name) VALUES 
    ('admin'),
    ('manager'), 
    ('client'),
    ('guest');

    -- Создаем администратора (пароль: admin123)
    INSERT INTO users (login, password_hash, full_name, role_id) VALUES 
    ('admin', '$2b$10$K9c2Xo9UQdK7U3aX7p5Zy.J.8XqVYQYkQ8QYdYQYdYQYdYQYdYQY', 'Администратор Системы', 1);

    -- Пример категорий
    INSERT INTO categories (name) VALUES 
    ('Кроссовки'),
    ('Туфли'),
    ('Ботинки'),
    ('Сапоги'),
    ('Сандалии');

    -- Пример производителей
    INSERT INTO manufacturers (name) VALUES 
    ('Nike'),
    ('Adidas'),
    ('Reebok'),
    ('ECCO'),
    ('Geox');

    -- Пример поставщиков
    INSERT INTO suppliers (name) VALUES 
    ('Поставщик Обуви №1'),
    ('Импортер Обуви'),
    ('Обувной Склад');
## ER-диаграмма
![Uploading image.png…]()

    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   roles     │    │   users     │    │ categories  │
    ├─────────────┤    ├─────────────┤    ├─────────────┤
    │ id (PK)     │◄───│ role_id (FK)│    │ id (PK)     │
    │ name        │    │ id (PK)     │    │ name        │
    └─────────────┘    │ login       │    └─────────────┘
                       │password_hash│         │
    ┌─────────────┐    │ full_name   │    ┌─────────────┐
    │  orders     │    └─────────────┘    │  products   │
    ├─────────────┤           │           ├─────────────┤
    │ id (PK)     │           │           │ id (PK)     │
    │ order_code  │    ┌─────────────┐    │ name        │
    │ status      │    │ order_items │    │ description │
    │ pickup_addr │    ├─────────────┤    │ price       │
    │ order_date  │    │ id (PK)     │    │ unit        │
    │delivery_date│    │ order_id(FK)│    │ stock_qty   │
    │ user_id (FK)│◄──┼│product_id   ├────┤ category_id │
    └─────────────┘    │ quantity    │    │ manufacturer│
                       │ unit_price  │    │ supplier_id │
                       └─────────────┘    │ image_path  │
                                │         └─────────────┘
                    ┌─────────────┐           │
                    │manufacturers│           │
                    ├─────────────┤    ┌─────────────┐
                    │ id (PK)     │    │  suppliers  │
                    │ name        │    ├─────────────┤
                    └─────────────┘    │ id (PK)     │
                                       │ name        │
                                       └─────────────┘
## Блок-схема


# Super Shoes (React + Node + Postgres) — минимальный запуск

## Быстрый старт (Docker)
1) Установите Docker и Docker Compose.
2) В корне проекта выполните:
   ```bash
   docker compose up --build
   ```
3) Откройте **http://localhost:5173** — веб‑клиент.
   API доступен на **http://localhost:4000**. БД — на localhost:5432.

**Учётные данные**: `admin` / `admin123`

## Функционал
- Роли: гость/клиент/менеджер/админ
- Авторизация (JWT), «Продолжить как гость»
- Список товаров: поиск, фильтр по поставщику, сортировка по количеству, подсветка скидок >15% (#2E8B57), отсутствие на складе — голубой фон
- Цена со скидкой: старая красная зачёркнута, рядом итоговая
- CRUD товаров (админ): добавление/редактирование/удаление, загрузка фото с ресайзом 300x200, замена удаляет старый файл
- Заказы (менеджер/админ просмотр, админ CRUD)
- Нельзя удалить товар, если он есть в заказе
- Заголовки/навигация/кнопка «Назад», отображение ФИО в правом верхнем углу

## Без Docker (локально для разработки)
- Поднимите Postgres 16, создайте БД `super_shoes` и выполните `db/init.sql`
- API:
  ```bash
  cd api
  npm i
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/super_shoes JWT_SECRET=dev npm start
  ```
- Web:
  ```bash
  cd web
  npm i
  VITE_API_URL=http://localhost:4000 npm run dev
  ```


