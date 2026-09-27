-- =============================================================================
-- BOOTSTRAP THE FIRST SUPER ADMIN  (safe template - no real credentials)
-- =============================================================================
-- THIS FILE IS SAFE TO COMMIT. It contains no real password.
--
-- Do not type credentials into THIS file. Copy it first:
--
--   cp supabase/seed/bootstrap-super-admin.example.sql \
--      supabase/seed/bootstrap-super-admin.sql
--
-- The copy is listed in .gitignore, so your real password can never be
-- committed by accident. This template stays in git so the procedure and the
-- comments below are not lost.
--
-- Run the COPY once in the Supabase SQL Editor, after running supabase/schema.sql.
--
-- Why a script and not a web page: a public /setup route has to be live and
-- reachable before it can be locked down, which leaves a window where anyone
-- who finds the URL can claim the top role. This script has no such window -
-- it only ever runs against a database you already control, and it only ever
-- touches the one account you name below.
--
-- 1. Edit the four values in the CONFIG block.
-- 2. Paste that whole file into the Supabase SQL Editor and run it.
-- 3. It prints a verification table at the end.
--
-- Safe to run more than once: the account is reused, not duplicated, and the
-- password is only reset if you change it.
--
-- IMPORTANT: change the password before you use this anywhere real. A password
-- committed to git is a public password.
-- =============================================================================

-- ------------------------------- CONFIG -------------------------------------
DO $$
DECLARE
  v_email    CONSTANT TEXT := 'superadmin@example.com';  -- CHANGE ME
  v_password CONSTANT TEXT := 'ChangeThis123!';          -- CHANGE ME (min 8 chars)
  v_name     CONSTANT TEXT := 'Super Admin';             -- CHANGE ME
  v_phone    CONSTANT TEXT := NULL;
  v_uid      UUID;
  v_created  BOOLEAN := false;
BEGIN
  IF length(v_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'public.profiles does not exist. Run supabase/schema.sql first.';
  END IF;

  -- ---------------------------------------------------------------------
  -- 1. the auth account
  -- ---------------------------------------------------------------------
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    v_created := true;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid,
      'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_name),
      now(), now(), '', '', '', ''
    );
  ELSE
    -- already exists: just sync the password so re-running with a new one works
    UPDATE auth.users
       SET encrypted_password   = crypt(v_password, gen_salt('bf')),
           email_confirmed_at   = COALESCE(email_confirmed_at, now()),
           confirmation_token   = '',
           recovery_token       = '',
           updated_at           = now()
     WHERE id = v_uid;
  END IF;

  -- ---------------------------------------------------------------------
  -- 2. the profile, pinned to super_admin
  -- ---------------------------------------------------------------------
  -- on_auth_user_created normally fills this in, but upserting directly makes
  -- the script independent of whether that trigger is present.
  INSERT INTO public.profiles (user_id, email, role, display_name, phone, is_active)
  VALUES (v_uid, v_email, 'super_admin', v_name, v_phone, true)
  ON CONFLICT (user_id) DO UPDATE
    SET role         = 'super_admin',
        display_name = EXCLUDED.display_name,
        is_active    = true,
        updated_at   = now();

  RAISE NOTICE 'Super admin % ready (%): %', v_email,
    CASE WHEN v_created THEN 'created' ELSE 'updated' END, v_uid;
END $$;

-- ----------------------------- VERIFICATION ---------------------------------
SELECT p.email,
       p.role,
       p.is_active,
       (SELECT count(*) FROM auth.users a WHERE a.id = p.user_id) AS auth_row
  FROM public.profiles p
 WHERE p.email = 'superadmin@example.com';

-- Expected: one row, role = super_admin, is_active = t, auth_row = 1.
--
-- If auth_row is 0 the auth account is missing - re-run the script.
-- If you see more than one super_admin, demote the extras:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'someone@else.com';
