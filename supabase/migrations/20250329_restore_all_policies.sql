-- Disable RLS first
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

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

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_role;
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
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
    ON profiles
    FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- Vehicles policies
CREATE POLICY "Admins can manage all vehicles"
    ON vehicles
    FOR ALL
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Clients can manage their own vehicles"
    ON vehicles
    FOR ALL
    USING (
        public.get_user_role() = 'client'
        AND user_id = auth.uid()
    );

-- Appointments policies
CREATE POLICY "Admins can manage all appointments"
    ON appointments
    FOR ALL
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Clients can manage their own appointments"
    ON appointments
    FOR ALL
    USING (
        public.get_user_role() = 'client'
        AND user_id = auth.uid()
    );

CREATE POLICY "Mechanics can view related appointments"
    ON appointments
    FOR SELECT
    USING (
        public.get_user_role() = 'mechanic'
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
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Mechanics can view their own work orders"
    ON work_orders
    FOR SELECT
    USING (
        public.get_user_role() = 'mechanic'
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Mechanics can update their own work orders"
    ON work_orders
    FOR UPDATE
    USING (
        public.get_user_role() = 'mechanic'
        AND mechanic_id = auth.uid()
    );

CREATE POLICY "Clients can view their own work orders"
    ON work_orders
    FOR SELECT
    USING (
        public.get_user_role() = 'client'
        AND EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = work_orders.appointment_id
            AND appointments.user_id = auth.uid()
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
        public.get_user_role() = 'admin'
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
        public.get_user_role() = 'admin'
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