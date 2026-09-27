// Column-level completeness audit.
// Parses every column the schema DECLARES (CREATE TABLE bodies + all
// ALTER TABLE ... ADD COLUMN statements) and compares that set against the
// columns the database actually ends up with after execution. Catches any
// column that was dropped, misspelled, or never migrated.
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');

const SQL_FILE = process.argv[2] || path.join(__dirname, '..', 'schema.sql');
const SQL = fs.readFileSync(SQL_FILE, 'utf8');

// ---------------------------------------------- parse declared columns
const declared = new Map(); // table -> Set(column)
const add = (t, c) => {
  if (!declared.has(t)) declared.set(t, new Set());
  declared.get(t).add(c);
};

// 1) CREATE TABLE bodies
for (const m of SQL.matchAll(
  /CREATE TABLE IF NOT EXISTS\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/g
)) {
  const tbl = m[1];
  for (const raw of m[2].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN)\b/i.test(line)) continue;
    if (line === ');') continue;
    const c = line.match(/^([a-z_][a-z0-9_]*)\s+\S/i);
    if (c) add(tbl, c[1]);
  }
}

// 2) ALTER TABLE ... ADD COLUMN IF NOT EXISTS
for (const m of SQL.matchAll(
  /ALTER TABLE (?:IF EXISTS )?(?:public\.)?(\w+)\s+ADD COLUMN IF NOT EXISTS\s+([a-z_][a-z0-9_]*)/gi
)) {
  add(m[1], m[2]);
}

// ---------------------------------------------- run the schema
function statements(sql) {
  const out = []; let buf = '', i = 0; const n = sql.length;
  const tag = () => { const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i)); return m ? m[0] : null; };
  while (i < n) {
    const c = sql[i], two = sql.slice(i, i + 2);
    if (two === '--') { const j = sql.indexOf('\n', i); i = j === -1 ? n : j; continue; }
    if (two === '/*') { const j = sql.indexOf('*/', i + 2); i = j === -1 ? n : j + 2; continue; }
    const t = tag(); if (t) { const e = sql.indexOf(t, i + t.length); const s = e === -1 ? n : e + t.length; buf += sql.slice(i, s); i = s; continue; }
    if (c === "'") { let j = i + 1; while (j < n) { if (sql[j] === "'") { if (sql[j+1] === "'") j += 2; else { j++; break; } } else j++; } buf += sql.slice(i, j); i = j; continue; }
    if (c === '"') { let j = i + 1; while (j < n && sql[j] !== '"') j++; j = Math.min(j+1, n); buf += sql.slice(i, j); i = j; continue; }
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

  let ran = 0;
  for (const s of statements(SQL)) {
    if (/^--/.test(s) || /CREATE EXTENSION/i.test(s)) continue;
    try { await db.exec(s + ';'); ran++; }
    catch (e) { console.log('EXEC FAIL: ' + String(e.message).split('\n')[0]); }
  }

  // ---------------------------------------------- compare
  const actual = new Map();
  const r = await db.query(`SELECT table_name, column_name FROM information_schema.columns
                            WHERE table_schema='public' ORDER BY table_name, column_name`);
  for (const row of r.rows) {
    if (!actual.has(row.table_name)) actual.set(row.table_name, new Set());
    actual.get(row.table_name).add(row.column_name);
  }

  const missing = [];
  let declaredCount = 0;
  for (const [tbl, cols] of declared) {
    const have = actual.get(tbl);
    if (!have) { missing.push(`${tbl}: TABLE MISSING (${cols.size} cols declared)`); continue; }
    for (const c of cols) {
      declaredCount++;
      if (!have.has(c)) missing.push(`${tbl}.${c}`);
    }
  }

  console.log('========== COLUMN COMPLETENESS AUDIT ==========');
  console.log(`tables declared            : ${declared.size}`);
  console.log(`columns declared           : ${declaredCount}`);
  console.log(`tables in database         : ${actual.size}`);
  console.log(`columns in database        : ${r.rows.length}`);
  console.log(`missing (declared, absent) : ${missing.length}`);
  if (missing.length) { console.log('\nMISSING:'); missing.forEach((m) => console.log('  ' + m)); }
  else console.log('\nEvery declared column exists in the database.');

  // tables in db that the file never declared (unexpected)
  const extra = [...actual.keys()].filter((t) => !declared.has(t));
  console.log(`\nundeclared tables in db    : ${extra.length}${extra.length ? ' -> ' + extra.join(', ') : ''}`);
  console.log('===============================================');
  if (missing.length) process.exitCode = 1;
  await db.close();
})().catch((e) => { console.error('FATAL', e); process.exitCode = 2; });
