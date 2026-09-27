// Offline replacement for `supabase gen types typescript`.
//
// Why this exists: src/types/supabase.ts was generated from an older schema and
// silently disagreed with supabase/schema.sql - it typed pricing_rates with
// min_days/max_days (the columns are min_rental_days/max_rental_days), allowed
// a 'hourly' rental_type the CHECK constraint rejects, and typed inventory
// item_type as 'owned'|'external'|'both' when the CHECK allows 'owned'|'leased'.
// Nothing caught it because nothing compared the generated types to the schema.
//
// This runs the real schema on PGlite and introspects it, so the types are
// derived from the same SQL the database is built from. CHECK constraints over
// text columns become string-literal unions, exactly like the Supabase CLI does.
//
// Usage: node supabase/validation/gen-types.js [--check]
//   --check  exit non-zero if src/types/supabase.ts is out of date, write nothing
'use strict';

const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
const { statements, EXT_RE } = require('./sql-split');

const ROOT = path.join(__dirname, '..', '..');
const SCHEMA = path.join(ROOT, 'supabase', 'schema.sql');
const OUT = path.join(ROOT, 'src', 'types', 'supabase.ts');
const CHECK_ONLY = process.argv.includes('--check');

// Minimal stand-ins for the Supabase-managed schemas the schema.sql touches.
const SHIM = `
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE SCHEMA IF NOT EXISTS extensions;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false
  );
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql VOLATILE AS $$ SELECT gen_random_uuid() $$;
`;

const SCALAR = {
  bool: 'boolean',
  int2: 'number', int4: 'number', int8: 'number',
  float4: 'number', float8: 'number',
  numeric: 'number', money: 'number',
  uuid: 'string',
  text: 'string', varchar: 'string', bpchar: 'string', name: 'string', citext: 'string',
  date: 'string', time: 'string', timetz: 'string', timestamp: 'string', timestamptz: 'string',
  json: 'Json', jsonb: 'Json',
  bytea: 'string', inet: 'string', interval: 'string',
};

const ELEMENT = {
  _bool: 'boolean', _int2: 'number', _int4: 'number', _int8: 'number',
  _float4: 'number', _float8: 'number', _numeric: 'number',
  _uuid: 'string', _text: 'string', _varchar: 'string', _name: 'string',
  _date: 'string', _timestamp: 'string', _timestamptz: 'string', _jsonb: 'Json',
};

function tsType(udtName, literals) {
  if (udtName && udtName.startsWith('_')) {
    const el = ELEMENT[udtName];
    if (el) return `${el}[]`;
  }
  if (literals && literals.length) {
    // every literal is a plain word, so it is safe to inline as a union member
    if (literals.every((l) => /^[A-Za-z0-9 _.-]+$/.test(l))) {
      return literals.map((l) => `'${l}'`).join(' | ');
    }
  }
  return SCALAR[udtName] || 'unknown';
}

// Replaces the whole file only when the content actually changes, so a
// no-op run does not churn mtimes.
function writeIfChanged(content) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current === content) return false;
  if (CHECK_ONLY) return true;
  fs.writeFileSync(OUT, content, 'utf8');
  return true;
}

(async () => {
  const db = new PGlite();
  await db.exec(SHIM);

  const sql = fs.readFileSync(SCHEMA, 'utf8');
  const stmts = statements(sql).filter((s) => !/^--/.test(s));
  const errors = [];
  for (const s of stmts) {
    if (EXT_RE.test(s)) { EXT_RE.lastIndex = 0; continue; }
    EXT_RE.lastIndex = 0;
    try { await db.exec(s + ';'); } catch (e) { errors.push(String(e.message).split('\n')[0]); }
  }
  if (errors.length) {
    console.error('schema did not apply cleanly:');
    for (const e of errors.slice(0, 5)) console.error('  ' + e);
    process.exit(1);
  }

  // ---- tables + columns -------------------------------------------------
  const tables = await db.query(`
    SELECT c.relname AS table,
           a.attname AS column,
           format_type(a.atttypid, a.atttypmod) AS pg_type,
           t.udt_name,
           t.data_type,
           (a.attnotnull OR a.attidentity <> '') AS not_null,
           a.attidentity <> '' AS is_identity,
           pg_get_expr(ad.adbin, ad.adrelid) AS default_expr
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      JOIN information_schema.columns t
        ON t.table_schema='public' AND t.table_name=c.relname AND t.column_name=a.attname
      LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
     WHERE c.relkind IN ('r','p')
     ORDER BY c.relname, a.attnum`);

  // ---- foreign keys, so nested selects like `customer:contacts(name)` resolve
  const fks = await db.query(`
    SELECT c.relname            AS table,
           con.conname          AS conname,
           a.attname            AS column,
           rf.relname           AS ref_table,
           ra.attname           AS ref_column,
           EXISTS (
             SELECT 1 FROM pg_index i
              WHERE i.indrelid = con.conrelid AND i.indisunique
                AND i.indnatts = array_length(con.conkey, 1)
                AND (i.indkey::smallint[])[0:array_length(con.conkey,1)-1]
                    = con.conkey::smallint[]
           ) AS ref_is_unique
      FROM pg_constraint con
      JOIN pg_class c     ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
      JOIN pg_class rf    ON rf.oid = con.confrelid
      JOIN pg_attribute a  ON a.attrelid = con.conrelid  AND a.attnum = con.conkey[1]
      JOIN pg_attribute ra ON ra.attrelid = con.confrelid AND ra.attnum = con.confkey[1]
     WHERE con.contype='f' AND array_length(con.conkey,1) = 1
     ORDER BY c.relname, con.conname`);

  const fkMap = new Map();
  for (const f of fks.rows) {
    if (!fkMap.has(f.table)) fkMap.set(f.table, []);
    fkMap.get(f.table).push({
      foreignKeyName: f.conname,
      columns: [f.column],
      isOneToOne: f.ref_is_unique,
      referencedRelation: f.ref_table,
      referencedColumns: [f.ref_column],
    });
  }
  const checks = await db.query(`
    SELECT t.relname AS table, pg_get_constraintdef(k.oid) AS def
      FROM pg_constraint k
      JOIN pg_class t     ON t.oid = k.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname='public'
     WHERE k.contype='c'`);

  const checkMap = new Map();
  for (const r of checks.rows) {
    if (!checkMap.has(r.table)) checkMap.set(r.table, []);
    checkMap.get(r.table).push(r.def);
  }

  // A CHECK over several columns (e.g. min <= max) is not a value list, so only
  // treat a definition as a literal set when it is a single-column IN/ANY test.
  function literalsFor(table, column) {
    const defs = checkMap.get(table) || [];
    const hits = [];
    for (const def of defs) {
      if (!new RegExp(`\\b${column}\\b`).test(def)) continue;
      // Blanks the literals out first, otherwise the words inside the quotes
      // ('owned', 'leased', ...) look like column names and every IN-check
      // reads as a multi-column constraint.
      const withoutLiterals = def.replace(/'[^']*'/g, "''");
      const cols = [...withoutLiterals.matchAll(/\b([a-z_][a-z0-9_]*)\b/g)].map((m) => m[1]);
      const uniq = new Set(cols.filter((c) => !['any', 'array', 'text'].includes(c)));
      if (uniq.size !== 1) continue; // a cross-column check is not a value list
      const lits = [...def.matchAll(/'([^']*)'/g)].map((m) => m[1]);
      if (lits.length) hits.push(...lits);
    }
    return [...new Set(hits)];
  }

  const byTable = new Map();
  for (const r of tables.rows) {
    if (!byTable.has(r.table)) byTable.set(r.table, []);
    byTable.get(r.table).push(r);
  }

  const q = (s) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : JSON.stringify(s));

  const lines = [];
  lines.push(`export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]`);
  lines.push('');
  lines.push('// GENERATED FILE - do not edit by hand.');
  lines.push('// Source: supabase/schema.sql');
  lines.push('// Regenerate: node supabase/validation/gen-types.js');
  lines.push('// (equivalent: npm run supabase:gen:offline, or `supabase:gen` when the');
  lines.push('//  Supabase CLI is authenticated against the project)');
  lines.push('');
  lines.push('export type Database = {');
  lines.push('  public: {');
  lines.push('    Tables: {');

  for (const [table, cols] of byTable) {
    lines.push(`      ${q(table)}: {`);
    lines.push('        Row: {');
    for (const c of cols) {
      const lits = literalsFor(table, c.column);
      const t = tsType(c.udt_name, lits);
      lines.push(`          ${q(c.column)}: ${t}${c.not_null ? '' : ' | null'}`);
    }
    lines.push('        }');
    lines.push('        Insert: {');
    for (const c of cols) {
      const lits = literalsFor(table, c.column);
      const t = tsType(c.udt_name, lits);
      // A column may be omitted on insert when the database fills it in for
      // you: it has a default, it is an identity column, or it is nullable.
      const optional = c.default_expr !== null || c.is_identity || !c.not_null;
      const nullable = c.not_null ? '' : ' | null';
      lines.push(`          ${q(c.column)}${optional ? '?' : ''}: ${t}${nullable}`);
    }
    lines.push('        }');
    lines.push('        Update: {');
    for (const c of cols) {
      const lits = literalsFor(table, c.column);
      const t = tsType(c.udt_name, lits);
      const nullable = c.not_null ? '' : ' | null';
      lines.push(`          ${q(c.column)}?: ${t}${nullable}`);
    }
    lines.push('        }');
    const rels = fkMap.get(table) || [];
    if (!rels.length) {
      lines.push('        Relationships: []');
    } else {
      lines.push('        Relationships: [');
      for (const r of rels) {
        lines.push('          {');
        lines.push(`            foreignKeyName: ${JSON.stringify(r.foreignKeyName)}`);
        lines.push(`            columns: [${r.columns.map(JSON.stringify).join(', ')}]`);
        lines.push(`            isOneToOne: ${r.isOneToOne}`);
        lines.push(`            referencedRelation: ${JSON.stringify(r.referencedRelation)}`);
        lines.push(`            referencedColumns: [${r.referencedColumns.map(JSON.stringify).join(', ')}]`);
        lines.push('          },');
      }
      lines.push('        ]');
    }
    lines.push('      }');
  }

  // ---- functions --------------------------------------------------------
  const fns = await db.query(`
    SELECT p.proname AS name,
           pg_get_function_result(p.oid) AS result,
           p.prokind AS kind
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname='public'
     ORDER BY p.proname`);

  const fnType = (r) => {
    if (r.result === 'void' || r.result === null) return 'undefined';
    if (/^boolean$/.test(r.result)) return 'boolean';
    if (/^bigint$/.test(r.result)) return 'number';
    if (/^uuid$/.test(r.result)) return 'string';
    if (/^jsonb?$/.test(r.result)) return 'Json';
    if (/^text$/.test(r.result)) return 'string';
    return 'unknown';
  };

  lines.push('    }');
  lines.push('    Views: { [_ in never]: never }');
  lines.push('    Functions: {');
  for (const f of fns.rows) {
    if (f.kind === 'a' || f.kind === 'w') continue; // aggregates / window only
    const hasSetof = (f.result || '').includes('SETOF');
    const t = fnType(f);
    lines.push(`      ${q(f.name)}: {`);
    lines.push('        Args: {');
    lines.push(`          _unknown: never`);
    lines.push('        }');
    lines.push(`        Returns: ${hasSetof ? `${t}[]` : t}`);
    lines.push('      }');
  }
  lines.push('    }');
  lines.push('    Enums: { [_ in never]: never }');
  lines.push('    CompositeTypes: { [_ in never]: never }');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  const content = lines.join('\n');
  const changed = writeIfChanged(content);

  const tableCount = byTable.size;
  if (CHECK_ONLY) {
    if (changed) {
      console.error(`${path.relative(ROOT, OUT)} is OUT OF DATE with supabase/schema.sql`);
      console.error('run: node supabase/validation/gen-types.js');
      process.exit(1);
    }
    console.log(`supabase.ts is in sync with schema.sql (${tableCount} tables)`);
  } else {
    console.log(`${changed ? 'wrote' : 'unchanged'} ${path.relative(ROOT, OUT)} (${tableCount} tables, ${fns.rows.length} functions)`);
  }
  await db.close();
})();
