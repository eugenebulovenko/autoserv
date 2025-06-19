-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'client', 'mechanic');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quality_check_status') THEN
        CREATE TYPE quality_check_status AS ENUM ('passed', 'issues');
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger function for handling new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own vehicles
CREATE POLICY "Users can view their own vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for users to create vehicles
CREATE POLICY "Users can create vehicles"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own vehicles
CREATE POLICY "Users can update their own vehicles"
ON vehicles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own vehicles
CREATE POLICY "Users can delete their own vehicles"
ON vehicles FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy for admins to view all vehicles
CREATE POLICY "Admins can view all vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to update all vehicles
CREATE POLICY "Admins can update all vehicles"
ON vehicles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to delete all vehicles
CREATE POLICY "Admins can delete all vehicles"
ON vehicles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for service_categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view service categories
CREATE POLICY "All authenticated users can view service categories"
ON service_categories FOR SELECT
TO authenticated
USING (true);

-- Policy for admins to create service categories
CREATE POLICY "Admins can create service categories"
ON service_categories FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to update service categories
CREATE POLICY "Admins can update service categories"
ON service_categories FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to delete service categories
CREATE POLICY "Admins can delete service categories"
ON service_categories FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view services
CREATE POLICY "All authenticated users can view services"
ON services FOR SELECT
TO authenticated
USING (true);

-- Policy for admins to create services
CREATE POLICY "Admins can create services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to update services
CREATE POLICY "Admins can update services"
ON services FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to delete services
CREATE POLICY "Admins can delete services"
ON services FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL, -- in format "HH:MM"
  end_time TEXT NOT NULL, -- in format "HH:MM"
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own appointments
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for users to create appointments
CREATE POLICY "Users can create appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own appointments
CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own appointments
CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy for admins to view all appointments
CREATE POLICY "Admins can view all appointments"
ON appointments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to update all appointments
CREATE POLICY "Admins can update all appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to delete all appointments
CREATE POLICY "Admins can delete all appointments"
ON appointments FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create appointment_services junction table
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for appointment_services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own appointment services
CREATE POLICY "Users can view their own appointment services"
ON appointment_services FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = appointment_services.appointment_id
        AND appointments.user_id = auth.uid()
    )
);

-- Policy for users to create appointment services
CREATE POLICY "Users can create appointment services"
ON appointment_services FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = appointment_services.appointment_id
        AND appointments.user_id = auth.uid()
    )
);

-- Policy for users to update their own appointment services
CREATE POLICY "Users can update their own appointment services"
ON appointment_services FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = appointment_services.appointment_id
        AND appointments.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = appointment_services.appointment_id
        AND appointments.user_id = auth.uid()
    )
);

-- Policy for users to delete their own appointment services
CREATE POLICY "Users can delete their own appointment services"
ON appointment_services FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = appointment_services.appointment_id
        AND appointments.user_id = auth.uid()
    )
);

-- Policy for admins to view all appointment services
CREATE POLICY "Admins can view all appointment services"
ON appointment_services FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to create appointment services
CREATE POLICY "Admins can create appointment services"
ON appointment_services FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to update all appointment services
CREATE POLICY "Admins can update all appointment services"
ON appointment_services FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for admins to delete all appointment services
CREATE POLICY "Admins can delete all appointment services"
ON appointment_services FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  mechanic_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'created', -- created, in_progress, parts_waiting, completed, quality_passed, quality_issues
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  total_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_status_updates table
CREATE TABLE IF NOT EXISTS order_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  part_number TEXT,
  price NUMERIC NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_parts junction table
CREATE TABLE IF NOT EXISTS order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create repair_photos table
CREATE TABLE IF NOT EXISTS repair_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_checks table
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  checked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status quality_check_status NOT NULL,
  comments TEXT,
  check_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create loyalty_programs table
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL,
  min_visits INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client_loyalty_programs table
CREATE TABLE IF NOT EXISTS client_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  active_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, loyalty_program_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_loyalty_programs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all profiles"
    ON profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Sample data for testing
DO $$ 
BEGIN
    -- Service categories
    IF NOT EXISTS (SELECT 1 FROM service_categories WHERE id = '1aaa0000-0000-0000-0000-000000000001') THEN
        INSERT INTO service_categories (id, name, description) VALUES 
            ('1aaa0000-0000-0000-0000-000000000001', 'Диагностика', 'Диагностические услуги для выявления проблем'),
            ('1aaa0000-0000-0000-0000-000000000002', 'Техническое обслуживание', 'Регулярное техническое обслуживание автомобиля'),
            ('1aaa0000-0000-0000-0000-000000000003', 'Ремонт двигателя', 'Услуги по ремонту и восстановлению двигателя'),
            ('1aaa0000-0000-0000-0000-000000000004', 'Ремонт ходовой части', 'Услуги по ремонту подвески и ходовой части'),
            ('1aaa0000-0000-0000-0000-000000000005', 'Шиномонтаж', 'Услуги по замене и ремонту шин');
    END IF;

    -- Services
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = '2aaa0000-0000-0000-0000-000000000001') THEN
        INSERT INTO services (id, category_id, name, description, price, duration) VALUES
            ('2aaa0000-0000-0000-0000-000000000001', '1aaa0000-0000-0000-0000-000000000001', 'Компьютерная диагностика', 'Полная компьютерная диагностика систем автомобиля', 1500, 60),
            ('2aaa0000-0000-0000-0000-000000000002', '1aaa0000-0000-0000-0000-000000000002', 'Замена масла', 'Замена моторного масла и масляного фильтра', 1200, 30),
            ('2aaa0000-0000-0000-0000-000000000003', '1aaa0000-0000-0000-0000-000000000002', 'ТО-1', 'Техническое обслуживание с заменой расходных материалов', 4500, 120),
            ('2aaa0000-0000-0000-0000-000000000004', '1aaa0000-0000-0000-0000-000000000003', 'Замена ремня ГРМ', 'Замена ремня газораспределительного механизма', 5000, 180),
            ('2aaa0000-0000-0000-0000-000000000005', '1aaa0000-0000-0000-0000-000000000004', 'Замена амортизаторов', 'Замена передних или задних амортизаторов', 3500, 120),
            ('2aaa0000-0000-0000-0000-000000000006', '1aaa0000-0000-0000-0000-000000000005', 'Сезонная замена шин', 'Замена 4 шин с балансировкой', 2800, 60);
    END IF;

    -- Loyalty programs
    IF NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE id = '3aaa0000-0000-0000-0000-000000000001') THEN
        INSERT INTO loyalty_programs (id, name, discount_percentage, min_visits) VALUES
            ('3aaa0000-0000-0000-0000-000000000001', 'Бронзовый уровень', 5, 3),
            ('3aaa0000-0000-0000-0000-000000000002', 'Серебряный уровень', 10, 5),
            ('3aaa0000-0000-0000-0000-000000000003', 'Золотой уровень', 15, 10);
    END IF;

    -- Parts
    IF NOT EXISTS (SELECT 1 FROM parts WHERE id = '4aaa0000-0000-0000-0000-000000000001') THEN
        INSERT INTO parts (id, name, description, part_number, price, quantity_in_stock) VALUES
            ('4aaa0000-0000-0000-0000-000000000001', 'Масляный фильтр', 'Стандартный масляный фильтр для большинства моделей', 'OF-2345', 300, 50),
            ('4aaa0000-0000-0000-0000-000000000002', 'Воздушный фильтр', 'Воздушный фильтр двигателя', 'AF-1234', 450, 35),
            ('4aaa0000-0000-0000-0000-000000000003', 'Тормозные колодки', 'Передние тормозные колодки для легковых автомобилей', 'BP-7890', 1200, 20),
            ('4aaa0000-0000-0000-0000-000000000004', 'Моторное масло 5W-30', 'Синтетическое моторное масло, 1л', 'MO-5W30', 600, 100),
            ('4aaa0000-0000-0000-0000-000000000005', 'Аккумулятор 60Ah', 'Стартерная аккумуляторная батарея 12В 60Ah', 'BAT-60AH', 5000, 10);
    END IF;
END $$;
