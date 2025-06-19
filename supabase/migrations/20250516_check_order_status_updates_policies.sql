-- Проверяем политики RLS для таблицы order_status_updates
SELECT 
    policyname,
    schemaname,
    tablename,
    permissive,
    command,
    roles,
    using_expression,
    with_check_expression
FROM pg_policies
WHERE tablename = 'order_status_updates';
