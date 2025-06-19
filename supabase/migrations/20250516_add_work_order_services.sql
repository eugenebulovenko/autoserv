-- Создаем таблицу для услуг заказ-нарядов
CREATE TABLE IF NOT EXISTS work_order_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_work_order_services_work_order_id ON work_order_services(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_service_id ON work_order_services(service_id);

-- Создаем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_work_order_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_order_services_updated_at
    BEFORE UPDATE ON work_order_services
    FOR EACH ROW
    EXECUTE FUNCTION update_work_order_services_updated_at();

-- Создаем политики RLS
ALTER TABLE work_order_services ENABLE ROW LEVEL SECURITY;

-- Политика для админов
CREATE POLICY "Admins can view all work order services"
    ON work_order_services FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert work order services"
    ON work_order_services FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update work order services"
    ON work_order_services FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete work order services"
    ON work_order_services FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Политика для механиков
CREATE POLICY "Mechanics can view their work order services"
    ON work_order_services FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM work_orders w
            JOIN profiles p ON w.mechanic_id = p.id
            WHERE w.id = work_order_id
            AND p.id = auth.uid()
        )
    );
