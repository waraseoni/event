// Splits a SQL script into individual statements, respecting:
//   - `-- line` and `/* block */` comments
//   - 'single quoted' strings, including '' escapes
//   - "quoted identifiers"
//   - $tag$ ... $tag$ dollar-quoted bodies (functions, DO blocks)
//
// Exists because supabase/schema.sql is a single 900+ line file mixing DDL,
// PL/pgSQL bodies and comments, and both the assertion suite and the type
// generator need to run it statement by statement.
'use strict';

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

// pglite has no pgcrypto/uuid-ossp binaries, so schema defaults that call them
// are supplied by the shim instead of a real extension.
const EXT_RE = /CREATE EXTENSION\s+IF NOT EXISTS/gi;

module.exports = { statements, EXT_RE };
