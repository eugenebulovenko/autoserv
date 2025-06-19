-- Проверяем структуру таблицы work_order_comments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'work_order_comments';

-- Добавляем поле created_by для отслеживания авторства комментариев
ALTER TABLE work_order_comments
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Обновляем существующие комментарии с авторством
UPDATE work_order_comments
SET created_by = auth.uid()
WHERE created_by IS NULL;
