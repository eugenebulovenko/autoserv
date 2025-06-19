-- Исправляем отношения между appointment_services и services
DO $$ 
BEGIN
    -- Удаляем существующие внешние ключи
    ALTER TABLE appointment_services
    DROP CONSTRAINT IF EXISTS appointment_services_service_id_fkey,
    DROP CONSTRAINT IF EXISTS fk_appointment_services_service;

    -- Удаляем записи с несуществующими service_id
    DELETE FROM appointment_services
    WHERE service_id NOT IN (SELECT id FROM services);

    -- Создаем новый внешний ключ с правильным именем
    ALTER TABLE appointment_services
    ADD CONSTRAINT appointment_services_service_id_fkey
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE;
END $$;

-- Обновляем политики безопасности для appointment_services
DO $$ 
BEGIN
    -- Проверяем существование политик перед их удалением
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'appointment_services' 
        AND policyname = 'Users can view their own appointment services'
    ) THEN
        DROP POLICY "Users can view their own appointment services" ON appointment_services;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'appointment_services' 
        AND policyname = 'Admins can manage all appointment services'
    ) THEN
        DROP POLICY "Admins can manage all appointment services" ON appointment_services;
    END IF;
END $$;

-- Создаем новые политики для appointment_services
CREATE POLICY "Admins can manage all appointment services"
    ON appointment_services
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view related appointment services"
    ON appointment_services
    FOR SELECT
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
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