-- Проверяем, какие заказы есть в таблице
SELECT 
    id,
    order_number,
    status
FROM work_orders
WHERE id IN (
    SELECT DISTINCT work_order_id 
    FROM work_order_services
);

-- Проверяем, есть ли заказ с нужным ID
SELECT 
    id,
    order_number,
    status
FROM work_orders
WHERE id = '9733d3b2-bd2c-466a-b070-8ec73486959e';
