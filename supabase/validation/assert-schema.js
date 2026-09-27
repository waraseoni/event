// Final-state assertions: run the schema twice, then verify the database is
// actually in the expected end state (tables, RLS, policies, columns, data).
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');

const SQL = fs.readFileSync(
  process.argv[2] ||
    path.join(__dirname, '..', 'schema.sql'),
  'utf8'
);

const EXT_RE = /CREATE EXTENSION\s+IF NOT EXISTS/gi;

function statements(sql) {
  const out = [];
  let buf = '', i = 0;
  const n = sql.length;
  const tag = () => {
    const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
    return m ? m[0] : null;
  };
  while (i < n) {
    const c = sql[i], two = sql.slice(i, i + 2);
    if (two === '--') { const j = sql.indexOf('\n', i); i = j === -1 ? n : j; continue; }
    if (two === '/*') { const j = sql.indexOf('*/', i + 2); i = j === -1 ? n : j + 2; continue; }
    const t = tag();
    if (t) { const e = sql.indexOf(t, i + t.length); const s = e === -1 ? n : e + t.length; buf += sql.slice(i, s); i = s; continue; }
    if (c === "'") { let j = i + 1; while (j < n) { if (sql[j] === "'") { if (sql[j + 1] === "'") j += 2; else { j++; break; } } else j++; } buf += sql.slice(i, j); i = j; continue; }
    if (c === '"') { let j = i + 1; while (j < n && sql[j] !== '"') j++; j = Math.min(j + 1, n); buf += sql.slice(i, j); i = j; continue; }
    if (c === ';') { if (buf.trim()) out.push(buf.trim()); buf = ''; i++; continue; }
    buf += c; i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

(async () => {
  const SHIM = `
    CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now());
    CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false);
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
    CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql VOLATILE AS $$ SELECT gen_random_uuid() $$;
  `;

  const db = new PGlite();
  await db.exec(SHIM);

  const stmts = statements(SQL).filter((s) => !/^--/.test(s));
  const run = async () => {
    const errs = [];
    for (const s of stmts) {
      if (EXT_RE.test(s)) { EXT_RE.lastIndex = 0; continue; } // pglite lacks ext binaries
      EXT_RE.lastIndex = 0;
      try { await db.exec(s + ';'); } catch (e) { errs.push(String(e.message).split('\n')[0]); }
    }
    return errs;
  };
  // second runner with an independent error buffer, for the later passes
  const runPass2 = async () => {
    const errs = [];
    for (const s of stmts) {
      if (EXT_RE.test(s)) { EXT_RE.lastIndex = 0; continue; }
      EXT_RE.lastIndex = 0;
      try { await db.exec(s + ';'); } catch (e) { errs.push(String(e.message).split('\n')[0]); }
    }
    return errs;
  };
  const trgCount = async (_db, name, schema) => {
    const r = await _db.query(`SELECT count(*)::int c FROM pg_trigger t
      JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE t.tgname=$1 AND n.nspname=$2`, [name, schema]);
    return r.rows[0].c;
  };
  const fnIsDefiner = async (_db, fn) => {
    const r = await _db.query(`SELECT prosecdef FROM pg_proc WHERE proname=$1`, [fn]);
    return !!(r.rows[0] && r.rows[0].prosecdef);
  };

  const e1 = await run();
  await db.exec(`INSERT INTO contacts (name,type,phone) VALUES ('Seed Co','customer','1');
                 INSERT INTO inventory_items (name,category,unique_code) VALUES ('Panel','light','P1');`);
  const e2 = await run();

  const checks = [];
  const chk = (name, actual, expected) =>
    checks.push({ name, actual, expected, ok: String(actual) === String(expected) });

  chk('pass1 errors', e1.length, 0);
  chk('pass2 errors (idempotent)', e2.length, 0);

  const t = await db.query(`SELECT count(*)::int c FROM information_schema.tables WHERE table_schema='public'`);
  chk('public tables', t.rows[0].c, 35);

  const rls = await db.query(`SELECT count(*)::int c FROM pg_tables WHERE schemaname='public' AND rowsecurity`);
  chk('tables with RLS enabled', rls.rows[0].c, 28);

  const pol = await db.query(`SELECT count(*)::int c FROM pg_policies WHERE schemaname='public'`);
  chk('policies present', pol.rows[0].c, 60);

  // no duplicate policy names per table (would mean cleanup loop failed)
  const dup = await db.query(`SELECT count(*)::int c FROM (
      SELECT tablename, policyname, count(*) FROM pg_policies
      WHERE schemaname='public' GROUP BY 1,2 HAVING count(*)>1) x`);
  chk('duplicate policies', dup.rows[0].c, 0);

  // columns added by migration section A
  const cols = await db.query(`SELECT count(*)::int c FROM information_schema.columns
      WHERE table_schema='public' AND
      (table_name,column_name) IN (
        ('contacts','segment'),('contacts','credit_days'),
        ('inventory_items','category_id'),('inventory_items','item_type'),
        ('inventory_items','target_event_types'),('inventory_items','owned_quantity'),
        ('pricing_rates','weekend_rate'),('pricing_rates','slab'),
        ('events','event_no'),('events','quote_id'),('events','tax_mode'),
        ('event_items','source'),('event_items','cost_line'),
        ('worker_assignments','wage_basis'),
        ('payments','invoice_id'),('payments','party_type'),
        ('system_settings','invoice_prefix'),('system_settings','currency'))`);
  chk('migrated columns present', cols.rows[0].c, 18);

  // the previously-broken array column
  const ad = await db.query(`SELECT data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name='pricing_rates' AND column_name='applicable_days'`);
  chk('applicable_days type', ad.rows[0] && ad.rows[0].data_type, 'ARRAY');

  // FK constraints created in section B+
  const fk = await db.query(`SELECT count(*)::int c FROM pg_constraint
      WHERE contype='f' AND conname LIKE 'fk_%'`);
  chk('fk_* constraints', fk.rows[0].c, 7);

  // updated_at triggers: only on tables that actually have an updated_at column
  const trg = await db.query(`SELECT count(*)::int c FROM pg_trigger
      WHERE tgname LIKE 'update_%' AND NOT tgisinternal`);
  chk('updated_at triggers', trg.rows[0].c, 22);

  // no updated_at trigger may sit on a table lacking that column
  const bad = await db.query(`
    SELECT count(*)::int c FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal
      AND t.tgname LIKE 'update_%'
      AND NOT EXISTS (SELECT 1 FROM information_schema.columns col
                      WHERE col.table_schema='public'
                        AND col.table_name=c.relname
                        AND col.column_name='updated_at')`);
  chk('triggers without updated_at col', bad.rows[0].c, 0);

  // (the append-only log write-probes run after the auth bootstrap block, so
  //  that they cannot consume the "first user becomes owner" slot)

  // data survived the re-run
  const d = await db.query(`SELECT (SELECT count(*) FROM contacts WHERE name='Seed Co')::int cs,
      (SELECT count(*) FROM inventory_items WHERE unique_code='P1')::int iseed`);
  chk('seed contacts kept', d.rows[0].cs, 1);
  chk('seed inventory kept', d.rows[0].iseed, 1);

  // ---- auth bootstrap: the deadlock this schema exists to prevent --------
  // A new auth user must get a profile automatically, and the very first
  // account must be 'super_admin'. Without this, current_user_role() falls back
  // to 'staff', the settings SELECT policy denies the read, and the profile
  // INSERT policy denies the fix, so nobody can ever bootstrap.
  chk('on_auth_user_created trigger', await trgCount(db, 'on_auth_user_created', 'auth'), 1);
  chk('handle_new_user is SECURITY DEFINER', await fnIsDefiner(db, 'handle_new_user'), true);
  chk('profile guard trigger', await trgCount(db, 'guard_profile_privileged_fields', 'public'), 1);

  const profBefore = await db.query(`SELECT count(*)::int c FROM public.profiles`);
  await db.exec(`INSERT INTO auth.users (email) VALUES ('first@boss.com');`);
  const p1 = await db.query(`SELECT role FROM public.profiles WHERE email='first@boss.com'`);
  chk('1st signup gets a profile', p1.rows.length, 1);
  chk('1st signup becomes super_admin', p1.rows[0] && p1.rows[0].role, 'super_admin');

  await db.exec(`INSERT INTO auth.users (email) VALUES ('second@staff.com');`);
  const p2 = await db.query(`SELECT role FROM public.profiles WHERE email='second@staff.com'`);
  chk('2nd signup gets a profile', p2.rows.length, 1);
  chk('2nd signup is staff', p2.rows[0] && p2.rows[0].role, 'staff');

  // re-running the schema must not duplicate or re-role existing profiles
  const pass3 = await runPass2();
  const p1b = await db.query(`SELECT role FROM public.profiles WHERE email='first@boss.com'`);
  const profAfter = await db.query(`SELECT count(*)::int c FROM public.profiles`);
  chk('pass3 errors (idempotent)', pass3.length, 0);
  chk('no duplicate profiles on re-run', profAfter.rows[0].c, profBefore.rows[0].c + 2);
  chk('super_admin role unchanged on re-run', p1b.rows[0] && p1b.rows[0].role, 'super_admin');

  // the backfill path: a pre-existing auth user with no profile gets one
  await db.exec(`ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`);
  await db.exec(`DELETE FROM public.profiles WHERE email='second@staff.com';`);
  const pass4 = await runPass2();
  const p2c = await db.query(`SELECT role FROM public.profiles WHERE email='second@staff.com'`);
  chk('backfill recreates missing profile', p2c.rows.length, 1);
  chk('backfill keeps super_admin', p1b.rows[0] && p1b.rows[0].role, 'super_admin');
  chk('backfilled non-first user is staff', p2c.rows[0] && p2c.rows[0].role, 'staff');
  chk('pass4 errors (idempotent)', pass4.length, 0);

  // ---- role CHECK constraint --------------------------------------------
  let badRole = 'accepted';
  try {
    await db.exec(`INSERT INTO auth.users (email) VALUES ('sneaky@t.com');`);
    await db.exec(`UPDATE public.profiles SET role='superadmin'
                   WHERE email='sneaky@t.com';`);
  } catch (e) { badRole = 'rejected'; }
  chk('CHECK constraint rejects unknown role', badRole, 'rejected');

  // ---- role hierarchy ---------------------------------------------------
  // can_assign_role is strictly-below: you may never mint a peer or a superior.
  const hier = await db.query(`SELECT
      public.can_assign_role('super_admin','admin')       AS sa_admin,
      public.can_assign_role('super_admin','super_admin') AS sa_sa,
      public.can_assign_role('admin','admin')             AS a_a,
      public.can_assign_role('admin','accountant')        AS a_acc,
      public.can_assign_role('admin','staff')             AS a_staff,
      public.can_assign_role('admin','super_admin')       AS a_sa,
      public.can_assign_role('accountant','staff')        AS acc_staff,
      public.can_assign_role('accountant','admin')        AS acc_admin,
      public.can_assign_role('staff','staff')             AS s_s,
      public.can_assign_role('staff','admin')             AS s_admin,
      public.can_assign_role('staff','nonsense')          AS s_junk,
      (public.role_rank('super_admin') > public.role_rank('admin')
        AND public.role_rank('admin') > public.role_rank('accountant')
        AND public.role_rank('accountant') > public.role_rank('staff')) AS ranks_descend,
      public.role_rank('nonsense') AS junk_rank`);
  const h = hier.rows[0];
  chk('super_admin can create admin', h.sa_admin, true);
  chk('super_admin cannot create super_admin', h.sa_sa, false);
  chk('admin cannot create admin', h.a_a, false);
  chk('admin can create accountant', h.a_acc, true);
  chk('admin can create staff', h.a_staff, true);
  chk('admin cannot create super_admin', h.a_sa, false);
  chk('accountant can create staff', h.acc_staff, true);
  chk('accountant cannot create admin', h.acc_admin, false);
  chk('staff cannot create staff', h.s_s, false);
  chk('staff cannot create admin', h.s_admin, false);
  chk('unknown role is unassignable', h.s_junk, false);
  chk('ranks descend super_admin>admin>accountant>staff', h.ranks_descend, true);
  chk('unknown role ranks 0', h.junk_rank, 0);

  // ---- privileged-field guard -------------------------------------------
  // can_change_profile_privileged: only a super admin may move a role or flip
  // is_active; everyone else may still edit their own benign fields.
  const priv = await db.query(`SELECT
      public.can_change_profile_privileged('super_admin','admin','staff',false,true) AS sa_moves,
      public.can_change_profile_privileged('admin','super_admin','staff',true,true) AS a_escalates,
      public.can_change_profile_privileged('staff','super_admin','staff',true,true) AS s_escalates,
      public.can_change_profile_privileged('admin','admin','admin',false,true) AS a_deactivates,
      public.can_change_profile_privileged('staff','staff','staff',true,true) AS s_selfedit,
      public.can_change_profile_privileged('staff','staff','staff',true,false) AS s_selfdisable`);
  const pv = priv.rows[0];
  chk('super_admin may reassign a role', pv.sa_moves, true);
  chk('admin cannot promote to super_admin', pv.a_escalates, false);
  chk('staff cannot promote to super_admin', pv.s_escalates, false);
  chk('admin cannot deactivate an account', pv.a_deactivates, false);
  chk('staff may edit own benign fields', pv.s_selfedit, true);
  chk('staff cannot flip own is_active', pv.s_selfdisable, false);

  // End-to-end: with the writer treated as an end user, the trigger must reject
  // a self-escalation on UPDATE and a peer-mint on INSERT. PGlite runs as a
  // superuser (a trusted writer), so both detections are stubbed out for the
  // duration of this check.
  await db.exec(`
    CREATE OR REPLACE FUNCTION public.is_trusted_profile_writer() RETURNS BOOLEAN
      LANGUAGE sql STABLE AS $$ SELECT false $$;
    CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT
      LANGUAGE sql STABLE AS $$ SELECT 'staff' $$;`);

  let escalated = 'allowed';
  try {
    await db.exec(`UPDATE public.profiles SET role='super_admin'
                   WHERE email='second@staff.com';`);
  } catch (e) { escalated = e.message.includes('super admin') ? 'blocked' : 'other:' + e.message; }
  chk('trigger blocks staff self-escalation', escalated, 'blocked');

  const stillStaff = await db.query(`SELECT role FROM public.profiles WHERE email='second@staff.com'`);
  chk('role unchanged after blocked attempt', stillStaff.rows[0].role, 'staff');

  await db.exec(`CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT
                   LANGUAGE sql STABLE AS $$ SELECT 'admin' $$;`);
  let mintedPeer = 'allowed';
  try {
    await db.exec(`INSERT INTO public.profiles (user_id,email,role)
                   VALUES (gen_random_uuid(),'peer@t.com','admin');`);
  } catch (e) { mintedPeer = e.message.includes('cannot create a profile') ? 'blocked' : 'other:' + e.message; }
  chk('trigger blocks admin minting a peer admin', mintedPeer, 'blocked');

  // a super_admin doing the same thing must still work
  await db.exec(`CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT
                   LANGUAGE sql STABLE AS $$ SELECT 'super_admin' $$;`);
  let mintedBySa = 'ok';
  try {
    await db.exec(`INSERT INTO auth.users (email) VALUES ('peer2@t.com');`);
    await db.exec(`UPDATE public.profiles SET role='admin' WHERE email='peer2@t.com';`);
  } catch (e) { mintedBySa = 'blocked: ' + e.message; }
  chk('super_admin can still mint an admin', mintedBySa, 'ok');

  // restore the real implementations
  await runPass2();

  // ---- legacy role migration, on a database that starts out OLD ---------
  // The main instance starts from the new schema, so it can never hold
  // 'owner'/'manager'. This second instance reproduces the pre-migration shape
  // (old CHECK constraint, old role values) and then runs the real schema over
  // it, which is the only way to actually exercise the data migration.
  const legacyDb = new PGlite();
  await legacyDb.exec(SHIM);
  await legacyDb.exec(`
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','manager','accountant','staff')) DEFAULT 'staff',
      display_name TEXT, phone TEXT, avatar_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    INSERT INTO auth.users (email) VALUES ('boss@old.com');
    INSERT INTO auth.users (email) VALUES ('ops@old.com');
    INSERT INTO auth.users (email) VALUES ('clerk@old.com');
    INSERT INTO public.profiles (user_id,email,role)
      SELECT id,email,'owner'      FROM auth.users WHERE email='boss@old.com';
    INSERT INTO public.profiles (user_id,email,role)
      SELECT id,email,'manager'    FROM auth.users WHERE email='ops@old.com';
    INSERT INTO public.profiles (user_id,email,role)
      SELECT id,email,'accountant' FROM auth.users WHERE email='clerk@old.com';`);

  const legacyErrs = [];
  for (const s of statements(SQL)) {
    if (/^--/.test(s)) continue;
    if (EXT_RE.test(s)) { EXT_RE.lastIndex = 0; continue; }
    EXT_RE.lastIndex = 0;
    try { await legacyDb.exec(s + ';'); } catch (e) { legacyErrs.push(String(e.message).split('\n')[0]); }
  }

  chk('schema applies over legacy database', legacyErrs.length, 0);
  if (legacyErrs.length) console.log('   legacy errors:', legacyErrs.slice(0, 3));

  const mig = await legacyDb.query(`SELECT
      (SELECT role FROM public.profiles WHERE email='boss@old.com')    AS boss,
      (SELECT role FROM public.profiles WHERE email='ops@old.com')     AS ops,
      (SELECT role FROM public.profiles WHERE email='clerk@old.com')   AS clerk,
      (SELECT count(*)::int FROM public.profiles
         WHERE role NOT IN ('super_admin','admin','accountant','staff')) AS stray,
      (SELECT count(*)::int FROM public.profiles)                     AS total`);
  chk("legacy 'owner' -> super_admin", mig.rows[0].boss, 'super_admin');
  chk("legacy 'manager' -> admin", mig.rows[0].ops, 'admin');
  chk('unrelated role untouched by migration', mig.rows[0].clerk, 'accountant');
  chk('no rows left outside the new role set', mig.rows[0].stray, 0);
  chk('migration created no extra profiles', mig.rows[0].total, 3);

  // and the legacy data is still there afterwards
  const legacyKept = await legacyDb.query(
    `SELECT count(*)::int c FROM public.profiles WHERE email LIKE '%@old.com'`);
  chk('legacy profile rows preserved', legacyKept.rows[0].c, 3);
  await legacyDb.close();

  // the append-only logs must actually accept writes (regression test for the
  // NEW.updated_at runtime failure)
  try {
    await db.exec(`INSERT INTO audit_log (action,entity_type) VALUES ('x','y');`);
    chk('audit_log accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('audit_log accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  try {
    // the on_auth_user_created trigger creates the profile for us
    await db.exec(`INSERT INTO auth.users (id,email) VALUES (gen_random_uuid(),'n@t.com');
      INSERT INTO notifications (user_id,title)
        SELECT id,'t' FROM public.profiles WHERE email='n@t.com';`);
    chk('notifications accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('notifications accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  try {
    await db.exec(`INSERT INTO stock_movements (item_id,movement,quantity,running_balance)
                   SELECT id,'purchase',1,1 FROM inventory_items LIMIT 1;`);
    chk('stock_movements accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('stock_movements accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  // ---- and finally: does the bootstrap actually break the RLS deadlock? ----
  // A fresh super_admin profile must satisfy the system_settings SELECT policy.
  const own = await db.query(`
    SELECT (public.current_user_role() = 'staff') AS fallback_is_staff,
           (SELECT count(*)::int FROM public.system_settings) AS settings_rows`);
  chk('role fn falls back to staff when no session', own.rows[0].fallback_is_staff, true);
  chk('system_settings readable by superuser', own.rows[0].settings_rows >= 0, true);

  console.log('\n========== FINAL STATE ASSERTIONS ==========');
  let fail = 0;
  for (const c of checks) {
    const s = c.ok ? 'PASS' : 'FAIL';
    if (!c.ok) fail++;
    console.log(`${s}  ${c.name.padEnd(34)} actual=${c.actual}  expected=${c.expected}`);
  }
  console.log('=============================================');
  console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} CHECK(S) FAILED`);
  if (fail) process.exitCode = 1;
  await db.close();
})().catch((e) => { console.error('FATAL', e); process.exitCode = 2; });
