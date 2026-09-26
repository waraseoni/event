-- Row Level Security — Role-based policies (Phase 0)
-- Drops old "Allow all" policies on existing tables and creates role-based ones.

-- ================================================================
-- Auth role helper (safe: uses SECURITY DEFINER, works for all roles)
-- ================================================================
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
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON profiles;
    CREATE POLICY "Owner+ manager can view all" ON profiles FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Users can view own" ON profiles FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Owner+ manager upsert" ON profiles FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager update" ON profiles FOR UPDATE USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Staff update own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Masters
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_categories') THEN
    ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON item_categories;
    CREATE POLICY "Staff+ read categories" ON item_categories FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage categories" ON item_categories FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_locations') THEN
    ALTER TABLE item_locations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON item_locations;
    CREATE POLICY "Staff+ read locations" ON item_locations FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage locations" ON item_locations FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON contacts;
    CREATE POLICY "Staff+ read contacts" ON contacts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage contacts" ON contacts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_members') THEN
    ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON staff_members;
    CREATE POLICY "Staff+ read staff" ON staff_members FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage staff" ON staff_members FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
    ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON inventory_items;
    CREATE POLICY "Staff+ read inventory" ON inventory_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage inventory" ON inventory_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rates') THEN
    ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON pricing_rates;
    CREATE POLICY "Staff+ read pricing" ON pricing_rates FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage pricing" ON pricing_rates FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
    ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON quotes;
    CREATE POLICY "Staff+ read quotes" ON quotes FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage quotes" ON quotes FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_items') THEN
    ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON quote_items;
    CREATE POLICY "Staff+ read quote items" ON quote_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage quote items" ON quote_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON events;
    CREATE POLICY "Staff+ read events" ON events FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage events" ON events FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_items') THEN
    ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON event_items;
    CREATE POLICY "Staff+ read event items" ON event_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage event items" ON event_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_staff') THEN
    ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read" ON event_staff FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage" ON event_staff FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_tasks') THEN
    ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read tasks" ON event_tasks FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage tasks" ON event_tasks FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_expenses') THEN
    ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read expenses" ON event_expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage expenses" ON event_expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts') THEN
    ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read rentals" ON rental_contracts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage rentals" ON rental_contracts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contract_items') THEN
    ALTER TABLE rental_contract_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read" ON rental_contract_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage" ON rental_contract_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') THEN
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Manager+ accountant read attendance" ON attendance FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Manager+ accountant manage attendance" ON attendance FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_advances') THEN
    ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read advances" ON staff_advances FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage advances" ON staff_advances FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_rules') THEN
    ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read commission" ON commission_rules FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage commission" ON commission_rules FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bonuses') THEN
    ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read bonuses" ON bonuses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage bonuses" ON bonuses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_runs') THEN
    ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owner+ accountant read payroll" ON payroll_runs FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Owner+ accountant manage payroll" ON payroll_runs FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_entries') THEN
    ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owner+ accountant read entries" ON payroll_entries FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
    CREATE POLICY "Owner+ accountant manage entries" ON payroll_entries FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read invoices" ON invoices FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage invoices" ON invoices FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read expenses" ON expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage expenses" ON expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
    ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Staff+ read movements" ON stock_movements FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
    CREATE POLICY "Owner+ manage movements" ON stock_movements FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users update own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owner+ manager read audit" ON audit_log FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager write audit" ON audit_log FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all" ON system_settings;
    CREATE POLICY "Owner+ manager read settings" ON system_settings FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
    CREATE POLICY "Owner+ manager update settings" ON system_settings FOR UPDATE USING (public.current_user_role() IN ('owner', 'manager'));
  END IF;
END $$;

-- ================================================================
-- Storage buckets (idempotent)
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('system-assets', 'system-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-documents', 'event-documents', true) ON CONFLICT (id) DO NOTHING;
