-- Проверяем связь между work_orders и order_parts
SELECT 
    conname,
    confrelid::regclass as referenced_table,
    conrelid::regclass as referencing_table,
    array_agg(a.attname) as columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND (c.conrelid::regclass::text = 'work_orders' OR c.confrelid::regclass::text = 'work_orders')
AND (c.conrelid::regclass::text = 'order_parts' OR c.confrelid::regclass::text = 'order_parts')
GROUP BY conname, confrelid, conrelid;
