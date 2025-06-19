-- Проверяем связи таблицы parts
SELECT 
    conname,
    confrelid::regclass as referenced_table,
    conrelid::regclass as referencing_table,
    array_agg(a.attname) as columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND c.confrelid::regclass::text = 'parts'
GROUP BY conname, confrelid, conrelid;
