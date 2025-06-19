-- Disable RLS first
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    policy_name text;
BEGIN
    -- Drop all policies for appointments
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', policy_name);
    END LOOP;

    -- Drop all policies for work_orders
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'work_orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON work_orders', policy_name);
    END LOOP;

    -- Drop all policies for profiles
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_name);
    END LOOP;

    -- Drop all policies for vehicles
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'vehicles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vehicles', policy_name);
    END LOOP;

    -- Drop all policies for appointment_services
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointment_services'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON appointment_services', policy_name);
    END LOOP;
END $$;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_mechanic();
DROP FUNCTION IF EXISTS public.is_client();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is mechanic
CREATE OR REPLACE FUNCTION public.is_mechanic()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'mechanic'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'client'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON profiles
    FOR UPDATE
    USING (public.is_admin());

-- Vehicles policies
CREATE POLICY "Admins can manage all vehicles"
    ON vehicles
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Clients can manage their own vehicles"
    ON vehicles
    FOR ALL
    USING (
        public.is_client()
        AND user_id = auth.uid()
    );

-- Appointments policies
CREATE POLICY "Admins can manage all appointments"
    ON appointments
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Clients can manage their own appointments"
    ON appointments
    FOR ALL
    USING (
        public.is_client()
        AND user_id = auth.uid()
    );

CREATE POLICY "Mechanics can view related appointments"
    ON appointments
    FOR SELECT
    USING (
        public.is_mechanic()
        AND EXISTS (
            SELECT 1 FROM work_orders
            WHERE work_orders.appointment_id = appointments.id
            AND work_orders.mechanic_id = auth.uid()
        )
    );

-- Work orders policies
CREATE POLICY "Admins can manage all work orders"
    ON work_orders
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Mechanics can view their own work orders"
    ON work_orders
    FOR SELECT
    USING (
        public.is_mechanic()
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Mechanics can update their own work orders"
    ON work_orders
    FOR UPDATE
    USING (
        public.is_mechanic()
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Clients can view their own work orders"
    ON work_orders
    FOR SELECT
    USING (
        public.is_client()
        AND EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = work_orders.appointment_id
            AND appointments.user_id = auth.uid()
        )
    );

-- Appointment services policies
CREATE POLICY "Admins can manage all appointment services"
    ON appointment_services
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view their own appointment services"
    ON appointment_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
            AND (
                appointments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM work_orders
                    WHERE work_orders.appointment_id = appointments.id
                    AND work_orders.mechanic_id = auth.uid()
                )
            )
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create policies for joined tables
CREATE POLICY "Allow access to joined profiles"
    ON profiles
    FOR SELECT
    USING (
        public.is_admin()
        OR auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.user_id = profiles.id
            AND (
                appointments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM work_orders
                    WHERE work_orders.appointment_id = appointments.id
                    AND work_orders.mechanic_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Allow access to joined vehicles"
    ON vehicles
    FOR SELECT
    USING (
        public.is_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.vehicle_id = vehicles.id
            AND (
                appointments.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM work_orders
                    WHERE work_orders.appointment_id = appointments.id
                    AND work_orders.mechanic_id = auth.uid()
                )
            )
        )
    ); 