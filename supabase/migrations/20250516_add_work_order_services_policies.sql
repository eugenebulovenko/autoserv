-- Добавляем права доступа для таблицы work_order_services
GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_services TO authenticated;
GRANT USAGE ON SEQUENCE work_order_services_id_seq TO authenticated;

-- Проверяем права доступа
SELECT 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'work_order_services'
AND grantee = 'authenticated';
