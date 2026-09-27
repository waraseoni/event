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
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'accountant', 'staff')) DEFAULT 'staff',
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

-- Auth role helper
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE user_id = auth.uid()),
    'staff'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper macro: wrap RLS setup in DO block checking table existence
-- ================================================================



-- Profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.profiles', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'), 'SELECT 1');
    CREATE POLICY "Owner+ manager can view all" ON profiles FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Users can view own" ON profiles FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Owner+ manager upsert" ON profiles FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager update" ON profiles FOR UPDATE USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Staff update own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Masters
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_categories') THEN
    ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.item_categories', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_categories'), 'SELECT 1');
    CREATE POLICY "Staff+ read categories" ON item_categories FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage categories" ON item_categories FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_locations') THEN
    ALTER TABLE item_locations ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.item_locations', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_locations'), 'SELECT 1');
    CREATE POLICY "Staff+ read locations" ON item_locations FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage locations" ON item_locations FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.contacts', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts'), 'SELECT 1');
    CREATE POLICY "Staff+ read contacts" ON contacts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage contacts" ON contacts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_members') THEN
    ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.staff_members', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_members'), 'SELECT 1');
    CREATE POLICY "Staff+ read staff" ON staff_members FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage staff" ON staff_members FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.inventory_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read inventory" ON inventory_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage inventory" ON inventory_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pricing_rates') THEN
    ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.pricing_rates', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pricing_rates'), 'SELECT 1');
    CREATE POLICY "Staff+ read pricing" ON pricing_rates FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage pricing" ON pricing_rates FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.quotes', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes'), 'SELECT 1');
    CREATE POLICY "Staff+ read quotes" ON quotes FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage quotes" ON quotes FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
    ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.quote_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read quote items" ON quote_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage quote items" ON quote_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.events', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'), 'SELECT 1');
    CREATE POLICY "Staff+ read events" ON events FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage events" ON events FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_items') THEN
    ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read event items" ON event_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage event items" ON event_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_staff') THEN
    ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_staff', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_staff'), 'SELECT 1');
    CREATE POLICY "Staff+ read" ON event_staff FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage" ON event_staff FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_tasks') THEN
    ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_tasks', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_tasks'), 'SELECT 1');
    CREATE POLICY "Staff+ read tasks" ON event_tasks FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage tasks" ON event_tasks FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_expenses') THEN
    ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.event_expenses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_expenses'), 'SELECT 1');
    CREATE POLICY "Staff+ read expenses" ON event_expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage expenses" ON event_expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN
    ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.rental_contracts', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_contracts'), 'SELECT 1');
    CREATE POLICY "Staff+ read rentals" ON rental_contracts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage rentals" ON rental_contracts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contract_items') THEN
    ALTER TABLE rental_contract_items ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.rental_contract_items', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_contract_items'), 'SELECT 1');
    CREATE POLICY "Staff+ read" ON rental_contract_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage" ON rental_contract_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.attendance', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance'), 'SELECT 1');
    CREATE POLICY "Manager+ accountant read attendance" ON attendance FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Manager+ accountant manage attendance" ON attendance FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_advances') THEN
    ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.staff_advances', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_advances'), 'SELECT 1');
    CREATE POLICY "Staff+ read advances" ON staff_advances FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage advances" ON staff_advances FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commission_rules') THEN
    ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.commission_rules', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'commission_rules'), 'SELECT 1');
    CREATE POLICY "Staff+ read commission" ON commission_rules FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage commission" ON commission_rules FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonuses') THEN
    ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.bonuses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bonuses'), 'SELECT 1');
    CREATE POLICY "Staff+ read bonuses" ON bonuses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage bonuses" ON bonuses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_runs') THEN
    ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.payroll_runs', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payroll_runs'), 'SELECT 1');
    CREATE POLICY "Owner+ accountant read payroll" ON payroll_runs FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Owner+ accountant manage payroll" ON payroll_runs FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_entries') THEN
    ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.payroll_entries', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payroll_entries'), 'SELECT 1');
    CREATE POLICY "Owner+ accountant read entries" ON payroll_entries FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Owner+ accountant manage entries" ON payroll_entries FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.invoices', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices'), 'SELECT 1');
    CREATE POLICY "Staff+ read invoices" ON invoices FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage invoices" ON invoices FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.expenses', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses'), 'SELECT 1');
    CREATE POLICY "Staff+ read expenses" ON expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage expenses" ON expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.stock_movements', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements'), 'SELECT 1');
    CREATE POLICY "Staff+ read movements" ON stock_movements FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage movements" ON stock_movements FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
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
    CREATE POLICY "Owner+ manager read audit" ON audit_log FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager write audit" ON audit_log FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    EXECUTE COALESCE((SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.system_settings', policyname), '; ')
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings'), 'SELECT 1');
    CREATE POLICY "Owner+ manager read settings" ON system_settings FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager update settings" ON system_settings FOR UPDATE USING (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

-- ================================================================

-- Auth bootstrap — break the RLS chicken-and-egg deadlock
-- ================================================================
-- Without this, nobody can ever use the app:
--   * current_user_role() falls back to 'staff' when no profile row exists
--   * reading system_settings requires 'owner' or 'manager'
--   * creating the very first profile also requires 'owner' or 'manager'
-- The first user could therefore never bootstrap, and no user could ever
-- become owner. handle_new_user() runs as SECURITY DEFINER (so it bypasses
-- RLS) and grants 'owner' to the earliest account, 'staff' to the rest.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'owner'
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
                  THEN 'owner' ELSE 'staff' END,
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
