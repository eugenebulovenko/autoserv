-- Проверяем политики RLS для таблицы work_order_comments
SELECT 
    policyname,
    schemaname,
    tablename,
    permissive,
    roles,
    usingexpr,
    withcheckexpr
FROM pg_policies
WHERE tablename = 'work_order_comments';
