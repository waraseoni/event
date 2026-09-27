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
    CREATE POLICY "Super admin+ admin update settings" ON system_settings FOR UPDATE USING (public.current_user_role() IN ('super_admin', 'admin'));
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
