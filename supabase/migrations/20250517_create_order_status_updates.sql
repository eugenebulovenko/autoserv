-- Миграция: создание таблицы order_status_updates, если она отсутствует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_status_updates'
    ) THEN
        CREATE TABLE public.order_status_updates (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
            created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
            status text NOT NULL,
            comment text,
            created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
        );
        
        CREATE INDEX idx_order_status_updates_work_order_id ON public.order_status_updates(work_order_id);
        CREATE INDEX idx_order_status_updates_created_by ON public.order_status_updates(created_by);
        CREATE INDEX idx_order_status_updates_status ON public.order_status_updates(status);
    END IF;
END $$;

-- Для отката (down migration) используйте:
-- DROP TABLE IF EXISTS public.order_status_updates CASCADE;
