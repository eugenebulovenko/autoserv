-- Проверяем структуру таблицы work_order_services
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'work_order_services';

-- Проверяем связь с таблицей services
SELECT 
    conname,
    confrelid::regclass as referenced_table,
    conrelid::regclass as referencing_table,
    array_agg(a.attname) as columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND c.confrelid::regclass::text = 'services'
AND c.conrelid::regclass::text = 'work_order_services'
GROUP BY conname, confrelid, conrelid;
