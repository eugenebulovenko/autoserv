-- Проверяем наличие таблицы work_order_parts
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'work_order_parts'
);

-- Проверяем структуру таблицы work_order_parts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'work_order_parts';

-- Проверяем внешние ключи
SELECT 
    conname,
    confrelid::regclass as referenced_table,
    conrelid::regclass as referencing_table,
    array_agg(a.attname) as columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND c.conrelid::regclass::text = 'work_order_parts'
GROUP BY conname, confrelid, conrelid;
