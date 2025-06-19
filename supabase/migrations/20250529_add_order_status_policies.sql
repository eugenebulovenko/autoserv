-- Проверяем, существует ли таблица order_status_updates
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_status_updates'
    ) THEN
        -- Включаем RLS для таблицы
        ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;
        
        -- Удаляем все существующие политики для этой таблицы
        DO $policy$ 
        DECLARE 
            policy_name text;
        BEGIN
            FOR policy_name IN 
                SELECT policyname FROM pg_policies WHERE tablename = 'order_status_updates'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON order_status_updates', policy_name);
            END LOOP;
        END $policy$;
        
        -- Проверка наличия таблицы user_roles
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_roles'
        ) THEN
            -- Если таблица user_roles существует, используем ее
            CREATE POLICY "Пользователи могут просматривать обновления статусов своих заказов" 
            ON order_status_updates FOR SELECT 
            TO authenticated 
            USING (
                EXISTS (
                    SELECT 1 FROM work_orders 
                    WHERE work_orders.id = order_status_updates.work_order_id 
                    AND (
                        work_orders.mechanic_id = auth.uid() OR
                        work_orders.client_id = auth.uid()
                    )
                ) OR 
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );
            
            CREATE POLICY "Пользователи могут добавлять обновления статусов" 
            ON order_status_updates FOR INSERT 
            TO authenticated 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM work_orders 
                    WHERE work_orders.id = order_status_updates.work_order_id 
                    AND (
                        work_orders.mechanic_id = auth.uid()
                    )
                ) OR 
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );
        ELSE
            -- Если таблицы user_roles нет, используем profiles.role
            CREATE POLICY "Пользователи могут просматривать обновления статусов своих заказов" 
            ON order_status_updates FOR SELECT 
            TO authenticated 
            USING (
                EXISTS (
                    SELECT 1 FROM work_orders 
                    WHERE work_orders.id = order_status_updates.work_order_id 
                    AND (
                        work_orders.mechanic_id = auth.uid() OR
                        work_orders.client_id = auth.uid()
                    )
                ) OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
            
            CREATE POLICY "Пользователи могут добавлять обновления статусов" 
            ON order_status_updates FOR INSERT 
            TO authenticated 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM work_orders 
                    WHERE work_orders.id = order_status_updates.work_order_id 
                    AND (
                        work_orders.mechanic_id = auth.uid()
                    )
                ) OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
        END IF;
    END IF;
END $$;
