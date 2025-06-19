-- Проверяем структуру таблицы repair_photos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'repair_photos';
