-- Создаем временную таблицу для хранения данных механиков
CREATE TEMP TABLE temp_mechanics AS
SELECT 
    id,
    first_name,
    last_name,
    phone,
    email,
    created_at
FROM mechanics;

-- Создаем временную таблицу для хранения данных клиентов
CREATE TEMP TABLE temp_clients AS
SELECT 
    id,
    first_name,
    last_name,
    phone,
    email,
    created_at
FROM clients;

-- Переносим данные механиков в profiles
INSERT INTO profiles (id, first_name, last_name, phone, role, email, created_at)
SELECT 
    id,
    first_name,
    last_name,
    phone,
    'mechanic'::user_role,
    email,
    created_at
FROM temp_mechanics
ON CONFLICT (id) DO UPDATE
SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = 'mechanic'::user_role,
    email = EXCLUDED.email;

-- Переносим данные клиентов в profiles
INSERT INTO profiles (id, first_name, last_name, phone, role, email, created_at)
SELECT 
    id,
    first_name,
    last_name,
    phone,
    'client'::user_role,
    email,
    created_at
FROM temp_clients
ON CONFLICT (id) DO UPDATE
SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = 'client'::user_role,
    email = EXCLUDED.email;

-- Обновляем внешние ключи в work_orders
ALTER TABLE work_orders
DROP CONSTRAINT IF EXISTS work_orders_mechanic_id_fkey,
DROP CONSTRAINT IF EXISTS work_orders_client_id_fkey;

ALTER TABLE work_orders
ADD CONSTRAINT work_orders_mechanic_id_fkey 
FOREIGN KEY (mechanic_id) 
REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE work_orders
ADD CONSTRAINT work_orders_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES profiles(id) ON DELETE SET NULL;

-- Обновляем внешние ключи в других таблицах
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey,
ADD CONSTRAINT appointments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE client_loyalty_programs
DROP CONSTRAINT IF EXISTS client_loyalty_programs_user_id_fkey,
ADD CONSTRAINT client_loyalty_programs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE loyalty_offers
DROP CONSTRAINT IF EXISTS loyalty_offers_client_id_fkey,
ADD CONSTRAINT loyalty_offers_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE loyalty_points
DROP CONSTRAINT IF EXISTS loyalty_points_client_id_fkey,
ADD CONSTRAINT loyalty_points_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey,
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) ON DELETE CASCADE;

-- Удаляем старые таблицы
DROP TABLE IF EXISTS mechanics CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Удаляем временные таблицы
DROP TABLE IF EXISTS temp_mechanics;
DROP TABLE IF EXISTS temp_clients; 