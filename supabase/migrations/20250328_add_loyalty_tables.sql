-- Create service_history table
CREATE TABLE service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  cost NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'scheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty_offers table
CREATE TABLE loyalty_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  discount INTEGER NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty_points table
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own service history"
  ON service_history FOR SELECT
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage service history"
  ON service_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own loyalty offers"
  ON loyalty_offers FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins can manage loyalty offers"
  ON loyalty_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own loyalty points"
  ON loyalty_points FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins can manage loyalty points"
  ON loyalty_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER set_service_history_updated_at
  BEFORE UPDATE ON service_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_loyalty_offers_updated_at
  BEFORE UPDATE ON loyalty_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 