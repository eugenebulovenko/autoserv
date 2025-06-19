-- Проверяем роли пользователя
SELECT 
    role_id,
    role_name,
    role_description
FROM auth.roles
WHERE role_id IN (
    SELECT role_id 
    FROM auth.users 
    WHERE id = auth.uid()
);

-- Проверяем права пользователя
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'work_order_comments'
AND grantee = 'authenticated';
