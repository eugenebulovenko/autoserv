-- Удаляем существующие политики, если они есть
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_updates'
    ) THEN
        DROP POLICY IF EXISTS "Mechanics can insert status updates" ON order_status_updates;
        DROP POLICY IF EXISTS "Mechanics can view their status updates" ON order_status_updates;
    END IF;
END $$;

-- Создаем политики для механиков
CREATE POLICY "Mechanics can insert status updates"
    ON order_status_updates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM work_orders 
            WHERE work_orders.id = order_status_updates.work_order_id 
            AND work_orders.mechanic_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can view their status updates"
    ON order_status_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM work_orders 
            WHERE work_orders.id = order_status_updates.work_order_id 
            AND work_orders.mechanic_id = auth.uid()
        )
    );
