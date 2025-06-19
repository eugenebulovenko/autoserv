-- Добавляем колонку work_order_id в таблицу appointments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'work_order_id'
    ) THEN
        ALTER TABLE appointments
        ADD COLUMN work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Добавляем колонку order_number в таблицу work_orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN order_number TEXT UNIQUE;
    END IF;
END $$;

-- Добавляем колонку client_id в таблицу work_orders, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN client_id UUID REFERENCES profiles(id) NOT NULL;
    END IF;
END $$;

-- Добавляем колонку mechanic_id в таблицу work_orders, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'mechanic_id'
    ) THEN
        ALTER TABLE work_orders
        ADD COLUMN mechanic_id UUID REFERENCES profiles(id) NULL;
    END IF;
END $$;

-- Удаляем ограничение NOT NULL с колонки mechanic_id, если оно есть
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_orders' 
        AND column_name = 'mechanic_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE work_orders
        ALTER COLUMN mechanic_id DROP NOT NULL;
    END IF;
END $$;

-- Функция для генерации номера заказ-наряда
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    -- Генерируем номер в формате WO-YYYYMMDD-XXXX
    new_number := 'WO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                 lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Проверяем уникальность
    WHILE EXISTS (
        SELECT 1 FROM work_orders 
        WHERE order_number = new_number
    ) LOOP
        new_number := 'WO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                     lpad(floor(random() * 10000)::text, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Функция для создания заказ-наряда из записи
CREATE OR REPLACE FUNCTION create_work_order_from_appointment()
RETURNS TRIGGER AS $$
DECLARE
    new_work_order_id UUID;
    client_id UUID;
BEGIN
    -- Проверяем, что запись подтверждена и заказ-наряд еще не создан
    IF NEW.status = 'confirmed' AND NEW.work_order_id IS NULL THEN
        -- Получаем client_id из записи
        SELECT user_id INTO client_id
        FROM appointments
        WHERE id = NEW.id;

        -- Создаем заказ-наряд
        INSERT INTO work_orders (
            order_number,
            appointment_id,
            client_id,
            status,
            total_cost,
            mechanic_id,
            created_at,
            updated_at
        ) VALUES (
            generate_work_order_number(),
            NEW.id,
            client_id,
            'created',
            NEW.total_price,
            NULL,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO new_work_order_id;

        -- Обновляем запись, связывая её с заказ-нарядом
        UPDATE appointments
        SET work_order_id = new_work_order_id
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического создания заказ-наряда при подтверждении записи
DROP TRIGGER IF EXISTS create_work_order_trigger ON appointments;
CREATE TRIGGER create_work_order_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_work_order_from_appointment();

-- Функция для синхронизации статуса
CREATE OR REPLACE FUNCTION sync_appointment_work_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем статус заказ-наряда при изменении статуса записи
    IF NEW.status != OLD.status THEN
        UPDATE work_orders
        SET 
            status = CASE 
                WHEN NEW.status = 'completed' THEN 'completed'
                WHEN NEW.status = 'cancelled' THEN 'cancelled'
                ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = NEW.id;
    END IF;

    -- Обновляем стоимость в заказ-наряде при изменении стоимости записи
    IF NEW.total_price != OLD.total_price THEN
        UPDATE work_orders
        SET 
            total_cost = NEW.total_price,
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для синхронизации статуса и стоимости
DROP TRIGGER IF EXISTS sync_work_order_status_trigger ON appointments;
CREATE TRIGGER sync_work_order_status_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_work_order_status();

-- Обновляем политики безопасности
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'work_orders' 
        AND policyname = 'Allow access to work orders through appointments'
    ) THEN
        CREATE POLICY "Allow access to work orders through appointments"
            ON work_orders
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM appointments
                    WHERE appointments.id = work_orders.appointment_id
                    AND (
                        appointments.user_id = auth.uid()
                        OR work_orders.mechanic_id = auth.uid()
                        OR public.is_admin()
                    )
                )
            );
    END IF;
END $$; 