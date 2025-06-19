-- Обновляем структуру таблицы work_orders
ALTER TABLE work_orders
RENAME COLUMN total_amount TO total_cost;

-- Добавляем колонку appointment_id, если она еще не существует
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN appointment_id UUID;
    END IF;
END $$;

-- Добавляем недостающие связи
ALTER TABLE work_orders
DROP CONSTRAINT IF EXISTS work_orders_appointment_id_fkey,
ADD CONSTRAINT work_orders_appointment_id_fkey 
FOREIGN KEY (appointment_id) 
REFERENCES appointments(id) ON DELETE SET NULL;

-- Обновляем политики безопасности для work_orders
DROP POLICY IF EXISTS "Admins can manage all work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can view their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can update their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Clients can view their own work orders" ON work_orders;

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

-- Обновляем политики для связанных таблиц
CREATE POLICY "Allow access to work order services"
    ON work_order_services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.id = work_order_services.work_order_id
            AND (
                public.is_admin()
                OR work_orders.mechanic_id = auth.uid()
                OR work_orders.client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Allow access to order parts"
    ON order_parts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.id = order_parts.work_order_id
            AND (
                public.is_admin()
                OR work_orders.mechanic_id = auth.uid()
                OR work_orders.client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Allow access to repair photos"
    ON repair_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.id = repair_photos.work_order_id
            AND (
                public.is_admin()
                OR work_orders.mechanic_id = auth.uid()
                OR work_orders.client_id = auth.uid()
            )
        )
    );

-- Обновляем политики для appointments
CREATE POLICY "Allow access to appointments"
    ON appointments FOR ALL
    USING (
        public.is_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.appointment_id = appointments.id
            AND work_orders.mechanic_id = auth.uid()
        )
    ); 