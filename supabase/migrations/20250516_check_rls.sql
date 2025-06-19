-- Проверяем политики RLS для таблицы work_order_services
SELECT 
    policyname,
    schemaname,
    tablename,
    permissive,
    roles,
    usingexpr,
    withcheckexpr
FROM pg_policies
WHERE tablename = 'work_order_services';
