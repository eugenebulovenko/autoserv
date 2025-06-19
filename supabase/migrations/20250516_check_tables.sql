-- Проверяем наличие таблицы work_order_services
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'work_order_services'
);

-- Проверяем наличие внешнего ключа
SELECT conname, confrelid::regclass, conrelid::regclass 
FROM pg_constraint 
WHERE conname = 'work_order_services_work_order_id_fkey';
