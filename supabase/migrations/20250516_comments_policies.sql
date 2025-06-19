-- Проверяем существующие политики
DO $$
BEGIN
    -- Если политика "Authenticated users can view all comments" уже существует, не удаляем её
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'work_order_comments' 
        AND policyname = 'Authenticated users can view all comments'
    ) THEN
        RAISE NOTICE 'Policy "Authenticated users can view all comments" already exists';
    ELSE
        -- Удаляем старые политики
        DROP POLICY IF EXISTS "Admins can delete comments" ON work_order_comments;
        DROP POLICY IF EXISTS "Admins can view all comments" ON work_order_comments;
        DROP POLICY IF EXISTS "Mechanics can add comments to their orders" ON work_order_comments;

        -- Создаем политику для просмотра комментариев
        -- Аутентифицированные пользователи могут видеть все комментарии
        CREATE POLICY "Authenticated users can view all comments"
        ON work_order_comments
        FOR SELECT
        TO authenticated
        USING (true);

        -- Анонимные пользователи не могут видеть комментарии
        CREATE POLICY "Anonymous users cannot view comments"
        ON work_order_comments
        FOR SELECT
        TO anon
        USING (false);

        -- Создаем политику для добавления комментариев
        -- Аутентифицированные пользователи могут добавлять комментарии к своим заказам
        CREATE POLICY "Authenticated users can add comments to their orders"
        ON work_order_comments
        FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM work_orders
                WHERE id = work_order_comments.work_order_id
                AND mechanic_id = auth.uid()
            )
        );

        -- Создаем политику для удаления комментариев
        -- Аутентифицированные пользователи могут удалять только свои комментарии
        CREATE POLICY "Authenticated users can delete their own comments"
        ON work_order_comments
        FOR DELETE
        TO authenticated
        USING (
            user_id IS NOT NULL AND user_id = auth.uid()
        );

        -- Анонимные пользователи не могут добавлять или удалять комментарии
        CREATE POLICY "Anonymous users cannot modify comments"
        ON work_order_comments
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;
