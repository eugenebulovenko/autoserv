-- Обновляем политики для work_orders
DO $$ 
BEGIN
    -- Удаляем существующие политики
    DROP POLICY IF EXISTS "Mechanics can view their own work orders" ON work_orders;
    DROP POLICY IF EXISTS "Mechanics can update their own work orders" ON work_orders;
END $$;

-- Создаем новые политики для work_orders
CREATE POLICY "Mechanics can view their own work orders"
    ON work_orders
    FOR SELECT
    USING (
        mechanic_id = auth.uid()
    );

CREATE POLICY "Mechanics can update their own work orders"
    ON work_orders
    FOR UPDATE
    USING (
        mechanic_id = auth.uid()
    );

-- Обновляем политики для appointments
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Mechanics can view related appointments" ON appointments;
END $$;

CREATE POLICY "Mechanics can view related appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.appointment_id = appointments.id
            AND work_orders.mechanic_id = auth.uid()
        )
    );

-- Обновляем политики для vehicles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Mechanics can view related vehicles" ON vehicles;
END $$;

CREATE POLICY "Mechanics can view related vehicles"
    ON vehicles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN work_orders ON work_orders.appointment_id = appointments.id
            WHERE appointments.vehicle_id = vehicles.id
            AND work_orders.mechanic_id = auth.uid()
        )
    );

-- Обновляем политики для profiles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Mechanics can view related profiles" ON profiles;
END $$;

CREATE POLICY "Mechanics can view related profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN work_orders ON work_orders.appointment_id = appointments.id
            WHERE appointments.user_id = profiles.id
            AND work_orders.mechanic_id = auth.uid()
        )
    );

-- Предоставляем необходимые разрешения
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 