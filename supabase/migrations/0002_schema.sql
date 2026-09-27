-- Events Management System — Incremental migrations (Phase 0)
-- IMPORTANT: existing tables (contacts, inventory_items, pricing_rates, events,
-- event_items, external_rentals, worker_assignments, payments, system_settings)
-- already exist in DB. Only ALTER them and CREATE genuinely-new tables.

-- ================================================================
-- (A) ALTER EXISTING TABLES — add new columns
-- ================================================================

-- contacts
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS source TEXT;

-- inventory_items (owner ke items: company, model, scope, type, target event, rent price)
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN ('owned', 'leased')) DEFAULT 'owned';
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS target_event_types TEXT[];
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS estimated_rent_price DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS min_price DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS owned_quantity INTEGER; -- separate from available_quantity

-- pricing_rates
ALTER TABLE IF EXISTS pricing_rates ADD COLUMN IF NOT EXISTS weekend_rate DECIMAL(12, 2);
ALTER TABLE IF EXISTS pricing_rates ADD COLUMN IF NOT EXISTS slab JSONB DEFAULT '[]'::jsonb;

-- events
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS event_no TEXT UNIQUE;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS quote_id UUID;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS client_advance DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS tax_mode TEXT CHECK (tax_mode IN ('none', 'gst')) DEFAULT 'none';
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS created_by UUID;

-- event_items
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS quote_item_id UUID;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('own', 'rented_in')) DEFAULT 'own';
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS cost_line DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS pickup_datetime TIMESTAMPTZ;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS return_datetime TIMESTAMPTZ;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS picked_qty INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS returned_qty INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS event_items ADD COLUMN IF NOT EXISTS damaged_qty INTEGER DEFAULT 0;

-- worker_assignments -> add payroll fields
ALTER TABLE IF EXISTS worker_assignments ADD COLUMN IF NOT EXISTS wage_basis TEXT CHECK (wage_basis IN ('daily_wage', 'salary', 'fixed')) DEFAULT 'daily_wage';
ALTER TABLE IF EXISTS worker_assignments ADD COLUMN IF NOT EXISTS ot_hours DECIMAL(6, 2) DEFAULT 0;
ALTER TABLE IF EXISTS worker_assignments ADD COLUMN IF NOT EXISTS ot_rate DECIMAL(12, 2) DEFAULT 0;

-- payments -> add invoice/payroll linkage + party type
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS staff_payroll_id UUID;
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS party_type TEXT CHECK (party_type IN ('client', 'vendor', 'staff', 'other'));

-- system_settings -> add business config
ALTER TABLE IF EXISTS system_settings ADD COLUMN IF NOT EXISTS default_tax_mode TEXT CHECK (default_tax_mode IN ('none', 'gst')) DEFAULT 'none';
ALTER TABLE IF EXISTS system_settings ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE IF EXISTS system_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE IF EXISTS system_settings ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'Q';
ALTER TABLE IF EXISTS system_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- ================================================================
-- (B) CREATE GENUINELY-NEW TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'accountant', 'staff')) DEFAULT 'staff',
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
    icon TEXT DEFAULT 'box',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_locations (
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

CREATE TABLE IF NOT EXISTS item_serials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    serial_code TEXT NOT NULL,
    qr_code TEXT,
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good',
    status TEXT CHECK (status IN ('available', 'rented', 'maintenance', 'retired')) DEFAULT 'available',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_records (
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

CREATE TABLE IF NOT EXISTS special_rates (
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

CREATE TABLE IF NOT EXISTS quotes (
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

CREATE TABLE IF NOT EXISTS quote_items (
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

-- NOTE: staff_members must be created BEFORE event_staff / attendance /
-- staff_advances / commission_rules / bonuses / payroll_entries, because those
-- tables declare inline FKs to it. Keep this block above them.
CREATE TABLE IF NOT EXISTS staff_members (
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

CREATE TABLE IF NOT EXISTS event_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id),
    role TEXT,
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

CREATE TABLE IF NOT EXISTS event_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    assignee TEXT,
    status TEXT CHECK (status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_expenses (
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

CREATE TABLE IF NOT EXISTS rental_contracts (
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

CREATE TABLE IF NOT EXISTS rental_contract_items (
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

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'half', 'leave', 'holiday', 'weekoff')) DEFAULT 'present',
    hours DECIMAL(5, 2) DEFAULT 0,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    notes TEXT,
    marked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

CREATE TABLE IF NOT EXISTS staff_advances (
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

CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    basis TEXT CHECK (basis IN ('event_revenue', 'event_profit', 'payment_collected')) NOT NULL,
    percent DECIMAL(6, 2) NOT NULL DEFAULT 0,
    slabs JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonuses (
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

CREATE TABLE IF NOT EXISTS payroll_runs (
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

CREATE TABLE IF NOT EXISTS payroll_entries (
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

CREATE TABLE IF NOT EXISTS invoices (
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

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
    hsn TEXT,
    qty INTEGER DEFAULT 1,
    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
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

CREATE TABLE IF NOT EXISTS stock_movements (
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

CREATE TABLE IF NOT EXISTS notifications (
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

CREATE TABLE IF NOT EXISTS audit_log (
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
-- (B+) Foreign Key Constraints — add after all tables exist
-- ================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE IF EXISTS inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_category;
    ALTER TABLE IF EXISTS inventory_items ADD CONSTRAINT fk_inventory_category FOREIGN KEY (category_id) REFERENCES item_categories(id);
    ALTER TABLE IF EXISTS inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_location;
    ALTER TABLE IF EXISTS inventory_items ADD CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES item_locations(id);
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE IF EXISTS events DROP CONSTRAINT IF EXISTS fk_events_quote;
    ALTER TABLE IF EXISTS events ADD CONSTRAINT fk_events_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
    ALTER TABLE IF EXISTS events DROP CONSTRAINT IF EXISTS fk_events_created_by;
    ALTER TABLE IF EXISTS events ADD CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_items') THEN
    ALTER TABLE IF EXISTS event_items DROP CONSTRAINT IF EXISTS fk_event_items_quote;
    ALTER TABLE IF EXISTS event_items ADD CONSTRAINT fk_event_items_quote FOREIGN KEY (quote_item_id) REFERENCES quote_items(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS fk_payments_invoice;
    ALTER TABLE IF EXISTS payments ADD CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
    ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS fk_payments_payroll;
    ALTER TABLE IF EXISTS payments ADD CONSTRAINT fk_payments_payroll FOREIGN KEY (staff_payroll_id) REFERENCES payroll_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ================================================================
-- (C) INDEXES for new tables — wrapped in DO blocks
-- ================================================================
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id); CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_categories') THEN CREATE INDEX IF NOT EXISTS idx_item_categories_parent ON item_categories(parent_id); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id); CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory_items(company); CREATE INDEX IF NOT EXISTS idx_inventory_item_type ON inventory_items(item_type); CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location_id); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pricing_rates') THEN CREATE INDEX IF NOT EXISTS idx_pricing_slab ON pricing_rates(slab); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'special_rates') THEN CREATE INDEX IF NOT EXISTS idx_special_rates_dates ON special_rates(start_date, end_date); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id); CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN CREATE INDEX IF NOT EXISTS idx_events_quote ON events(quote_id); CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_staff') THEN CREATE INDEX IF NOT EXISTS idx_event_staff_event ON event_staff(event_id); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_tasks') THEN CREATE INDEX IF NOT EXISTS idx_event_tasks_event ON event_tasks(event_id); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_expenses') THEN CREATE INDEX IF NOT EXISTS idx_event_expenses_event ON event_expenses(event_id); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN CREATE INDEX IF NOT EXISTS idx_rentals_party ON rental_contracts(party_id); CREATE INDEX IF NOT EXISTS idx_rentals_event ON rental_contracts(event_id); CREATE INDEX IF NOT EXISTS idx_rentals_direction ON rental_contracts(direction, status); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_runs') THEN CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_runs(payroll_month); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id); CREATE INDEX IF NOT EXISTS idx_invoices_event ON invoices(event_id); CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status); END IF; END $$;

-- ================================================================
-- (D) updated_at triggers for new tables
-- ================================================================
-- NOTE: stock_movements, notifications and audit_log are append-only logs
-- with no updated_at column, so they intentionally have no updated_at
-- trigger (the trigger body assigns NEW.updated_at and would fail at
-- runtime on those tables).
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';
  IF FOUND THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_categories') THEN DROP TRIGGER IF EXISTS update_item_categories_updated_at ON item_categories; CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_locations') THEN DROP TRIGGER IF EXISTS update_item_locations_updated_at ON item_locations; CREATE TRIGGER update_item_locations_updated_at BEFORE UPDATE ON item_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_serials') THEN DROP TRIGGER IF EXISTS update_item_serials_updated_at ON item_serials; CREATE TRIGGER update_item_serials_updated_at BEFORE UPDATE ON item_serials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_records') THEN DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON maintenance_records; CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'special_rates') THEN DROP TRIGGER IF EXISTS update_special_rates_updated_at ON special_rates; CREATE TRIGGER update_special_rates_updated_at BEFORE UPDATE ON special_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes; CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN DROP TRIGGER IF EXISTS update_quote_items_updated_at ON quote_items; CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_staff') THEN DROP TRIGGER IF EXISTS update_event_staff_updated_at ON event_staff; CREATE TRIGGER update_event_staff_updated_at BEFORE UPDATE ON event_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_tasks') THEN DROP TRIGGER IF EXISTS update_event_tasks_updated_at ON event_tasks; CREATE TRIGGER update_event_tasks_updated_at BEFORE UPDATE ON event_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_expenses') THEN DROP TRIGGER IF EXISTS update_event_expenses_updated_at ON event_expenses; CREATE TRIGGER update_event_expenses_updated_at BEFORE UPDATE ON event_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN DROP TRIGGER IF EXISTS update_rental_contracts_updated_at ON rental_contracts; CREATE TRIGGER update_rental_contracts_updated_at BEFORE UPDATE ON rental_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contract_items') THEN DROP TRIGGER IF EXISTS update_rental_contract_items_updated_at ON rental_contract_items; CREATE TRIGGER update_rental_contract_items_updated_at BEFORE UPDATE ON rental_contract_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance; CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_advances') THEN DROP TRIGGER IF EXISTS update_staff_advances_updated_at ON staff_advances; CREATE TRIGGER update_staff_advances_updated_at BEFORE UPDATE ON staff_advances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commission_rules') THEN DROP TRIGGER IF EXISTS update_commission_rules_updated_at ON commission_rules; CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonuses') THEN DROP TRIGGER IF EXISTS update_bonuses_updated_at ON bonuses; CREATE TRIGGER update_bonuses_updated_at BEFORE UPDATE ON bonuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_runs') THEN DROP TRIGGER IF EXISTS update_payroll_runs_updated_at ON payroll_runs; CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_entries') THEN DROP TRIGGER IF EXISTS update_payroll_entries_updated_at ON payroll_entries; CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON payroll_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices; CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items; CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses; CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF; END $$;
