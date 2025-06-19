-- Удаляем существующие политики
DROP POLICY IF EXISTS "Admins can view all work order services" ON work_order_services;
DROP POLICY IF EXISTS "Admins can insert work order services" ON work_order_services;
DROP POLICY IF EXISTS "Admins can update work order services" ON work_order_services;
DROP POLICY IF EXISTS "Admins can delete work order services" ON work_order_services;
DROP POLICY IF EXISTS "Mechanics can view their work order services" ON work_order_services;

-- Создаем новые политики для всех пользователей
CREATE POLICY "All users can view work order services"
    ON work_order_services FOR SELECT
    USING (true);

CREATE POLICY "All users can insert work order services"
    ON work_order_services FOR INSERT
    WITH CHECK (true);

CREATE POLICY "All users can update work order services"
    ON work_order_services FOR UPDATE
    USING (true);

CREATE POLICY "All users can delete work order services"
    ON work_order_services FOR DELETE
    USING (true);
