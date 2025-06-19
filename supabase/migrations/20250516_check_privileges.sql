-- Проверяем права пользователя
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'work_order_comments'
AND grantee = 'authenticated';

-- Проверяем политики RLS
SELECT 
    policyname,
    schemaname,
    tablename,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'work_order_comments';
