-- =============================================================================
-- LIVE SUPABASE SCHEMA BACKUP (read-only snapshot / context only)
-- =============================================================================
-- Captured:  2026-09-27
-- Project:   dxinfzajqemeuvamvsbr
-- Source:    Supabase SQL Editor schema export
--
-- !! NOT MEANT TO BE RUN AS-IS !!
-- Table order and constraints may not be valid for execution.
--
-- PURPOSE: reference copy of the production/live database structure BEFORE
-- applying any consolidated migration. Use
-- `supabase/schema.sql` for the runnable, idempotent full schema.
--
-- TABLES PRESENT IN LIVE DB (9):
--   contacts, inventory_items, pricing_rates, events, event_items,
--   external_rentals, worker_assignments, payments, system_settings
--
-- NOT PRESENT IN LIVE DB (created by migration):
--   profiles, item_categories, item_locations, item_serials,
--   maintenance_records, special_rates, quotes, quote_items, staff_members,
--   event_staff, event_tasks, event_expenses, rental_contracts,
--   rental_contract_items, attendance, staff_advances, commission_rules,
--   bonuses, payroll_runs, payroll_entries, invoices, invoice_items,
--   expenses, stock_movements, notifications, audit_log
--
-- The absence of `public.profiles` is the direct cause of the
-- "relation \"profiles\" does not exist" failure in 0003_rls.sql.
--
-- KNOWN DEFECT IN THIS SUPABASE EXPORT (corrected in this file):
--   public.pricing_rates.applicable_days was dumped as a bare `ARRAY` with no
--   element type -> `applicable_days ARRAY DEFAULT ARRAY[0,1,2,3,4,5,6]`
--   which is a 42601 syntax error. The real column is `integer[]`
--   (src/types/index.ts declares it as number[]). The type has been filled in
--   below so this reference copy is copy-pasteable; everything else is
--   verbatim as exported.
-- =============================================================================

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.contacts (
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
CREATE TABLE public.inventory_items (
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
CREATE TABLE public.pricing_rates (
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
CREATE TABLE public.events (
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
CREATE TABLE public.event_items (
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
CREATE TABLE public.external_rentals (
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
CREATE TABLE public.worker_assignments (
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
CREATE TABLE public.payments (
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
CREATE TABLE public.system_settings (
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
