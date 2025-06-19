-- Удаляем старые политики
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

-- Политики для profiles
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

-- Политики для work_orders
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
        AND EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = work_orders.appointment_id
            AND appointments.user_id = auth.uid()
        )
    );

-- Политики для связанных таблиц
CREATE POLICY "Allow access to joined profiles"
    ON profiles FOR SELECT
    USING (
        public.is_admin()
        OR auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.user_id = profiles.id
            AND (
                appointments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM work_orders
                    WHERE work_orders.appointment_id = appointments.id
                    AND work_orders.mechanic_id = auth.uid()
                )
            )
        )
    ); 