-- Добавляем колонку start_date, если она отсутствует
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$; 