-- Проверяем наличие таблицы services
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'services'
);

-- Проверяем данные в таблице services
SELECT COUNT(*) as count FROM services;

-- Проверяем данные в work_order_services
SELECT COUNT(*) as count FROM work_order_services;
