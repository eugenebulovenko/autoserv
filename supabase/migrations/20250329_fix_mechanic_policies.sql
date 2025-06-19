-- Drop existing mechanic policies
DROP POLICY IF EXISTS "Mechanics can manage their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can view their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can update their own work orders" ON work_orders;
DROP POLICY IF EXISTS "Mechanics can view related appointments" ON appointments;
DROP POLICY IF EXISTS "Mechanics can view related profiles" ON profiles;

-- Create a function to check if user is mechanic
CREATE OR REPLACE FUNCTION public.is_mechanic()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'mechanic'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies for mechanics
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

-- Allow mechanics to view related appointments
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

-- Allow mechanics to view related profiles
CREATE POLICY "Mechanics can view related profiles"
    ON profiles
    FOR SELECT
    USING (
        public.is_mechanic()
        AND (
            id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM work_orders
                JOIN appointments ON appointments.id = work_orders.appointment_id
                WHERE work_orders.mechanic_id = auth.uid()
                AND appointments.user_id = profiles.id
            )
        )
    ); 