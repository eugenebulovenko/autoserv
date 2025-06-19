-- Проверяем политики RLS для таблицы quality_checks
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
WHERE tablename = 'quality_checks';
