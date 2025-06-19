-- Проверяем и обновляем связи между таблицами services и work_order_services
DO $$ 
BEGIN
    -- Проверяем существование внешнего ключа
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'work_order_services_service_id_fkey'
    ) THEN
        -- Добавляем внешний ключ
        ALTER TABLE work_order_services
        ADD CONSTRAINT work_order_services_service_id_fkey
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Обновляем политики безопасности для work_order_services
DROP POLICY IF EXISTS "Users can view their own work order services" ON work_order_services;
DROP POLICY IF EXISTS "Admins can manage all work order services" ON work_order_services;

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
DROP POLICY IF EXISTS "Users can view services" ON services;
DROP POLICY IF EXISTS "Admins can manage all services" ON services;

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