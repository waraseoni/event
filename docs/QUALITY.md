# Quality, Testing & Delivery

> Part of [DEVELOPMENT_PLAN](./DEVELOPMENT_PLAN.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [MODULES.md](./MODULES.md)

---

## 1. Toolchain (add in Phase 0 / 10)

| Purpose | Tool | Command |
|---|---|---|
| Lint | ESLint (eslint-config-next) | `npm run lint` |
| Types | tsc --noEmit | `npm run type-check` |
| Build | next build | `npm run build` |
| Unit + integration (TS) | **vitest** + @testing-library/react | `npm run test` |
| DB functions / RLS | **PGlite harness** (already in `supabase/validation/`) | `npm run db:validate` |
| E2E | **Playwright** | `npm run e2e` |
| Schema audit | `supabase/validation/audit-columns.js` | `npm run db:audit` |
| Types regen | supabase CLI | `npm run supabase:gen` |

Add to `package.json` scripts in Phase 0:
```json
"test": "vitest run",
"test:watch": "vitest",
"db:validate": "node supabase/validation/assert-schema.js",
"db:audit": "node supabase/validation/audit-columns.js",
"e2e": "playwright test",
"check": "npm run lint && npm run type-check && npm run test && npm run db:validate"
```

---

## 2. Test Pyramid

### 2.1 Unit (vitest) — pure logic
- `lib/pricing/*` — duration slabs, qty slabs, season multiplier, discount, min_price floor, GST split, round-off. **Property test**: TS result === SQL `fn_quote_line` result for 200 random fixtures.
- `lib/payroll/*` — daily/permanent proration, OT, commission slabs, advance recovery cap, absence deduction, net calc.
- `lib/validators/*` — schema accept/reject cases.
- helpers: `round2`, `overlap(aFrom,aTo,bFrom,bTo)`, `formatMoney`, date ranges, doc-number parse.

### 2.2 DB integration (PGlite, extends `supabase/validation/assert-schema.js`)
Existing harness already executes the consolidated schema on real Postgres and asserts tables/columns/triggers/policies — keep it green always. Add `supabase/validation/test-functions.js`:

| Test | Assertion |
|---|---|
| `fn_available_qty` overlap | 3 owned, 2 booked overlapping → 1 free; non-overlapping windows → 3 free |
| half-open boundary | `[10:00,12:00)` vs `[12:00,14:00)` → no conflict |
| rented-in pool adds | in-contract covers window → availability increases |
| rental-out subtracts | out-contract → availability decreases |
| maintenance blocks | active maintenance → 0 available |
| max_parallel_events | 3 units but max_parallel=1 → 2nd parallel event rejected |
| advisory lock concurrency | two concurrent `p_create_event_with_items` on last unit → one success, one `conflict` |
| `p_next_doc_no` | 20 parallel calls → 20 unique, sequential numbers |
| pricing engine SQL | matches vitest fixture results |
| `p_generate_payroll` | fixture staff → expected net pay (components JSONB asserted) |
| `fn_contact_ledger` | running balance = invoices − payments |
| GST split | intra/inter state + round-off |
| stage machine | invalid transition raises |

RLS matrix test: create 4 test users (roles), run a table of allowed/denied operations per role → assert success/error.

### 2.3 Component tests (vitest + testing-library)
`DataTable` (sort/page/select), `FilterBar`, `Money`, form submit with zod error display, meeting-mode cart arithmetic UI, availability chip states.

### 2.4 E2E smoke (Playwright, seeded demo data)
1. Login as admin → create client → create item → create quote (override rate) → approve → convert to event → assign staff → stage → live → teardown → return items → issue invoice → record payment → mark paid.
2. Generate payroll → approve → pay → payslip download.
3. Rental-in: create contract → receive → item available.
4. Availability conflict: attempt overbook → error shown with shortfall.
5. Role checks: `staff` user cannot open `/users`, cannot see money modules; `accountant` can see billing but not users.
6. Public quote link works in logged-out context.

---

## 3. CI (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4  with node-version: 22, cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run db:validate        # PGlite schema + function tests
      - run: npm run build              # Next.js production build
  # e2e job: playwright against preview deployment + test DB (Phase 10)
```
Also: `npm run supabase:gen` diff check — fail CI if `src/types/supabase.ts` is stale relative to `supabase/schema.sql`.

---

## 4. Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` only imported by `src/lib/supabase/server.ts` (browser-bundle guard exists — keep; verify with `grep` in CI)
- [ ] RLS enabled on **all 35 tables** after migration 0004; `audit-columns.js` extended to assert `relrowsecurity = true` for every table
- [ ] Every server action calls `requireRole` — no action without guard (lint rule / manual review list)
- [ ] Zod `.strict()` on all input schemas (reject unknown columns)
- [ ] Public routes limited: `/auth/login`, `/q/[token]` (token-gated, rate-limited), `/api/pdf` (token only)
- [ ] Uploads: mime + 10MB limit, path prefixed per entity, signed URLs for private docs
- [ ] No secrets in `.env.example`; `npm run build` grep for `service_role` string
- [ ] Middleware matcher covers `/api/*` (already) — keep
- [ ] Audit log for every mutation + role change + login failures
- [ ] Dependency audit `npm audit --production` in CI (allow-list reviewed)

---

## 5. Performance Budget

| Metric | Target |
|---|---|
| Lighthouse (dashboard, logged-in admin) | ≥ 90 perf, ≥ 95 a11y |
| List page TTFB (server paginated) | < 300 ms @ 5k rows |
| Availability RPC | < 50 ms for 30-day window, 1k items |
| Payroll run (100 staff) | < 3 s |
| Bundle | no route > 250 kB first-load JS (recharts lazy-loaded) |

**Practices**: RSC by default; `select('...')` explicit columns (never `*` in production queries); `.range()` pagination; DB indexes from DATABASE §6; matviews for reports; `next/dynamic` for charts/PDF; image `next/image` + storage CDN; React `Suspense` skeletons; no waterfall fetches (parallel `Promise.all`).

---

## 6. Observability & Ops

- `audit_log` + Supabase logs (Auth/Postgres) reviewed weekly.
- Error boundary + `sonner` errors with i18n keys; add optional Sentry (`@sentry/nextjs`) in Phase 10.
- DB backup: Supabase PITR + weekly `pg_dump` to private storage; **restore drill** documented in runbook.
- `pg_cron` (Phase 9): nightly `p_refresh_materialized_views()`, overdue invoice status sweep, follow-up/notification digests, quote expiry.
- Feature flags: `system_settings.features JSONB` to toggle risky modules (public quote link, overbooking) without redeploy.

---

## 7. Release Process

1. Branch → PR → CI green (lint/type/test/build/db:validate).
2. Schema change? → migration idempotent → `db:validate` → `supabase db push` on staging → re-merge `schema.sql` → `supabase:gen`.
3. Vercel preview deploy → Playwright smoke on preview.
4. Merge → production deploy → verify health (login, one create, one report).
5. Tag release + update `docs/DEVELOPMENT_PLAN.md` phase checkboxes.

---

## 8. Definition of Done (recap)

Feature tabtab hai jab:
1. Server action/RPC + zod + `requireRole` + RLS policy covered by test.
2. `npm run check` (lint + type + unit + db:validate) green.
3. Loading / empty / error / permission-denied states present.
4. Mobile responsive + keyboard navigable + i18n (hi/en) strings added.
5. Audit log written for mutations; docs (`MODULES.md`) updated.
6. No `alert()`, no `console.error` as user-facing feedback, no `any` in new code.
