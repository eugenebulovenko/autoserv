-- Проверяем структуру таблицы work_orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'work_orders';
