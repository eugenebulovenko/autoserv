-- First, let's check and drop all existing policies
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
END $$;

-- Disable RLS first
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_mechanic();
DROP FUNCTION IF EXISTS public.is_client();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Enable RLS for both tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role::text
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Work orders policies
CREATE POLICY "Admins can manage all work orders"
    ON work_orders
    FOR ALL
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Mechanics can manage their own work orders"
    ON work_orders
    FOR ALL
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