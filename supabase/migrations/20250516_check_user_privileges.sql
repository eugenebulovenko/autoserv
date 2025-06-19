-- Проверяем текущего пользователя
SELECT current_user;

-- Проверяем права доступа к таблице work_order_services
SELECT 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'work_order_services'
AND grantee = current_user;
