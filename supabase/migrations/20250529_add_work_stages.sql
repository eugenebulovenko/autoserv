-- Проверка наличия функции update_updated_at_column()
DO $outer$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $outer$;

-- Создание таблицы для этапов работ
CREATE TABLE IF NOT EXISTS work_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы для связи заказ-нарядов с этапами работ
CREATE TABLE IF NOT EXISTS work_order_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES work_stages(id),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, stage_id)
);

-- Добавление триггера для обновления updated_at
CREATE TRIGGER set_work_stages_updated_at
BEFORE UPDATE ON work_stages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_work_order_stages_updated_at
BEFORE UPDATE ON work_order_stages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Заполнение таблицы предопределенными этапами работ
INSERT INTO work_stages (name, description, order_index) VALUES
('Диагностика', 'Первичная диагностика автомобиля и выявление проблем', 1),
('Разборка', 'Разборка необходимых узлов и агрегатов', 2),
('Ремонт/Замена', 'Выполнение ремонтных работ или замена деталей', 3),
('Сборка', 'Сборка узлов и агрегатов после ремонта', 4),
('Тестирование', 'Проверка работоспособности после ремонта', 5),
('Завершение', 'Работы завершены, автомобиль готов к выдаче', 6);

-- Добавление политик доступа для механиков
ALTER TABLE work_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_stages ENABLE ROW LEVEL SECURITY;

-- Политики для work_stages
CREATE POLICY "Все могут просматривать этапы работ" 
ON work_stages FOR SELECT 
TO authenticated 
USING (true);

-- Проверка наличия таблицы user_roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_roles'
    ) THEN
        -- Если таблицы user_roles нет, используем profiles.role
        CREATE POLICY "Механики могут просматривать этапы своих заказов" 
        ON work_order_stages FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );

        CREATE POLICY "Механики могут добавлять этапы для своих заказов" 
        ON work_order_stages FOR INSERT 
        TO authenticated 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );

        CREATE POLICY "Механики могут обновлять этапы своих заказов" 
        ON work_order_stages FOR UPDATE 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    ELSE
        -- Если таблица user_roles существует, используем ее
        CREATE POLICY "Механики могут просматривать этапы своих заказов" 
        ON work_order_stages FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = 'admin'
            )
        );

        CREATE POLICY "Механики могут добавлять этапы для своих заказов" 
        ON work_order_stages FOR INSERT 
        TO authenticated 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = 'admin'
            )
        );

        CREATE POLICY "Механики могут обновлять этапы своих заказов" 
        ON work_order_stages FOR UPDATE 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = work_order_stages.work_order_id 
                AND work_orders.mechanic_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = 'admin'
            )
        );
    END IF;
END $$;

-- Обновление политик для quality_checks, чтобы разрешить администраторам доступ
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quality_checks' AND policyname = 'Mechanics can insert quality checks'
    ) THEN
        DROP POLICY "Mechanics can insert quality checks" ON quality_checks;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quality_checks' AND policyname = 'Mechanics can view their quality checks'
    ) THEN
        DROP POLICY "Mechanics can view their quality checks" ON quality_checks;
    END IF;
END $$;

-- Проверка наличия таблицы user_roles для политик quality_checks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_roles'
    ) THEN
        -- Если таблицы user_roles нет, используем profiles.role
        CREATE POLICY "Admins can insert quality checks"
        ON quality_checks FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );

        CREATE POLICY "Admins can view quality checks"
        ON quality_checks FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            ) OR
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = quality_checks.work_order_id 
                AND work_orders.client_id = auth.uid()
            )
        );
    ELSE
        -- Если таблица user_roles существует, используем ее
        CREATE POLICY "Admins can insert quality checks"
        ON quality_checks FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = 'admin'
            )
        );

        CREATE POLICY "Admins can view quality checks"
        ON quality_checks FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_roles.user_id = auth.uid() 
                AND user_roles.role = 'admin'
            ) OR
            EXISTS (
                SELECT 1 FROM work_orders 
                WHERE work_orders.id = quality_checks.work_order_id 
                AND work_orders.client_id = auth.uid()
            )
        );
    END IF;
END $$;
