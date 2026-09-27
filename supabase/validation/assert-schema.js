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
  const db = new PGlite();
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
    CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false);
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
    CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql VOLATILE AS $$ SELECT gen_random_uuid() $$;
  `);

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
  chk('policies present', pol.rows[0].c, 59);

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

  // the append-only logs must actually accept writes (regression test for the
  // NEW.updated_at runtime failure)
  try {
    await db.exec(`INSERT INTO audit_log (action,entity_type) VALUES ('x','y');`);
    chk('audit_log accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('audit_log accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  try {
    // notifications.user_id -> profiles.id -> auth.users.id
    await db.exec(`INSERT INTO auth.users (id,email) VALUES (gen_random_uuid(),'n@t.com');
      INSERT INTO profiles (user_id,email) SELECT id,'n@t.com' FROM auth.users WHERE email='n@t.com';
      INSERT INTO notifications (user_id,title) SELECT id,'t' FROM profiles WHERE email='n@t.com';`);
    chk('notifications accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('notifications accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  try {
    await db.exec(`INSERT INTO stock_movements (item_id,movement,quantity,running_balance)
                   SELECT id,'purchase',1,1 FROM inventory_items LIMIT 1;`);
    chk('stock_movements accepts INSERT', 'ok', 'ok');
  } catch (e) { chk('stock_movements accepts INSERT', String(e.message).split('\n')[0], 'ok'); }

  // data survived the re-run
  const d = await db.query(`SELECT (SELECT count(*) FROM contacts WHERE name='Seed Co')::int cs,
      (SELECT count(*) FROM inventory_items WHERE unique_code='P1')::int iseed`);
  chk('seed contacts kept', d.rows[0].cs, 1);
  chk('seed inventory kept', d.rows[0].iseed, 1);

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
