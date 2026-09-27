# Architecture

> Part of [DEVELOPMENT_PLAN](./DEVELOPMENT_PLAN.md) · [DATABASE](./DATABASE.md) · [MODULES](./MODULES.md) · [QUALITY](./QUALITY.md)

---

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | RSC + Server Actions + Route Handlers |
| Language | TypeScript 6 (strict) | `npm run type-check` |
| DB | Supabase Postgres | single project `dxinfzajqemeuvamvsbr` |
| Auth | Supabase Auth (email/password) + middleware session | `@supabase/ssr` |
| Authz | **Row Level Security** (4 roles) + server-action guards | never trust client role |
| Styling | Tailwind CSS v4 + `tailwindcss-animate` | `src/app/globals.css` |
| UI kit | Existing `src/components/ui/*` (Radix-based) | dialog, sheet, table, tabs, form, calendar, toast(sonner) |
| Tables | `@tanstack/react-table` | server pagination + sorting |
| Client cache | **TanStack Query** (add in P0) | keys in `src/lib/queries/keys.ts` |
| Forms | react-hook-form + zod v4 + `@hookform/resolvers` | schemas in `src/lib/validators/*` |
| Charts | recharts 3 | reports/dashboard |
| PDF | `@react-pdf/renderer` (add in P8) | invoice, payslip, agreement, dispatch sheet |
| i18n | `src/contexts/language-context.tsx` (hi/en) | labels in `src/constants/languages.ts` |
| Deploy | Vercel | preview per PR |

---

## 2. Folder Structure (target)

```
src/
├── app/
│   ├── (app)/                      # authed layout group (sidebar+topbar)
│   │   ├── page.tsx                # dashboard
│   │   ├── inventory/
│   │   │   ├── page.tsx            # list (RSC + searchParams)
│   │   │   ├── [id]/page.tsx       # item detail
│   │   │   ├── new/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── locations/page.tsx
│   │   │   └── maintenance/page.tsx
│   │   ├── availability/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   └── followups/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx        # meeting mode
│   │   │   └── [id]/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       # command center (tabs)
│   │   ├── rentals/
│   │   │   ├── page.tsx            # tabs: in / out
│   │   │   └── [id]/page.tsx
│   │   ├── staff/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── attendance/page.tsx
│   │   ├── payroll/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       # run detail + payslips
│   │   ├── billing/  invoices/  expenses/
│   │   ├── reports/  settings/  users/
│   │   └── notifications/page.tsx
│   ├── auth/login/page.tsx
│   ├── q/[token]/page.tsx          # PUBLIC quote (no session)
│   ├── api/pdf/route.ts            # PDF render (P8)
│   ├── layout.tsx  globals.css
│   ├── error.tsx  loading.tsx  not-found.tsx
├── components/
│   ├── ui/                         # primitives (existing)
│   ├── layout/                     # sidebar, topbar, language-switcher
│   ├── shared/                     # data-table, filter-bar, confirm-dialog,
│   │                               # money, status-badge, empty/error, pager
│   ├── inventory/ clients/ quotes/ events/ rentals/
│   ├── staff/ payroll/ billing/ reports/ dashboard/
├── lib/
│   ├── actions/                    # 'use server' — ALL mutations
│   │   ├── _core.ts                # serverAction(), zodServerAction(), guards
│   │   ├── inventory.ts  contacts.ts  quotes.ts  events.ts
│   │   ├── rentals.ts    staff.ts     payroll.ts  billing.ts
│   ├── queries/                    # RSC read functions + queryKeys
│   ├── supabase/                   # browser.ts, server.ts(service), session.ts
│   ├── pricing/                    # pure pricing engine (TS mirror of RPC)
│   ├── payroll/                    # pure payroll calc (TS mirror of RPC)
│   ├── pdf/                        # document templates
│   └── validators/                 # zod schemas (single source)
├── hooks/                          # use-query, use-debounce, use-availability
├── types/                          # supabase.ts (generated) + index.ts (domain)
└── middleware.ts
```

**Rules**
- `src/app` pages = RSC shells; heavy data reads via `lib/queries/*` (server) with `supabaseRequest()`; interactive islands are `'use client'`.
- **No** `supabase.from(...).insert/update/delete` inside `'use client'` components — mutations only through `lib/actions/*`.
- Browser client (`supabaseBrowser`) is allowed for **realtime subscriptions and public token reads only**.

---

## 3. Data Flow Patterns

### 3.1 Read (server-first)
```ts
// src/lib/queries/events.ts
export async function listEvents(q: EventQuery) {
  const supabase = await supabaseRequest();     // caller JWT → RLS applies
  const { data, error } = await supabase
    .from('events').select('*, client:contacts(name,phone), items:event_items(count)')
    .range(q.offset, q.offset + q.limit - 1)
    .order('event_date', { ascending: false });
  if (error) throw new AppError(error);
  return data;
}
```
Page: `const events = await listEvents(parse(searchParams))` → Suspense boundary.

### 3.2 Write (server action + zod)
```ts
// src/lib/actions/_core.ts  (reuse existing actions/index.ts:8 serverAction)
export const createItem = zodServerAction(createItemSchema, async (input) => {
  await requireRole('super_admin', 'admin');
  const supabase = await supabaseRequest();
  const { data, error } = await supabase.from('inventory_items').insert(input).select().single();
  if (error) throw new AppError(error);
  await audit('create', 'inventory_items', data.id, null, input);
  revalidatePath('/inventory');
  return data;
});
```
Client: `useAction`/`startTransition` + `sonner` toast + TanStack Query `invalidateQueries`.

### 3.3 Money / concurrency / multi-row (RPC only)
Agar operation me **do ya zyada tables** badal rahe hain, ya **stock/availability/paisa** involved hai → Postgres function (`p_*` write, `fn_*` read) transaction ke andar:
`p_create_event_with_items`, `p_convert_quote`, `p_receive_rental_in`, `p_generate_payroll`, `p_issue_invoice`, `p_next_doc_no`, `fn_available_qty`, `fn_contact_ledger`.

### 3.4 Optimistic UI
List mutations par `useOptimistic` + rollback; complex flows par explicit refetch.

---

## 4. Auth & Authorization

```
Browser ──middleware(session)──▶ route allowed?
   │
   ├─ public: /auth/login, /q/[token], /api/pdf?token=
   └─ authed: everything else
         │
         ▼
   Server Action / RSC ── supabaseRequest() [user JWT] ──▶ Postgres RLS
                                      │
                                      └─ service-role ONLY in:
                                         - auth.admin.createUser  (lib/supabase/server.ts)
                                         - pg_cron/system jobs
                                         - seed scripts
```

| Concern | Rule |
|---|---|
| Client role check | **display only** (`useCurrentUser`), DB re-checks |
| Server guard | `requireCurrentUser()` / `requireRole(...)` in every action (pattern: `actions/users.ts:75`) |
| Public quote | token column + RLS `USING (token = current_setting('request.jwt.claims'...))` — simpler: dedicated `SECURITY DEFINER fn_quote_by_token(token)` read-only |
| RLS matrix | 4 roles × 35 tables — authoritative list in `supabase/migrations/0003_rls.sql` + `DATABASE.md §5` |
| Payments/invoice_items | RLS **must** be added (defect D1) |
| Notifications insert | via `p_notify(...)` SECURITY DEFINER (no direct INSERT policy) |

**Role capabilities**
- `super_admin`: everything incl. user management, audit, destructive ops, RLS-adjacent settings.
- `admin`: all business data + approvals (discount override, payroll approve, quote convert).
- `accountant`: money views — payments, invoices, payroll, expenses, reports; no master-data delete.
- `staff`: own profile, assigned events/tasks, attendance, item lookup; no money tables (except read of own payroll per policy).

---

## 5. Conventions

- **Files**: kebab-case files, PascalCase components, `*.server.ts` for server-only.
- **DB**: `snake_case` tables plural (`event_items`), `p_*` = procedure/mutation, `fn_*` = query function, `mv_*` = materialized view, `idx_*` index, every table has `id uuid`, `created_at`, `updated_at` + trigger (logs exempt).
- **IDs**: uuid v4 (existing). Document numbers via `p_next_doc_no(prefix)`.
- **Money**: `numeric(12,2)` in DB, `number` in TS, format with `formatMoney()` in `lib/utils.ts`, never float math — round in one place (`round2()`).
- **Dates**: DB `timestamptz`/`date`, TS `date-fns`; event date range = `event_items.pickup_datetime → return_datetime`.
- **Errors**: throw `AppError(code, messageKey)` → server action returns `{ok:false, error}` → `sonner` toast with i18n key. No `alert()`.
- **i18n**: all UI strings via `t('key')`; new keys added to `constants/languages.ts` (hi + en).
- **Validation**: zod schema per entity in `lib/validators/*` — used by both client form and server action.
- **Tests**: RPC logic → PGlite (`supabase/validation`), pure calc → vitest, flows → Playwright (QUALITY.md).

---

## 6. State & Rendering Strategy

| Need | Approach |
|---|---|
| Lists with URL filters | RSC + `searchParams` (shareable, SEO-none but bookmarkable) |
| Live availability in forms | client hook → `fn_available_qty` via action (debounced 250ms) |
| Realtime (event status, notifications) | Supabase Realtime channel → TanStack Query update |
| Long operations (payroll run, PDF) | server action + `sonner.loading` → invalidate |
| Heavy tables | server pagination + `@tanstack/react-table` client sort only on page |

---

## 7. Security Checklist (per feature)

- [ ] Mutation server action only; no direct client write
- [ ] `requireRole` on server + RLS policy on table (defense in depth)
- [ ] Zod schema rejects unknown fields (`.strict()`)
- [ ] Audit log row for create/update/delete
- [ ] No secrets in client bundle (`SUPABASE_SERVICE_ROLE_KEY` server-only — already guarded)
- [ ] Public routes: token-scoped, rate-limited
- [ ] File uploads: mime + size allowlist, path prefix per entity
