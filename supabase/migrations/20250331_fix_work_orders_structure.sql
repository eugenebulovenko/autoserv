-- Добавляем колонку completion_date, если она отсутствует
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'completion_date'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Исправляем отношения между work_order_services и services
DO $$ 
BEGIN
    -- Удаляем существующие внешние ключи
    ALTER TABLE work_order_services
    DROP CONSTRAINT IF EXISTS work_order_services_service_id_fkey,
    DROP CONSTRAINT IF EXISTS fk_work_order_services_service;

    -- Создаем новый внешний ключ с правильным именем
    ALTER TABLE work_order_services
    ADD CONSTRAINT work_order_services_service_id_fkey
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE;
END $$;

-- Обновляем политики безопасности для work_order_services
DO $$ 
BEGIN
    -- Проверяем существование политик перед их удалением
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'work_order_services' 
        AND policyname = 'Users can view their own work order services'
    ) THEN
        DROP POLICY "Users can view their own work order services" ON work_order_services;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'work_order_services' 
        AND policyname = 'Admins can manage all work order services'
    ) THEN
        DROP POLICY "Admins can manage all work order services" ON work_order_services;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'work_order_services' 
        AND policyname = 'Users can view related work order services'
    ) THEN
        DROP POLICY "Users can view related work order services" ON work_order_services;
    END IF;
END $$;

-- Создаем новые политики
CREATE POLICY "Admins can manage all work order services"
    ON work_order_services
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view related work order services"
    ON work_order_services
    FOR SELECT
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.id = work_order_services.work_order_id
            AND (
                work_orders.mechanic_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM appointments
                    WHERE appointments.id = work_orders.appointment_id
                    AND appointments.user_id = auth.uid()
                )
            )
        )
    );

-- Обновляем политики для services
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'services' 
        AND policyname = 'Users can view services'
    ) THEN
        DROP POLICY "Users can view services" ON services;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'services' 
        AND policyname = 'Admins can manage all services'
    ) THEN
        DROP POLICY "Admins can manage all services" ON services;
    END IF;
END $$;

CREATE POLICY "Admins can manage all services"
    ON services
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view services"
    ON services
    FOR SELECT
    USING (true);

-- Предоставляем необходимые разрешения
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 