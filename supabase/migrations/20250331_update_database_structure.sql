-- Проверяем существование таблиц и создаем временные таблицы
DO $$ 
BEGIN
    -- Создаем временную таблицу для механиков, если таблица существует
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mechanics') THEN
        CREATE TEMP TABLE temp_mechanics AS
        SELECT 
            id,
            first_name,
            last_name,
            phone,
            email,
            created_at
        FROM mechanics;
    ELSE
        CREATE TEMP TABLE temp_mechanics (
            id uuid,
            first_name text,
            last_name text,
            phone text,
            email text,
            created_at timestamptz
        );
    END IF;

    -- Создаем временную таблицу для клиентов, если таблица существует
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        CREATE TEMP TABLE temp_clients AS
        SELECT 
            id,
            first_name,
            last_name,
            phone,
            email,
            created_at
        FROM clients;
    ELSE
        CREATE TEMP TABLE temp_clients (
            id uuid,
            first_name text,
            last_name text,
            phone text,
            email text,
            created_at timestamptz
        );
    END IF;
END $$;

-- Создаем записи в auth.users для механиков и клиентов
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
SELECT 
    id,
    email,
    crypt('temporary_password', gen_salt('bf')), -- Временный пароль
    NOW(),
    created_at,
    NOW()
FROM (
    SELECT id, email, created_at FROM temp_mechanics WHERE id IS NOT NULL
    UNION
    SELECT id, email, created_at FROM temp_clients WHERE id IS NOT NULL
) AS all_users
ON CONFLICT (id) DO NOTHING;

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
WHERE id IS NOT NULL
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
WHERE id IS NOT NULL
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

-- Удаляем старые таблицы, если они существуют
DROP TABLE IF EXISTS mechanics CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Удаляем временные таблицы
DROP TABLE IF EXISTS temp_mechanics;
DROP TABLE IF EXISTS temp_clients;

-- Обновляем политики безопасности
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Mechanics can view their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can update their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Clients can view their own work orders" ON work_orders;

-- Создаем функции для проверки ролей
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_mechanic()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'mechanic'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'client'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем новые политики
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can manage all work orders"
    ON work_orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Mechanics can view their own work orders"
    ON work_orders FOR SELECT
    USING (
        public.is_mechanic()
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Mechanics can update their own work orders"
    ON work_orders FOR UPDATE
    USING (
        public.is_mechanic()
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Clients can view their own work orders"
    ON work_orders FOR SELECT
    USING (
        public.is_client()
        AND client_id = auth.uid()
    );

-- Политика для доступа к связанным профилям
CREATE POLICY "Allow access to joined profiles"
    ON profiles FOR SELECT
    USING (
        public.is_admin()
        OR auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM work_orders
            WHERE (
                work_orders.mechanic_id = auth.uid()
                OR work_orders.client_id = auth.uid()
            )
            AND (
                work_orders.mechanic_id = profiles.id
                OR work_orders.client_id = profiles.id
            )
        )
    ); 