-- Events Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vendor', 'renter', 'customer', 'worker')),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    company_name TEXT,
    gst_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contacts IS 'All contacts including vendors, renters, customers, and workers';
COMMENT ON COLUMN contacts.type IS 'vendor: people we rent from, renter: people we rent to, customer: event clients, worker: employees';

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    serial_number TEXT,
    unique_code TEXT UNIQUE NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'piece',
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_items IS 'All inventory items with quantity tracking';
COMMENT ON COLUMN inventory_items.unique_code IS 'Auto-generated unique identifier for each item type';
COMMENT ON COLUMN inventory_items.available_quantity IS 'Currently available quantity for new bookings';

-- ============================================
-- PRICING RATES TABLE
-- ============================================
CREATE TABLE pricing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    rental_type TEXT NOT NULL CHECK (rental_type IN ('daily', 'weekly', 'monthly', 'per_event')),
    rate DECIMAL(12, 2) NOT NULL,
    security_deposit DECIMAL(12, 2),
    min_rental_days INTEGER DEFAULT 1,
    max_rental_days INTEGER,
    applicable_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- Days of week (0=Sunday)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pricing_rates IS 'Pricing structure for inventory items';

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES contacts(id),
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    end_date DATE,
    venue_address TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    total_amount DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    profit_loss DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Event bookings with customer and financial tracking';

-- ============================================
-- EVENT ITEMS TABLE (Items used in events)
-- ============================================
CREATE TABLE event_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    rental_days INTEGER NOT NULL,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    unit_rate DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'picked_up', 'returned', 'damaged')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_items IS 'Items allocated to specific events with rental tracking';

-- ============================================
-- EXTERNAL RENTALS TABLE (Items we rent FROM others)
-- ============================================
CREATE TABLE external_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES contacts(id),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    rental_days INTEGER NOT NULL,
    unit_rate DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    security_deposit DECIMAL(12, 2),
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'picked_up', 'returned', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE external_rentals IS 'Items we rent from vendors for our events';

-- ============================================
-- WORKER ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE worker_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES contacts(id),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    wage_per_day DECIMAL(12, 2) NOT NULL,
    total_days INTEGER NOT NULL,
    total_wages DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'working', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE worker_assignments IS 'Workers assigned to events with wage tracking';

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
    category TEXT NOT NULL CHECK (category IN ('rental_income', 'rental_expense', 'wages', 'advance', 'refund', 'other')),
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'All financial transactions';
COMMENT ON COLUMN payments.type IS 'incoming: money received, outgoing: money paid';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_name ON contacts(name);

CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_unique_code ON inventory_items(unique_code);

CREATE INDEX idx_pricing_item ON pricing_rates(inventory_item_id);

CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

CREATE INDEX idx_event_items_event ON event_items(event_id);
CREATE INDEX idx_event_items_inventory ON event_items(inventory_item_id);
CREATE INDEX idx_event_items_status ON event_items(status);

CREATE INDEX idx_external_rentals_vendor ON external_rentals(vendor_id);
CREATE INDEX idx_external_rentals_event ON external_rentals(event_id);

CREATE INDEX idx_worker_assignments_worker ON worker_assignments(worker_id);
CREATE INDEX idx_worker_assignments_event ON worker_assignments(event_id);

CREATE INDEX idx_payments_contact ON payments(contact_id);
CREATE INDEX idx_payments_event ON payments(event_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_type ON payments(type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rates_updated_at BEFORE UPDATE ON pricing_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_items_updated_at BEFORE UPDATE ON event_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_rentals_updated_at BEFORE UPDATE ON external_rentals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_assignments_updated_at BEFORE UPDATE ON worker_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name TEXT NOT NULL DEFAULT 'Events Management System',
    system_short_name TEXT NOT NULL DEFAULT 'EMS',
    owner_name TEXT NOT NULL DEFAULT 'System Owner',
    proprietor_name TEXT,
    contact_number TEXT,
    email TEXT,
    office_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    favicon_url TEXT,
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    time_format TEXT NOT NULL DEFAULT '12h',
    theme_color TEXT DEFAULT 'indigo',
    accent_color TEXT DEFAULT 'fuchsia',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'System configuration and business information';
COMMENT ON COLUMN system_settings.system_name IS 'Full name of the system/business';
COMMENT ON COLUMN system_settings.system_short_name IS 'Short name/acronym for the system';

-- Insert default settings (only one row should exist)
INSERT INTO system_settings (system_name, system_short_name, owner_name, currency_symbol) 
VALUES ('Events Management System', 'EMS', 'System Owner', '₹');

-- Trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS (for images and documents)
-- ============================================
-- Create storage bucket for system assets (logos, banners)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for event documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-documents', 'event-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for system-assets bucket
CREATE POLICY "Allow all operations on system-assets" ON storage.objects
  FOR ALL USING (bucket_id = 'system-assets') WITH CHECK (bucket_id = 'system-assets');

-- Storage policies for event-documents bucket  
CREATE POLICY "Allow all operations on event-documents" ON storage.objects
  FOR ALL USING (bucket_id = 'event-documents') WITH CHECK (bucket_id = 'event-documents');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simplified for single-user app)
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pricing_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON event_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON external_rentals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON worker_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Add some sample categories for inventory
-- INSERT INTO inventory_items (name, category, unique_code, total_quantity, unit) VALUES
-- ('LED Screen 16x8', 'LED Wall', 'LED001', 2, 'piece'),
-- ('Sound System 2000W', 'Sound', 'SND001', 4, 'piece'),
-- ('Stage Platform 4x4', 'Stage', 'STG001', 10, 'piece'),
-- ('Plastic Chair', 'Furniture', 'FUR001', 500, 'piece'),
-- ('Round Table 4ft', 'Furniture', 'FUR002', 50, 'piece');
