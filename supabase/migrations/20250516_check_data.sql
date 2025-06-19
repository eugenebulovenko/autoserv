-- Проверяем данные в таблице work_order_services
SELECT 
    id,
    work_order_id,
    service_id,
    price,
    quantity
FROM work_order_services
WHERE work_order_id = '9733d3b2-bd2c-466a-b070-8ec73486959e';

-- Проверяем все записи в таблице
SELECT COUNT(*) as total_count FROM work_order_services;

-- Проверяем все записи в таблице work_orders
SELECT COUNT(*) as total_count FROM work_orders;
