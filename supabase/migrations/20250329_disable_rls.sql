-- Disable RLS for all tables
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 