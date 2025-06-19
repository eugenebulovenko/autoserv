-- Проверяем данные в таблице order_parts
SELECT 
    id,
    work_order_id,
    part_id,
    price,
    quantity
FROM order_parts
WHERE work_order_id = '9733d3b2-bd2c-466a-b070-8ec73486959e';

-- Проверяем все записи в таблице order_parts
SELECT COUNT(*) as total_count FROM order_parts;

-- Проверяем, какие заказы есть в таблице
SELECT DISTINCT work_order_id FROM order_parts;
