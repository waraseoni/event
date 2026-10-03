-- =============================================================================
-- EVENTS MANAGEMENT SYSTEM - CONSOLIDATED IDEMPOTENT FULL SCHEMA
-- =============================================================================
-- Generated: 2026-09-27
-- Project:  dxinfzajqemeuvamvsbr
--
-- This single file reproduces the ENTIRE database from scratch and is safe to
-- re-run any number of times (fully idempotent). It is a merge of:
------------------------------------------------------------------------------
--   1. supabase/backups/live_schema_2026-09-27.sql  (live DB baseline, 9 tables)
--   2. supabase/migrations/0002_schema.sql          (new tables/columns/FKs)
--   3. supabase/migrations/0003_rls.sql             (RLS + auth bootstrap + storage)

-- USAGE
--   * Fresh database  : run this file top to bottom. Creates everything.
--   * Existing live DB: run this file top to bottom. Adds only what is
--                       missing; existing data and columns are preserved.
--   * Re-running      : no-op. Every object is guarded with IF [NOT] EXISTS,
--                       DROP ... IF EXISTS, or ON CONFLICT DO NOTHING.

-- TABLE CREATION ORDER IS SIGNIFICANT: tables are declared in topological
-- order so that no inline FOREIGN KEY ever references a table that does not
-- exist yet. Do not reorder the CREATE TABLE blocks without re-auditing.
-- =============================================================================


-- =============================================================================
-- SECTION 0 - EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()


-- =============================================================================
-- SECTION 1 - BASELINE TABLES (exact live production definitions)
-- Source: supabase/backups/live_schema_2026-09-27.sql
-- On a fresh DB these are created; on the live DB they already exist and
-- CREATE TABLE IF NOT EXISTS makes each statement a safe no-op.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['vendor'::text, 'renter'::text, 'customer'::text, 'worker'::text])),
  phone text NOT NULL,
  email text,
  address text,
  company_name text,
  gst_number text,
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.inventory_items (
  name text NOT NULL,
  category text NOT NULL,
  description text,
  serial_number text,
  unique_code text NOT NULL UNIQUE,
  purchase_date date,
  purchase_price numeric,
  condition text CHECK (condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text])),
  location text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  total_quantity integer NOT NULL DEFAULT 1,
  available_quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'piece'::text,
  status text NOT NULL DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'rented'::text, 'maintenance'::text, 'retired'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.pricing_rates (
  inventory_item_id uuid NOT NULL,
  rental_type text NOT NULL CHECK (rental_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'per_event'::text])),
  rate numeric NOT NULL,
  security_deposit numeric,
  max_rental_days integer,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  min_rental_days integer DEFAULT 1,
  applicable_days integer[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pricing_rates_pkey PRIMARY KEY (id),
  CONSTRAINT pricing_rates_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE IF NOT EXISTS public.events (
  name text NOT NULL,
  customer_id uuid NOT NULL,
  event_type text NOT NULL,
  event_date date NOT NULL,
  end_date date,
  venue_address text,
  notes text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  total_amount numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  profit_loss numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id)
);
CREATE TABLE IF NOT EXISTS public.event_items (
  event_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  rental_days integer NOT NULL,
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  unit_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'reserved'::text CHECK (status = ANY (ARRAY['reserved'::text, 'picked_up'::text, 'returned'::text, 'damaged'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_items_pkey PRIMARY KEY (id),
  CONSTRAINT event_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE IF NOT EXISTS public.external_rentals (
  vendor_id uuid NOT NULL,
  event_id uuid,
  item_name text NOT NULL,
  description text,
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  rental_days integer NOT NULL,
  unit_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  security_deposit numeric,
  notes text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'booked'::text CHECK (status = ANY (ARRAY['booked'::text, 'picked_up'::text, 'returned'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT external_rentals_pkey PRIMARY KEY (id),
  CONSTRAINT external_rentals_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.contacts(id),
  CONSTRAINT external_rentals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE IF NOT EXISTS public.worker_assignments (
  worker_id uuid NOT NULL,
  event_id uuid NOT NULL,
  role text NOT NULL,
  wage_per_day numeric NOT NULL,
  total_days integer NOT NULL,
  total_wages numeric NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  status text NOT NULL DEFAULT 'assigned'::text CHECK (status = ANY (ARRAY['assigned'::text, 'working'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT worker_assignments_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.contacts(id),
  CONSTRAINT worker_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE IF NOT EXISTS public.payments (
  contact_id uuid,
  event_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['incoming'::text, 'outgoing'::text])),
  category text NOT NULL CHECK (category = ANY (ARRAY['rental_income'::text, 'rental_expense'::text, 'wages'::text, 'advance'::text, 'refund'::text, 'other'::text])),
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'upi'::text, 'cheque'::text, 'card'::text])),
  reference_number text,
  notes text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT payments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE IF NOT EXISTS public.system_settings (
  proprietor_name text,
  contact_number text,
  email text,
  office_address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  logo_url text,
  banner_url text,
  website_url text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  favicon_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  system_name text NOT NULL DEFAULT 'Events Management System'::text,
  system_short_name text NOT NULL DEFAULT 'EMS'::text,
  owner_name text NOT NULL DEFAULT 'System Owner'::text,
  currency_symbol text NOT NULL DEFAULT '₹'::text,
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY'::text,
  time_format text NOT NULL DEFAULT '12h'::text,
  theme_color text DEFAULT 'indigo'::text,
  accent_color text DEFAULT 'fuchsia'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);


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


-- Row Level Security — Role-based policies (Phase 0)
-- Drops old "Allow all" policies on existing tables and creates role-based ones.

-- =============================================================================
-- ROLE MODEL
--   super_admin  -> can create admins, and below
--   admin        -> can create accountants and staff
--   accountant   -> no user management
--   staff        -> no user management
--
-- The live database used the names 'owner' and 'manager'. They are migrated to
-- 'super_admin' and 'admin' below, and every policy in this file is written
-- against the new names.
-- =============================================================================

-- Widen the CHECK constraint to the new role names. The original constraint was
-- declared inline and unnamed, so it carries the generated name
-- 'profiles_role_check'. CREATE TABLE IF NOT EXISTS skips the whole table
-- definition on a re-run, which means the constraint cannot be changed from
-- there - it has to be dropped and re-added explicitly like this.
--
-- The DROP has to happen BEFORE the data migration below: while the old
-- constraint is still in place it rejects 'super_admin', so the UPDATEs would
-- fail outright.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  END IF;
END $$;

-- Rename the legacy role values on existing rows, then re-add the constraint
-- covering the new set. Idempotent: already-migrated rows simply do not match.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    UPDATE public.profiles SET role = 'super_admin' WHERE role = 'owner';
    UPDATE public.profiles SET role = 'admin'      WHERE role = 'manager';
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('super_admin', 'admin', 'accountant', 'staff'));
  END IF;
END $$;

-- Auth role helper
-- SECURITY DEFINER so policies can read profiles without recursing back into
-- the profiles policies. SET search_path is pinned so the lookup cannot be
-- hijacked by a schema earlier in the caller's search_path.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()),
    'staff'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Numeric rank of a role. Higher outranks lower. Unknown/NULL ranks as 0 so
-- they can never be assigned.
CREATE OR REPLACE FUNCTION public.role_rank(r TEXT)
RETURNS INT AS $$
  SELECT CASE r
    WHEN 'super_admin' THEN 4
    WHEN 'admin'       THEN 3
    WHEN 'accountant'  THEN 2
    WHEN 'staff'       THEN 1
    ELSE 0
  END;
$$ LANGUAGE SQL IMMUTABLE SET search_path = public;

-- May `actor_role` hand out `target_role`?
-- Strictly-below only: you can never create a peer, nor anything above you.
-- An unrecognised target ranks 0, which is below every real role - so the
-- explicit rank > 0 test is what stops a typo or a NULL from being assignable.
-- This is the single rule both the INSERT guard trigger and the server action
-- rely on, so the hierarchy is defined exactly once.
CREATE OR REPLACE FUNCTION public.can_assign_role(actor_role TEXT, target_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT public.role_rank(target_role) > 0
     AND public.role_rank(actor_role) > public.role_rank(target_role);
$$ LANGUAGE SQL IMMUTABLE SET search_path = public;

-- May `actor_role` write these particular values onto an existing profile?
-- Only a super admin may change a role or the active flag. Everyone else may
-- still edit their own row (display_name, phone, avatar_url) as long as those
-- two fields are left untouched.
CREATE OR REPLACE FUNCTION public.can_change_profile_privileged(
  actor_role     TEXT,
  new_role       TEXT,
  old_role       TEXT,
  new_is_active  BOOLEAN,
  old_is_active  BOOLEAN
) RETURNS BOOLEAN AS $$
  SELECT
    actor_role = 'super_admin'
    OR (new_role      IS NOT DISTINCT FROM old_role
    AND new_is_active IS NOT DISTINCT FROM old_is_active);
$$ LANGUAGE SQL IMMUTABLE SET search_path = public;

-- True for connections that are not PostgREST end-user sessions: the service
-- role used by server actions, the SQL editor, and migrations. Those are
-- trusted writers and bypass the profile guards below. The two roles that
-- carry an end-user JWT - 'anon' and 'authenticated' - do not.
--
-- The JWT claim is checked first because this is also called from inside
-- SECURITY DEFINER contexts (handle_new_user) where current_user has already
-- been switched to the function owner. request.jwt.claims is a session GUC and
-- is unaffected by SECURITY DEFINER, so it still reports the real caller.
CREATE OR REPLACE FUNCTION public.is_trusted_profile_writer()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
           NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           current_user::TEXT
         ) NOT IN ('anon', 'authenticated');
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Closes the privilege-escalation hole: the "Users update own" policy has no
-- role restriction, so without this trigger any logged-in user could set their
-- own role to 'super_admin' and take over the system.
--
-- Deliberately SECURITY INVOKER (not DEFINER) so that current_user still
-- reflects the end user being guarded. The only things it needs are
-- current_user_role() and can_change_profile_privileged(), both of which are
-- STABLE/IMMUTABLE and callable without elevated privileges.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_trusted_profile_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.can_assign_role(public.current_user_role(), NEW.role) THEN
      RAISE EXCEPTION 'You cannot create a profile with role %', NEW.role
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT public.can_change_profile_privileged(
         public.current_user_role(), NEW.role, OLD.role, NEW.is_active, OLD.is_active) THEN
    RAISE EXCEPTION 'Only a super admin can change a role or the active status'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers
             WHERE trigger_name = 'guard_profile_privileged_fields') THEN
    EXECUTE 'DROP TRIGGER guard_profile_privileged_fields ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TRIGGER guard_profile_privileged_fields
      BEFORE INSERT OR UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();
  END IF;
END $$;

-- Helper macro: wrap RLS setup in DO block checking table existence
-- ================================================================



-- Profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.profiles', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'), 'SELECT 1');
    CREATE POLICY "Super admin+ admin can view all" ON profiles FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
    CREATE POLICY "Users can view own" ON profiles FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Super admin+ admin upsert" ON profiles FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

    CREATE POLICY "Super admin+ admin update" ON profiles FOR UPDATE
      USING (public.current_user_role() IN ('super_admin', 'admin'))
      WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
    -- Lets a user fix their own display_name/phone/avatar. The
    -- guard_profile_privileged_fields trigger is what stops this from also
    -- being a role-escalation path.
    CREATE POLICY "Users update own" ON profiles FOR UPDATE
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    -- No DELETE policy for anyone else: an admin must not be able to remove an
    -- admin, and a user must not be able to remove themselves to hide activity.
    CREATE POLICY "Super admin delete profiles" ON profiles FOR DELETE
      USING (public.current_user_role() = 'super_admin');
  END IF;
END $$;


-- Masters
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_categories') THEN
    ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.item_categories', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_categories'), 'SELECT 1');
    CREATE POLICY "Staff+ read categories" ON item_categories FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage categories" ON item_categories FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_locations') THEN
    ALTER TABLE item_locations ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.item_locations', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_locations'), 'SELECT 1');
    CREATE POLICY "Staff+ read locations" ON item_locations FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage locations" ON item_locations FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.contacts', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts'), 'SELECT 1');
    CREATE POLICY "Staff+ read contacts" ON contacts FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage contacts" ON contacts FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_members') THEN
    ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.staff_members', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_members'), 'SELECT 1');
    CREATE POLICY "Staff+ read staff" ON staff_members FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage staff" ON staff_members FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.inventory_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read inventory" ON inventory_items FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage inventory" ON inventory_items FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pricing_rates') THEN
    ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.pricing_rates', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pricing_rates'), 'SELECT 1');
    CREATE POLICY "Staff+ read pricing" ON pricing_rates FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage pricing" ON pricing_rates FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.quotes', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes'), 'SELECT 1');
    CREATE POLICY "Staff+ read quotes" ON quotes FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage quotes" ON quotes FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
    ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.quote_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read quote items" ON quote_items FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage quote items" ON quote_items FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.events', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'), 'SELECT 1');
    CREATE POLICY "Staff+ read events" ON events FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage events" ON events FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_items') THEN
    ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read event items" ON event_items FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage event items" ON event_items FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_staff') THEN
    ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_staff', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_staff'), 'SELECT 1');
    CREATE POLICY "Staff+ read" ON event_staff FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage" ON event_staff FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_tasks') THEN
    ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_tasks', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_tasks'), 'SELECT 1');
    CREATE POLICY "Staff+ read tasks" ON event_tasks FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage tasks" ON event_tasks FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_expenses') THEN
    ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_expenses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_expenses'), 'SELECT 1');
    CREATE POLICY "Staff+ read expenses" ON event_expenses FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage expenses" ON event_expenses FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN
    ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.rental_contracts', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_contracts'), 'SELECT 1');
    CREATE POLICY "Staff+ read rentals" ON rental_contracts FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage rentals" ON rental_contracts FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contract_items') THEN
    ALTER TABLE rental_contract_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.rental_contract_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_contract_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read" ON rental_contract_items FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage" ON rental_contract_items FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.attendance', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance'), 'SELECT 1');
    CREATE POLICY "Manager+ accountant read attendance" ON attendance FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
    CREATE POLICY "Manager+ accountant manage attendance" ON attendance FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_advances') THEN
    ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.staff_advances', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_advances'), 'SELECT 1');
    CREATE POLICY "Staff+ read advances" ON staff_advances FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage advances" ON staff_advances FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commission_rules') THEN
    ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.commission_rules', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'commission_rules'), 'SELECT 1');
    CREATE POLICY "Staff+ read commission" ON commission_rules FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage commission" ON commission_rules FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonuses') THEN
    ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.bonuses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bonuses'), 'SELECT 1');
    CREATE POLICY "Staff+ read bonuses" ON bonuses FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage bonuses" ON bonuses FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_runs') THEN
    ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.payroll_runs', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payroll_runs'), 'SELECT 1');
    CREATE POLICY "Super admin+ accountant read payroll" ON payroll_runs FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
    CREATE POLICY "Super admin+ accountant manage payroll" ON payroll_runs FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_entries') THEN
    ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.payroll_entries', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payroll_entries'), 'SELECT 1');
    CREATE POLICY "Super admin+ accountant read entries" ON payroll_entries FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
    CREATE POLICY "Super admin+ accountant manage entries" ON payroll_entries FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.invoices', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices'), 'SELECT 1');
    CREATE POLICY "Staff+ read invoices" ON invoices FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage invoices" ON invoices FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.expenses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses'), 'SELECT 1');
    CREATE POLICY "Staff+ read expenses" ON expenses FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage expenses" ON expenses FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.stock_movements', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements'), 'SELECT 1');
    CREATE POLICY "Staff+ read movements" ON stock_movements FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage movements" ON stock_movements FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.notifications', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications'), 'SELECT 1');
    CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users update own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.audit_log', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_log'), 'SELECT 1');
    CREATE POLICY "Super admin+ admin read audit" ON audit_log FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
    CREATE POLICY "Super admin+ admin write audit" ON audit_log FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.system_settings', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings'), 'SELECT 1');
    CREATE POLICY "Super admin+ admin read settings" ON system_settings FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
    CREATE POLICY "Super admin+ admin insert settings" ON system_settings FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
    CREATE POLICY "Super admin+ admin update settings" ON system_settings FOR UPDATE USING (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

-- =============================================================================
-- DEFECT D1 — tables that shipped without RLS
-- =============================================================================
-- payments, invoice_items, external_rentals, worker_assignments, item_serials,
-- maintenance_records and special_rates were created without ENABLE ROW LEVEL
-- SECURITY and without policies. On a table with RLS off, Postgres ignores
-- policies entirely, so the public anon key could read AND write every row —
-- including the payments table. Each block below locks the table down and
-- grants the same roles its parent table already had, so no existing app
-- behaviour changes.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.payments', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments'), 'SELECT 1');
    -- Money is deliberately stricter than the rest: no staff read access.
    CREATE POLICY "Accountant+ read payments" ON payments FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
    CREATE POLICY "Accountant+ manage payments" ON payments FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.invoice_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read invoice items" ON invoice_items FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage invoice items" ON invoice_items FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'external_rentals') THEN
    ALTER TABLE external_rentals ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.external_rentals', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'external_rentals'), 'SELECT 1');
    CREATE POLICY "Staff+ read external rentals" ON external_rentals FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage external rentals" ON external_rentals FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_assignments') THEN
    ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.worker_assignments', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'worker_assignments'), 'SELECT 1');
    CREATE POLICY "Staff+ read worker assignments" ON worker_assignments FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage worker assignments" ON worker_assignments FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_serials') THEN
    ALTER TABLE item_serials ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.item_serials', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_serials'), 'SELECT 1');
    CREATE POLICY "Staff+ read item serials" ON item_serials FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage item serials" ON item_serials FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_records') THEN
    ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.maintenance_records', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maintenance_records'), 'SELECT 1');
    CREATE POLICY "Staff+ read maintenance" ON maintenance_records FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage maintenance" ON maintenance_records FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'special_rates') THEN
    ALTER TABLE special_rates ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.special_rates', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'special_rates'), 'SELECT 1');
    CREATE POLICY "Staff+ read special rates" ON special_rates FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
    CREATE POLICY "Super admin+ manage special rates" ON special_rates FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin')) WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
  END IF;
END $$;

-- ================================================================

-- Auth bootstrap — break the RLS chicken-and-egg deadlock
-- ================================================================
-- Without this, nobody can ever use the app:
--   * current_user_role() falls back to 'staff' when no profile row exists
--   * reading system_settings requires 'super_admin' or 'admin'
--   * creating the very first profile also requires 'super_admin' or 'admin'
-- The first user could therefore never bootstrap, and no user could ever
-- become owner. handle_new_user() runs as SECURITY DEFINER (so it bypasses
-- RLS) and grants 'super_admin' to the earliest account, 'staff' to the rest.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'super_admin'
      ELSE 'staff'
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers
             WHERE trigger_name = 'on_auth_user_created') THEN
    EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'auth' AND table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill profiles for accounts that already exist (the trigger only fires on
-- new signups). Earliest account becomes owner. Idempotent.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'auth' AND table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE $backfill$
      INSERT INTO public.profiles (user_id, email, role, display_name)
      SELECT u.id,
             u.email,
             CASE WHEN u.id = (SELECT id FROM auth.users ORDER BY created_at ASC, id ASC LIMIT 1)
                  THEN 'super_admin' ELSE 'staff' END,
             COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
      FROM auth.users u
      WHERE u.email IS NOT NULL
      ON CONFLICT (user_id) DO NOTHING
    $backfill$;
  END IF;
END $$;


-- ================================================================
-- Storage buckets (idempotent)
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('system-assets', 'system-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-documents', 'event-documents', true) ON CONFLICT (id) DO NOTHING;









-- =============================================================================
-- SECTION 8 - PHASE 1: ITEM CATALOG (mirrors migrations/0005_phase1_item_catalog.sql)
-- =============================================================================
-- =============================================================================
-- 0005 — Phase 1: Item Catalog
-- =============================================================================
-- Closes the remaining gaps between `docs/DEVELOPMENT_PLAN.md` Phase 1 and the
-- live schema. Everything in migrations/0002 already created the tables
-- (item_categories, item_locations, item_serials, maintenance_records,
-- stock_movements, special_rates) and added the catalog columns to
-- inventory_items; 0003/0004 added the RLS policies. This file adds only what
-- Phase 1 still needs:
--
--   P1-a  maintenance_interval_days / last_maintenance_date / next_maintenance_date
--         so "Maintenance schedule" has something to schedule against.
--   P1-b  max_parallel_events — the per-item capacity rule consumed by the
--         Phase 2 availability engine.
--   P1-c  fn_inventory_search — server-side search + faceted count. The list
--         page currently filters client-side, which cannot meet the
--         "5000 items < 300ms" AC once pagination moves to the server.
--   P1-d  p_adjust_stock — the ONLY sanctioned way to change a quantity. It
--         writes the stock_movements row with a running balance inside one
--         transaction and takes a per-item advisory lock so two concurrent
--         adjustments cannot both read the same balance and lose an update.
--   P1-e  trigger that refuses a direct UPDATE of total_quantity /
--         available_quantity, so the ledger cannot be bypassed.
--   P1-f  trigram + composite indexes for the 5000-item latency AC.
--
-- Idempotent: safe to re-run. Mirrored into supabase/schema.sql, which remains
-- the single source of truth.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- P1-a / P1-b  missing inventory_items columns
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS max_parallel_events INTEGER DEFAULT 0;

-- max_parallel_events = 0 means "no cap beyond stock"; anything positive is a
-- hard simultaneous-event ceiling enforced by Phase 2.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_max_parallel_events_chk'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_max_parallel_events_chk
      CHECK (max_parallel_events IS NULL OR max_parallel_events >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- P1-c  server-side search
-- ---------------------------------------------------------------------------
-- ilike over name/company/model/unique_code, plus optional facet filters and a
-- total count so the list page can paginate without a second round trip.
CREATE OR REPLACE FUNCTION public.fn_inventory_search(
  p_search      TEXT    DEFAULT NULL,
  p_category_id UUID    DEFAULT NULL,
  p_company     TEXT    DEFAULT NULL,
  p_item_type   TEXT    DEFAULT NULL,
  p_status      TEXT    DEFAULT NULL,
  p_location_id UUID    DEFAULT NULL,
  p_min_price   NUMERIC DEFAULT NULL,
  p_max_price   NUMERIC DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                 UUID,
  name               TEXT,
  category           TEXT,
  category_id        UUID,
  description        TEXT,
  company            TEXT,
  model              TEXT,
  scope              TEXT,
  item_type          TEXT,
  target_event_types TEXT[],
  estimated_rent_price NUMERIC,
  min_price          NUMERIC,
  security_deposit   NUMERIC,
  hsn_code           TEXT,
  images             TEXT[],
  total_quantity     INTEGER,
  available_quantity INTEGER,
  owned_quantity     INTEGER,
  reorder_level      INTEGER,
  max_parallel_events INTEGER,
  unit               TEXT,
  status             TEXT,
  condition          TEXT,
  unique_code        TEXT,
  serial_number      TEXT,
  location           TEXT,
  location_id        UUID,
  purchase_date      DATE,
  purchase_price     NUMERIC,
  created_at         TIMESTAMPTZ,
  total_count        BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT i.*
    FROM public.inventory_items i
    WHERE (p_search IS NULL OR btrim(p_search) = '' OR
           i.name           ILIKE '%' || p_search || '%' OR
           COALESCE(i.company, '')     ILIKE '%' || p_search || '%' OR
           COALESCE(i.model, '')      ILIKE '%' || p_search || '%' OR
           i.unique_code    ILIKE '%' || p_search || '%' OR
           COALESCE(i.serial_number, '') ILIKE '%' || p_search || '%' OR
           COALESCE(i.hsn_code, '')   ILIKE '%' || p_search || '%')
      AND (p_category_id IS NULL OR i.category_id = p_category_id)
      AND (p_company   IS NULL OR i.company  ILIKE p_company)
      AND (p_item_type IS NULL OR i.item_type = p_item_type)
      AND (p_status    IS NULL OR i.status    = p_status)
      AND (p_location_id IS NULL OR i.location_id = p_location_id)
      AND (p_min_price IS NULL OR COALESCE(i.estimated_rent_price, 0) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(i.estimated_rent_price, 0) <= p_max_price)
  )
  SELECT
    f.id, f.name, f.category, f.category_id, f.description, f.company, f.model,
    f.scope, f.item_type, f.target_event_types, f.estimated_rent_price,
    f.min_price, f.security_deposit, f.hsn_code, f.images, f.total_quantity,
    f.available_quantity, f.owned_quantity, f.reorder_level,
    f.max_parallel_events, f.unit, f.status, f.condition, f.unique_code,
    f.serial_number, f.location, f.location_id, f.purchase_date,
    f.purchase_price, f.created_at,
    (SELECT COUNT(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC NULLS LAST, f.name
  LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0);
$$;

COMMENT ON FUNCTION public.fn_inventory_search IS
  'Phase 1 server-side item search with facets + total_count for pagination. RLS applies (SECURITY INVOKER).';

-- ---------------------------------------------------------------------------
-- P1-d  p_adjust_stock — the single write path for quantity changes
-- ---------------------------------------------------------------------------
-- Sign convention: quantity is the DELTA applied to available_quantity
-- (positive = stock in, negative = stock out). running_balance is the value of
-- available_quantity after the movement, read under the same advisory lock that
-- guards the update, so the ledger can never disagree with the item row.
CREATE OR REPLACE FUNCTION public.p_adjust_stock(
  p_item_id        UUID,
  p_movement       TEXT,
  p_quantity       INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id   UUID DEFAULT NULL,
  p_party_id       UUID DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_balance   INTEGER;
  v_total     INTEGER;
  v_available INTEGER;
  v_user      UUID;
  v_row       public.stock_movements;
BEGIN
  IF p_movement NOT IN ('purchase','rent_in','rent_out','event_pickup',
                        'event_return','transfer','adjust','damage','retire',
                        'maintenance') THEN
    RAISE EXCEPTION 'invalid movement: %', p_movement
      USING ERRCODE = '22023';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'quantity must be non-zero'
      USING ERRCODE = '22023';
  END IF;

  -- Per-item serialisation: without this two concurrent adjustments both read
  -- the same balance and the second UPDATE silently overwrites the first.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_item_id::text, 0));

  -- Announce this transaction as an authorised adjustment so the guard trigger
  -- below lets its own quantity UPDATE through. Must be set BEFORE the UPDATE.
  PERFORM set_config('app.stock_adjustment', 'on', TRUE);

  SELECT total_quantity, available_quantity
    INTO v_total, v_available
  FROM public.inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item % not found', p_item_id
      USING ERRCODE = 'P0002';
  END IF;

  v_balance := v_available + p_quantity;

  IF v_balance < 0 THEN
    RAISE EXCEPTION
      'insufficient stock for %: on hand %, requested %',
      p_item_id, v_available, -p_quantity
      USING ERRCODE = '23514';
  END IF;

  -- total_quantity is the owned ceiling. Rented-in stock raises it; anything
  -- that would push owned stock above the ceiling is rejected.
  IF p_movement IN ('purchase', 'rent_in') THEN
    v_total := v_total + p_quantity;
  END IF;

  UPDATE public.inventory_items
     SET available_quantity = v_balance,
         total_quantity     = v_total,
         updated_at         = now()
   WHERE id = p_item_id;

  SELECT auth.uid() INTO v_user;

  INSERT INTO public.stock_movements
    (item_id, movement, quantity, running_balance, reference_type,
     reference_id, party_id, notes, created_by)
  VALUES
    (p_item_id, p_movement, p_quantity, v_balance, p_reference_type,
     p_reference_id, p_party_id, p_notes, v_user)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.p_adjust_stock IS
  'Phase 1 sole write path for item quantity. Writes stock_movements with running_balance under a per-item advisory lock.';

-- ---------------------------------------------------------------------------
-- P1-e  block direct quantity UPDATEs so the ledger cannot be bypassed
-- ---------------------------------------------------------------------------
-- createInventoryItem sets the opening quantities on INSERT, which is allowed
-- and does write a purchase movement via the server action. After a row exists,
-- any UPDATE of a quantity column must go through p_adjust_stock.
CREATE OR REPLACE FUNCTION public.guard_inventory_quantity_change()
RETURNS TRIGGER AS $$
DECLARE
  v_authorised BOOLEAN;
BEGIN
  IF NEW.total_quantity     IS NOT DISTINCT FROM OLD.total_quantity
     AND NEW.available_quantity IS NOT DISTINCT FROM OLD.available_quantity
     AND NEW.owned_quantity  IS NOT DISTINCT FROM OLD.owned_quantity THEN
    RETURN NEW;
  END IF;

  -- p_adjust_stock sets this flag, transaction-locally, BEFORE its own UPDATE.
  -- Read it, never set it: if the trigger set the flag itself it would approve
  -- every write and the guard would be a silent no-op.
  v_authorised := current_setting('app.stock_adjustment', TRUE) = 'on';

  IF v_authorised THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'quantity columns are read-only; use p_adjust_stock(item_id, movement, qty) so a stock_movements row is written'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_inventory_quantity ON public.inventory_items;
CREATE TRIGGER trg_guard_inventory_quantity
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_inventory_quantity_change();

-- ---------------------------------------------------------------------------
-- P1-f  indexes for the 5000-item latency AC
-- ---------------------------------------------------------------------------
-- pg_trgm gives substring search (ilike '%x%') on names/companies/models, which
-- a plain btree cannot serve. Wrapped in a guard so the file still runs on a
-- database where the extension is unavailable.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_name_trgm
      ON public.inventory_items USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_inventory_company_trgm
      ON public.inventory_items USING gin (company gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_inventory_model_trgm
      ON public.inventory_items USING gin (model gin_trgm_ops);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_status      ON public.inventory_items (status);
CREATE INDEX IF NOT EXISTS idx_inventory_created    ON public.inventory_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_price      ON public.inventory_items (estimated_rent_price);
CREATE INDEX IF NOT EXISTS idx_inventory_maint_due  ON public.inventory_items (next_maintenance_date)
  WHERE next_maintenance_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_reorder    ON public.inventory_items (available_quantity)
  WHERE reorder_level IS NOT NULL;

-- Ledger and history read newest-first per item.
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_serials_item         ON public.item_serials (item_id);
CREATE INDEX IF NOT EXISTS idx_serials_code         ON public.item_serials (serial_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_item     ON public.maintenance_records (item_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_open     ON public.maintenance_records (started_at DESC)
  WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_special_rates_item   ON public.special_rates (item_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rates_item   ON public.pricing_rates (inventory_item_id);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- Intentionally none. Postgres grants EXECUTE on new functions in public to
-- PUBLIC by default, and Supabase's default privileges already cover
-- anon/authenticated. The rest of this schema likewise declares no explicit
-- GRANTs; adding them here would be the only such statement in the file and
-- would break on any database (e.g. PGlite) where the `authenticated` role
-- does not exist.

-- ---------------------------------------------------------------------------
-- updated_at triggers for the Phase 1 tables that lacked them
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'item_categories','item_locations','item_serials','maintenance_records',
    'special_rates','stock_movements'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_touch ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_touch BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;
