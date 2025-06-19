-- Создаем таблицу для комментариев к заказам
CREATE TABLE work_order_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индексы для улучшения производительности
CREATE INDEX idx_work_order_comments_work_order_id ON work_order_comments(work_order_id);
CREATE INDEX idx_work_order_comments_user_id ON work_order_comments(user_id);

-- Создаем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_order_comments_updated_at
    BEFORE UPDATE ON work_order_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Добавляем политики RLS
-- Механики могут добавлять комментарии к своим заказам
ALTER TABLE work_order_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mechanics can add comments to their orders"
    ON work_order_comments FOR INSERT
    WITH CHECK (
        auth.role() = 'mechanic' AND
        EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.id = work_order_comments.work_order_id
            AND work_orders.mechanic_id = auth.uid()
        )
    );

-- Администраторы могут просматривать все комментарии
CREATE POLICY "Admins can view all comments"
    ON work_order_comments FOR SELECT
    USING (auth.role() = 'admin');

-- Администраторы могут удалять комментарии
CREATE POLICY "Admins can delete comments"
    ON work_order_comments FOR DELETE
    USING (auth.role() = 'admin');
