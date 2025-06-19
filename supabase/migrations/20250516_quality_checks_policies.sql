-- Удаляем существующие политики, если они есть
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quality_checks'
    ) THEN
        DROP POLICY IF EXISTS "Mechanics can insert quality checks" ON quality_checks;
        DROP POLICY IF EXISTS "Mechanics can view their quality checks" ON quality_checks;
    END IF;
END $$;

-- Создаем политики для механиков
CREATE POLICY "Mechanics can insert quality checks"
    ON quality_checks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM work_orders 
            WHERE work_orders.id = quality_checks.work_order_id 
            AND work_orders.mechanic_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can view their quality checks"
    ON quality_checks FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM work_orders 
            WHERE work_orders.id = quality_checks.work_order_id 
            AND work_orders.mechanic_id = auth.uid()
        )
    );
