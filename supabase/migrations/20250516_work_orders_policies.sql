-- Удаляем существующие политики, если они есть
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'work_orders'
    ) THEN
        DROP POLICY IF EXISTS "Mechanics can view their orders" ON work_orders;
        DROP POLICY IF EXISTS "Mechanics can update their orders" ON work_orders;
    END IF;
END $$;

-- Создаем политики для механиков
CREATE POLICY "Mechanics can view their orders"
    ON work_orders FOR SELECT
    TO authenticated
    USING (
        mechanic_id = auth.uid()
    );

CREATE POLICY "Mechanics can update their orders"
    ON work_orders FOR UPDATE
    TO authenticated
    USING (
        mechanic_id = auth.uid()
    )
    WITH CHECK (
        mechanic_id = auth.uid()
    );
