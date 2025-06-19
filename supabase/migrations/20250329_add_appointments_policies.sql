-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can delete their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can manage their own appointments" ON appointments;

-- Drop the is_admin function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Enable RLS for appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all appointments
CREATE POLICY "Admins can manage all appointments"
    ON appointments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy for clients to manage their own appointments
CREATE POLICY "Clients can manage their own appointments"
    ON appointments
    FOR ALL
    USING (
        user_id = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    ); 