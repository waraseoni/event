-- Row Level Security — Role-based policies (Phase 0)
-- Applies to all newly created tables. system_settings kept open for settings page.

-- ================================================================
-- AUTH ROLE HELPER
-- ================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE user_id = auth.uid()),
    'staff'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_role() IS 'Returns current user role for RLS';

-- ================================================================
-- PROFILES RLS
-- ================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners + managers can view all profiles"
  ON profiles FOR SELECT
  USING (public.current_user_role() IN ('owner', 'manager'));

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners + managers can upsert profiles"
  ON profiles FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'))
  WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

CREATE POLICY "Owners + managers can update profiles"
  ON profiles FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- MASTERS (item_categories, item_locations, contacts)
-- ================================================================
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read categories" ON item_categories FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage categories" ON item_categories FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE item_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read locations" ON item_locations FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage locations" ON item_locations FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read contacts" ON contacts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage contacts" ON contacts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- STAFF MEMBERS
-- ================================================================
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read staff" ON staff_members FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage staff" ON staff_members FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- INVENTORY ITEMS
-- ================================================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read inventory" ON inventory_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage inventory" ON inventory_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- PRICING & QUOTES
-- ================================================================
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read pricing" ON pricing_rates FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage pricing" ON pricing_rates FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE special_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read special rates" ON special_rates FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage special rates" ON special_rates FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read quotes" ON quotes FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage quotes" ON quotes FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read quote items" ON quote_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage quote items" ON quote_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- EVENTS
-- ================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read events" ON events FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage events" ON events FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read event items" ON event_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage event items" ON event_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read event staff" ON event_staff FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage event staff" ON event_staff FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read event tasks" ON event_tasks FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage event tasks" ON event_tasks FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read event expenses" ON event_expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage event expenses" ON event_expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- RENTALS
-- ================================================================
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read rentals" ON rental_contracts FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage rentals" ON rental_contracts FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE rental_contract_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read rental items" ON rental_contract_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage rental items" ON rental_contract_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- ATTENDANCE / STAFF ADVANCES / COMMISSION / BONUSES
-- ================================================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read own attendance" ON attendance FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = staff_id) OR public.current_user_role() IN ('owner', 'manager', 'accountant'));
CREATE POLICY "Manager+ can manage attendance" ON attendance FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));

ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read advances" ON staff_advances FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage advances" ON staff_advances FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner+ can manage commission rules" ON commission_rules FOR ALL USING (public.current_user_role() IN ('owner', 'manager'));
CREATE POLICY "Staff+ can read commission rules" ON commission_rules FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));

ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read bonuses" ON bonuses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage bonuses" ON bonuses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- PAYROLL
-- ================================================================
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner+ accountant can read payroll" ON payroll_runs FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
CREATE POLICY "Owner+ accountant can manage payroll" ON payroll_runs FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));

ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner+ accountant can read payroll entries" ON payroll_entries FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant'));
CREATE POLICY "Owner+ accountant can manage payroll entries" ON payroll_entries FOR ALL USING (public.current_user_role() IN ('owner', 'manager', 'accountant')) WITH CHECK (public.current_user_role() IN ('owner', 'manager', 'accountant'));

-- ================================================================
-- INVOICES / EXPENSES
-- ================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read invoices" ON invoices FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage invoices" ON invoices FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read invoice items" ON invoice_items FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage invoice items" ON invoice_items FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read expenses" ON expenses FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage expenses" ON expenses FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- STOCK MOVEMENTS
-- ================================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff+ can read stock movements" ON stock_movements FOR SELECT USING (public.current_user_role() IN ('owner', 'manager', 'accountant', 'staff'));
CREATE POLICY "Owner+ can manage stock movements" ON stock_movements FOR ALL USING (public.current_user_role() IN ('owner', 'manager')) WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- NOTIFICATIONS & AUDIT
-- ================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner+ manager can read audit log" ON audit_log FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
CREATE POLICY "Owner+ manager can write audit log" ON audit_log FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'manager'));

-- ================================================================
-- SYSTEM SETTINGS (open — settings page needs read/write for owner)
-- ================================================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner+ can read settings" ON system_settings FOR SELECT USING (public.current_user_role() IN ('owner', 'manager'));
CREATE POLICY "Owner+ can update settings" ON system_settings FOR UPDATE USING (public.current_user_role() IN ('owner', 'manager'));
INSERT INTO storage.buckets (id, name, public) VALUES ('system-assets', 'system-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-documents', 'event-documents', true) ON CONFLICT (id) DO NOTHING;
