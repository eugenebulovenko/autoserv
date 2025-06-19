-- Проверяем все уникальные work_order_id в таблице
SELECT DISTINCT work_order_id FROM work_order_services;

-- Проверяем, есть ли запись с нужным work_order_id
SELECT EXISTS (
    SELECT 1 
    FROM work_order_services 
    WHERE work_order_id = '9733d3b2-bd2c-466a-b070-8ec73486959e'
);
