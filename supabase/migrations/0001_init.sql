-- Events Management System — Database Schema (Phase 0)
-- Run: npx supabase db push  OR  npx supabase db reset

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- AUTH / PROFILES
-- ================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'accountant', 'staff')) DEFAULT 'staff',
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Auth users mapped to app roles';

-- ================================================================
-- MASTERS
-- ================================================================
CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
    icon TEXT DEFAULT 'box',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_items (renamed from contacts-type separation)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vendor', 'renter', 'customer', 'other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    company_name TEXT,
    gst_number TEXT,
    segment TEXT,
    credit_days INTEGER DEFAULT 0,
    contact_person TEXT,
    follow_up_date DATE,
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    designation TEXT,
    employment_type TEXT CHECK (employment_type IN ('permanent', 'contract', 'daily')) DEFAULT 'daily',
    base_salary DECIMAL(12, 2) DEFAULT 0,
    daily_wage DECIMAL(12, 2) DEFAULT 0,
    bank_account TEXT,
    ifsc_code TEXT,
    pan TEXT,
    aadhaar TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
    joined_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
    description TEXT,
    serial_number TEXT,
    unique_code TEXT UNIQUE NOT NULL,
    company TEXT,
    model TEXT,
    scope TEXT,
    item_type TEXT CHECK (item_type IN ('owned', 'leased')) DEFAULT 'owned',
    target_event_types TEXT[],
    estimated_rent_price DECIMAL(12, 2) DEFAULT 0,
    min_price DECIMAL(12, 2) DEFAULT 0,
    security_deposit DECIMAL(12, 2) DEFAULT 0,
    hsn_code TEXT,
    images TEXT[],
    total_quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'piece',
    location_id UUID REFERENCES item_locations(id) ON DELETE SET NULL,
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    reorder_level INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_serials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    serial_code TEXT NOT NULL,
    qr_code TEXT,
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good',
    status TEXT NOT NULL DEFAULT 'available',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'service', 'calibration', 'upgrade', 'other')) DEFAULT 'service',
    description TEXT,
    cost DECIMAL(12, 2) DEFAULT 0,
    vendor_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PRICING
-- ================================================================
CREATE TABLE pricing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    rental_type TEXT NOT NULL CHECK (rental_type IN ('hourly', 'daily', 'weekly', 'monthly', 'per_event')),
    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    weekend_rate DECIMAL(12, 2),
    applicable_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
    security_deposit DECIMAL(12, 2) DEFAULT 0,
    min_days INTEGER DEFAULT 1,
    max_days INTEGER,
    slab JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE special_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope TEXT DEFAULT 'item',
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    rate_type TEXT CHECK (rate_type IN ('multiplier', 'fixed')) DEFAULT 'multiplier',
    rate_value DECIMAL(12, 2) NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_no TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES contacts(id),
    event_type TEXT,
    event_start_date DATE,
    event_end_date DATE,
    venue TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'negotiating', 'approved', 'rejected', 'converted')),
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) DEFAULT 0,
    tax_mode TEXT CHECK (tax_mode IN ('none', 'gst')) DEFAULT 'none',
    validity_days INTEGER DEFAULT 7,
    version INTEGER DEFAULT 1,
    parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    override_note TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name TEXT,
    item_code TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    days INTEGER DEFAULT 1,
    rate_from_system DECIMAL(12, 2) DEFAULT 0,
    rate_applied DECIMAL(12, 2) NOT NULL DEFAULT 0,
    override_reason TEXT,
    discount DECIMAL(12, 2) DEFAULT 0,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_line DECIMAL(12, 2) DEFAULT 0,
    margin_line DECIMAL(12, 2) DEFAULT 0,
    source TEXT CHECK (source IN ('own', 'rented_in')) DEFAULT 'own',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- EVENTS
-- ================================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_no TEXT NOT NULL UNIQUE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES contacts(id),
    event_type TEXT NOT NULL,
    name TEXT NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    venue TEXT,
    venue_address TEXT,
    status TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'quoted', 'confirmed', 'setup', 'live', 'teardown', 'completed', 'cancelled')),
    client_advance DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    profit_loss DECIMAL(12, 2) DEFAULT 0,
    tax_mode TEXT CHECK (tax_mode IN ('none', 'gst')) DEFAULT 'none',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quote_item_id UUID REFERENCES quote_items(id) ON DELETE SET NULL,
    source TEXT CHECK (source IN ('own', 'rented_in')) DEFAULT 'own',
    qty INTEGER NOT NULL DEFAULT 1,
    days INTEGER NOT NULL DEFAULT 1,
    unit_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_line DECIMAL(12, 2) DEFAULT 0,
    pickup_datetime TIMESTAMPTZ,
    return_datetime TIMESTAMPTZ,
    picked_qty INTEGER DEFAULT 0,
    returned_qty INTEGER DEFAULT 0,
    damaged_qty INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'picked_up', 'returned', 'damaged', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id),
    role TEXT NOT NULL,
    wage_basis TEXT CHECK (wage_basis IN ('daily_wage', 'salary', 'fixed')) DEFAULT 'daily_wage',
    wage_per_day DECIMAL(12, 2) DEFAULT 0,
    days INTEGER NOT NULL DEFAULT 1,
    ot_hours DECIMAL(6, 2) DEFAULT 0,
    ot_rate DECIMAL(12, 2) DEFAULT 0,
    total_wages DECIMAL(12, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('assigned', 'working', 'completed', 'cancelled')) DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    status TEXT CHECK (status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category TEXT,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
    payment_ref TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- RENTALS IN / OUT
-- ================================================================
CREATE TABLE rental_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_no TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    party_id UUID NOT NULL REFERENCES contacts(id),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rate_type TEXT CHECK (rate_type IN ('daily', 'weekly', 'monthly', 'per_event', 'fixed')),
    rate DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    security_deposit DECIMAL(12, 2) DEFAULT 0,
    transport_cost DECIMAL(12, 2) DEFAULT 0,
    terms TEXT,
    status TEXT CHECK (status IN ('requested', 'approved', 'dispatched', 'received', 'returned', 'closed', 'cancelled')) DEFAULT 'requested',
    received_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rental_contract_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_rate DECIMAL(12, 2) DEFAULT 0,
    days INTEGER NOT NULL DEFAULT 1,
    line_total DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STAFF / PAYROLL
-- ================================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'half', 'leave', 'holiday', 'weekoff')) NOT NULL,
    hours DECIMAL(5, 2) DEFAULT 0,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    notes TEXT,
    marked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

CREATE TABLE staff_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recovered_amount DECIMAL(12, 2) DEFAULT 0,
    recovery_schedule JSONB DEFAULT '[]'::jsonb,
    status TEXT CHECK (status IN ('active', 'fully_recovered', 'cancelled')) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    basis TEXT CHECK (basis IN ('event_revenue', 'event_profit', 'payment_collected')) NOT NULL,
    percent DECIMAL(6, 2) NOT NULL DEFAULT 0,
    slabs JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('performance', 'festival', 'referral', 'custom')) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    formula TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    payroll_month TEXT NOT NULL,
    staff_filter JSONB DEFAULT '[]'::jsonb,
    gross_total DECIMAL(12, 2) DEFAULT 0,
    deduction_total DECIMAL(12, 2) DEFAULT 0,
    net_total DECIMAL(12, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
    approved_by UUID REFERENCES profiles(id),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id),
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    earning_total DECIMAL(12, 2) DEFAULT 0,
    deduction_total DECIMAL(12, 2) DEFAULT 0,
    net_pay DECIMAL(12, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- BILLING / MONEY
-- ================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no TEXT NOT NULL UNIQUE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES contacts(id),
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    cgst DECIMAL(12, 2) DEFAULT 0,
    sgst DECIMAL(12, 2) DEFAULT 0,
    igst DECIMAL(12, 2) DEFAULT 0,
    round_off DECIMAL(12, 2) DEFAULT 0,
    tds DECIMAL(12, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    amount_due DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_mode TEXT CHECK (tax_mode IN ('none', 'gst')) DEFAULT 'none',
    status TEXT CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    pdf_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn TEXT,
    qty INTEGER DEFAULT 1,
    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_via TEXT CHECK (paid_via IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card')),
    paid_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
    reference TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_event BOOLEAN DEFAULT FALSE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- payments ALTER (add invoice/staff refs)
ALTER TABLE payments ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN staff_payroll_id UUID REFERENCES payroll_entries(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN party_type TEXT CHECK (party_type IN ('client', 'vendor', 'staff', 'other'));

-- ================================================================
-- STOCK MOVEMENT LEDGER
-- ================================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement TEXT NOT NULL CHECK (movement IN ('purchase', 'rent_in', 'rent_out', 'event_pickup', 'event_return', 'transfer', 'adjust', 'damage', 'retire', 'maintenance')),
    quantity INTEGER NOT NULL,
    running_balance INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    party_id UUID REFERENCES contacts(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ================================================================
-- NOTIFICATIONS & AUDIT
-- ================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'alert')) DEFAULT 'info',
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SYSTEM SETTINGS (existing)
-- ================================================================
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS default_tax_mode TEXT CHECK (default_tax_mode IN ('none', 'gst')) DEFAULT 'none';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'Q';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_item_categories_parent ON item_categories(parent_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_unique_code ON inventory_items(unique_code);
CREATE INDEX idx_inventory_location ON inventory_items(location_id);
CREATE INDEX idx_inventory_company ON inventory_items(company);
CREATE INDEX idx_inventory_type ON inventory_items(item_type);
CREATE INDEX idx_pricing_item ON pricing_rates(inventory_item_id);
CREATE INDEX idx_pricing_rental_type ON pricing_rates(rental_type);
CREATE INDEX idx_special_rates_dates ON special_rates(start_date, end_date);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_events_client ON events(client_id);
CREATE INDEX idx_events_date ON events(start_datetime);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_items_event ON event_items(event_id);
CREATE INDEX idx_event_items_item ON event_items(inventory_item_id);
CREATE INDEX idx_event_items_status ON event_items(status);
CREATE INDEX idx_event_items_dates ON event_items(inventory_item_id, rental_start_date, rental_end_date);
CREATE INDEX idx_event_staff_event ON event_staff(event_id);
CREATE INDEX idx_event_tasks_event ON event_tasks(event_id);
CREATE INDEX idx_rentals_party ON rental_contracts(party_id);
CREATE INDEX idx_rentals_event ON rental_contracts(event_id);
CREATE INDEX idx_rentals_direction ON rental_contracts(direction, status);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX idx_payroll_period ON payroll_runs(payroll_month);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_event ON invoices(event_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ================================================================
-- TRIGGERS (updated_at)
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_locations_updated_at BEFORE UPDATE ON item_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_serials_updated_at BEFORE UPDATE ON item_serials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rates_updated_at BEFORE UPDATE ON pricing_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_rates_updated_at BEFORE UPDATE ON special_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_items_updated_at BEFORE UPDATE ON event_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_staff_updated_at BEFORE UPDATE ON event_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_tasks_updated_at BEFORE UPDATE ON event_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_expenses_updated_at BEFORE UPDATE ON event_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_contracts_updated_at BEFORE UPDATE ON rental_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_contract_items_updated_at BEFORE UPDATE ON rental_contract_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_advances_updated_at BEFORE UPDATE ON staff_advances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bonuses_updated_at BEFORE UPDATE ON bonuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON payroll_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_movements_updated_at BEFORE UPDATE ON stock_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_log_updated_at BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('system-assets', 'system-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-documents', 'event-documents', true) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SEED: default settings
-- ================================================================
INSERT INTO system_settings (system_name, system_short_name, owner_name, currency_symbol, default_tax_mode, currency)
VALUES ('Events Management System', 'EMS', 'System Owner', '₹', 'none', 'INR')
ON CONFLICT DO NOTHING;
