-- Проверяем политики RLS для таблицы order_parts
SELECT 
    policyname,
    schemaname,
    tablename,
    permissive,
    roles,
    usingexpr,
    withcheckexpr
FROM pg_policies
WHERE tablename = 'order_parts';
