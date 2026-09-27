-- =============================================================================
-- 0004 — Security & defect fixes
-- =============================================================================
-- Two defects from `docs/DEVELOPMENT_PLAN.md`, both security relevant.
--
-- D1: seven tables were created without ENABLE ROW LEVEL SECURITY and without
--     any policies: payments, invoice_items, external_rentals,
--     worker_assignments, item_serials, maintenance_records, special_rates.
--     On a table with RLS disabled Postgres ignores policies entirely, so the
--     public anon key could read AND write every row of all seven — including
--     the payments table.
--
-- D2: system_settings had SELECT and UPDATE policies but no INSERT policy, so
--     the first-ever save (which seeds the row) failed for every role.
--
-- Idempotent: safe to re-run. This file is also mirrored into supabase/schema.sql,
-- which remains the single source of truth.
-- =============================================================================

-- D2: allow the settings row to be seeded. INSERT is scoped to the same roles
-- that may read and update settings; there is no DELETE policy, so a row can be
-- seeded and edited but never removed from the app.
DROP POLICY IF EXISTS "Super admin+ admin insert settings" ON public.system_settings;
CREATE POLICY "Super admin+ admin insert settings" ON public.system_settings
  FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

-- D1: lock down the seven unprotected tables. Each one gets the same role
-- grants its parent table already had, so no existing app behaviour changes.
-- payments is deliberately stricter (accountant+, no staff read) because it is
-- the one table here that holds money.

DROP POLICY IF EXISTS "Accountant+ read payments" ON public.payments;
DROP POLICY IF EXISTS "Accountant+ manage payments" ON public.payments;
CREATE POLICY "Accountant+ read payments" ON public.payments
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));
CREATE POLICY "Accountant+ manage payments" ON public.payments
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin', 'accountant'));

DROP POLICY IF EXISTS "Staff+ read invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Super admin+ manage invoice items" ON public.invoice_items;
CREATE POLICY "Staff+ read invoice items" ON public.invoice_items
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage invoice items" ON public.invoice_items
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Staff+ read external rentals" ON public.external_rentals;
DROP POLICY IF EXISTS "Super admin+ manage external rentals" ON public.external_rentals;
CREATE POLICY "Staff+ read external rentals" ON public.external_rentals
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage external rentals" ON public.external_rentals
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Staff+ read worker assignments" ON public.worker_assignments;
DROP POLICY IF EXISTS "Super admin+ manage worker assignments" ON public.worker_assignments;
CREATE POLICY "Staff+ read worker assignments" ON public.worker_assignments
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage worker assignments" ON public.worker_assignments
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Staff+ read item serials" ON public.item_serials;
DROP POLICY IF EXISTS "Super admin+ manage item serials" ON public.item_serials;
CREATE POLICY "Staff+ read item serials" ON public.item_serials
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage item serials" ON public.item_serials
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Staff+ read maintenance" ON public.maintenance_records;
DROP POLICY IF EXISTS "Super admin+ manage maintenance" ON public.maintenance_records;
CREATE POLICY "Staff+ read maintenance" ON public.maintenance_records
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage maintenance" ON public.maintenance_records
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "Staff+ read special rates" ON public.special_rates;
DROP POLICY IF EXISTS "Super admin+ manage special rates" ON public.special_rates;
CREATE POLICY "Staff+ read special rates" ON public.special_rates
  FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin', 'accountant', 'staff'));
CREATE POLICY "Super admin+ manage special rates" ON public.special_rates
  FOR ALL USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

-- Enabling RLS is the actual fix; the policies above are inert without it.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['payments','invoice_items','external_rentals',
                           'worker_assignments','item_serials',
                           'maintenance_records','special_rates']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;
