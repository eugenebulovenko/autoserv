-- Проверяем связь между work_order_comments и work_orders
SELECT 
    conname,
    confrelid::regclass as referenced_table,
    conrelid::regclass as referencing_table,
    array_agg(a.attname) as columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND c.confrelid::regclass::text = 'work_orders'
AND c.conrelid::regclass::text = 'work_order_comments'
GROUP BY conname, confrelid, conrelid;
