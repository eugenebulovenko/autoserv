-- Enable RLS for work_orders table
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all work orders
CREATE POLICY "Admins can view all work orders"
    ON work_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy for admins to insert work orders
CREATE POLICY "Admins can insert work orders"
    ON work_orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy for admins to update work orders
CREATE POLICY "Admins can update work orders"
    ON work_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy for admins to delete work orders
CREATE POLICY "Admins can delete work orders"
    ON work_orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy for mechanics to view their own work orders
CREATE POLICY "Mechanics can view their own work orders"
    ON work_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'mechanic'
            AND id = work_orders.mechanic_id
        )
    );

-- Policy for mechanics to update their own work orders
CREATE POLICY "Mechanics can update their own work orders"
    ON work_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'mechanic'
            AND id = work_orders.mechanic_id
        )
    );

-- Policy for clients to view their own work orders
CREATE POLICY "Clients can view their own work orders"
    ON work_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN profiles ON appointments.user_id = profiles.id
            WHERE appointments.id = work_orders.appointment_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'client'
        )
    ); 