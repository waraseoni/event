# Event Management Software — Master Development Plan

> **Stack**: Next.js 16 (App Router, RSC + Server Actions) · Supabase (PostgreSQL + Auth + Storage + Realtime) · Tailwind CSS v4 · TypeScript 6
> **DB**: single consolidated idempotent schema `supabase/schema.sql` (35 tables) + incremental `supabase/migrations/`
> **Docs**: [ARCHITECTURE](./ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [MODULES](./MODULES.md) · [QUALITY](./QUALITY.md)

---

## 1. Vision

Ek **owner-centric event rental + event execution business OS** — jahan:

- **Owner ka maal** (items) ek hi catalog me ho — company, model, scope, type, target event, estimated rent price ke saath.
- **Clients** ka poora CRM ho — enquiry → meeting → quote → event → invoice → payment → repeat.
- **Staff/worker** ki salary, attendance, bonus, commission automatically calculate ho.
- **Maal ka outward/inward rental** (dusre se lena, dusre ko dena) contract-based track ho.
- **Double-booking na ho** — ek hi samay me item ke hisab kitne events chal sakte hain, system khud bataye.
- **Meeting ke dauran price live change** ho — rate override, discount, versioning, approval ke saath.

---

## 2. Current State (Audit Summary — 2026-09-27)

### ✅ Already good
- Consolidated idempotent `schema.sql` (35 tables, 60 RLS policies, 8 functions) + PGlite-based validation harness in `supabase/validation/`.
- Role model `super_admin | admin | accountant | staff` with `role_rank()`, `can_assign_role()` and privilege-escalation guards.
- Working pages: Dashboard, Contacts, Clients, Events, Inventory, Pricing, Rentals, Billing, Reports, Staff, Users, Settings, Login.
- `users` module is a complete, secure reference implementation (server actions + `requireCurrentUser()` + `revalidatePath`).

### ❌ Critical defects (must fix before new features)
| # | Defect | Where |
|---|---|---|
| D1 | **7 tables have no RLS** → world-readable/writable via anon key: `payments`, `invoice_items`, `external_rentals`, `worker_assignments`, `item_serials`, `maintenance_records`, `special_rates` | `schema.sql` |
| D2 | `system_settings` has **no INSERT policy** → Settings seed-insert fails for every role | `schema.sql:1236` |
| D3 | Event create **always fails** — inserts non-existent `customer_name`, `customer_id` nullable-but-NOT-NULL | `components/events/add-event-button.tsx:29` |
| D4 | Inventory create **always fails** — omits NOT NULL `category`, sends non-existent `notes` | `app/inventory/page.tsx:118` |
| D5 | `src/types/supabase.ts` is **stale** — describes `events.client_id`, `contacts.type='other'`, missing 2 tables + 4 functions | `src/types/supabase.ts` |
| D6 | 6 dead modules (`lib/actions/index.ts`, `lib/actions/inventory.ts`, `lib/validators/index.ts`, `lib/queries/keys.ts`, `lib/pdf/index.ts`, `api/pdf/route.ts`) — none imported | `src/lib`, `src/app/api` |
| D7 | 20 of 35 tables have **zero UI/logic**: `quotes`, `quote_items`, `event_staff`, `event_tasks`, `event_expenses`, `rental_contract_items`, `attendance`, `staff_advances`, `commission_rules`, `bonuses`, `payroll_entries`, `invoice_items`, `expenses`, `notifications`, `audit_log`, `stock_movements`, `item_serials`, `maintenance_records`, `special_rates`, `worker_assignments` | — |
| D8 | No server-side data fetching, no pagination (`select('*')` everywhere), no error/loading boundaries, no tests | `src/app/**` |
| D9 | Writes run from browser → `staff`/`accountant` roles get RLS rejections surfaced as `alert()` | all pages except `/users` |

**Decision: existing schema ko bypass NAHI karenge.** Schema design sahi hai; sirf defects fix karenge aur 2–3 surgical additions karenge (DATABASE.md dekhiye). Frontend layer ko **rewrite** karenge (server-first + server actions) kyunki wahi sabse kamzor hissa hai.

### 2.1 Working-tree status (session end, uncommitted)
Audit ke dauran repo me kuch **mere alawa** changes aaye (doosre session/agent ke): `src/types/supabase.ts` regenerate kiya gaya (offline `supabase/validation/gen-types.js` PGlite-introspection se), `assert-schema.js` me drift-guard assertions added, `add-event-button.tsx` fix (D3), `browser.ts` typed `createBrowserClient<Database>`, `src/types/index.ts` aligned.

**Effect**: D5 ab **deliberately visible** ho gaya — stale types ke neeche chhupa 9 type errors ab `npm run type-check` par surface ho rahe hain (clients/events/inventory/rentals/staff/pricing/recent-events insert payloads, `AddEventButton` default export). Ye **Phase 0 ka pehla kaam** hai:
1. `npm run type-check` → 0 errors (payload me required columns `category`, `description`, `event.end_date`, `applicable_days` etc. add karo / nullable flags set karo).
2. `events.customer_id` NOT NULL (D3 ka root cause) → migration 0004 §2.3 dekhiye.
3. `npm run db:validate` green + CI me `supabase:gen`/`gen-types.js` diff-check.

In changes ko **commit na karein** jab tak type-check green na ho.

---

## 3. Non-Goals (v1 me nahi)

- Multi-tenant SaaS (ek owner = ek org). Schema me `org_id` ki jagah ready rehne ke liye sirf conventions follow karenge, actual tenant split phase-later.
- Native mobile app (responsive PWA + WhatsApp share links se kaam chalega).
- Accounting/GST portal filing (invoice + GST calc + TDS tak; return filing baad me).
- Barcode/QR hardware integration ka deep driver support (QR generate + camera scan browser API se enough).

---

## 4. Phase Roadmap

> Har phase: **Goal → Scope → Deliverables → Acceptance Criteria (AC)**.
> Estimate = ek developer ke working days. Dependencies linear hain (numbered order).

---

### Phase 0 — Stabilize & Foundation (5 days)
**Goal**: existing app ko trustworthy banao, taaki naye features uspe safely build hon.

**Scope**
- D1–D6 defects fix (RLS policies, settings INSERT, broken inserts, type regen, dead code removal).
- **Data layer convention** establish karo: `src/lib/actions/*` (server actions, zod-validated) + `src/lib/api/*` (read queries) + RPC-first for money/concurrency.
- TanStack Query add karo (client cache + optimistic + invalidation) — `package.json` me abhi nahi hai.
- `error.tsx` / `loading.tsx` / `not-found.tsx` for every route group.
- Convention docs: naming, folder structure, RLS role matrix (ARCHITECTURE.md).

**Deliverables**
- `supabase/migrations/0004_security_and_defects.sql`
- `npm run type-check` + `npm run lint` zero errors; `npm run supabase:gen` se fresh `src/types/supabase.ts`
- Shared: `src/lib/actions/action.ts` (existing `serverAction()` wrapper), `src/hooks/use-query.ts`

**AC**
- [ ] `payments`/`invoice_items` anon key se read/write **fail** hota hai
- [ ] Naya event create hota hai (client inline create ke saath)
- [ ] Naya inventory item create hota hai (category + notes ke saath)
- [ ] Settings pehli baar save karne par row seed hoti hai
- [ ] `npm run build` clean

---

### Phase 1 — Item Catalog (Owner ke uplabdh items) (7 days)
**Goal**: owner ke saare maal ka single source of truth — poori list with company/model/scope/type/target event/estimated rent price.

**Scope** (MODULES.md → M1)
- Master item list: grid/table toggle, full-text + facet filters (category, company, type owned/leased, scope, target event, status, location, price range), sorting, **pagination + server-side search**, CSV import/export.
- Item detail page `/inventory/[id]`: specs, images, serials (QR), stock ledger, rental history, maintenance, utilization, margin.
- Categories (hierarchical), Locations (godowns), Serials + QR generate/print, Stock movements ledger (mandatory on every qty change), Maintenance schedule.
- Item **rate card**: base rate (daily/weekly/monthly/per_event) + weekend + quantity slabs + season `special_rates`.
- `max_parallel_events` per item → capacity rule.

**Deliverables**: `/inventory`, `/inventory/[id]`, `/inventory/new`, `/inventory/categories`, `/inventory/locations`, `/inventory/maintenance`

**AC**
- [ ] Item me `company, model, scope, item_type, target_event_types[], estimated_rent_price, min_price, security_deposit, location, category` sab save/edit ho raha hai
- [ ] Har qty change pe `stock_movements` row banti hai with running balance
- [ ] QR scan → item detail page
- [ ] 5000 items par list < 300ms (server-side pagination + index)

---

### Phase 2 — Availability & Concurrency Engine (6 days)
**Goal**: *"ek hi samay me item ke hisab se kitne events organise kar sakte hain"* — system authoritative answer de.

**Scope** (MODULES.md → M2)
- RPC `fn_available_qty(item_id, from_ts, to_ts, exclude_event_id)` — event_items ke pickup/return windows + rental_contracts (in/out) + maintenance ko overlap check karta hai.
- RPC `fn_create_event_with_items(...)` — **single transaction**, `pg_advisory_xact_lock` per item → race-condition-proof booking. Naam `fn_...`/`p_...` naming DATABASE.md me.
- `inventory_items.max_parallel_events` — simultaneous event cap per item.
- **Conflict report**: `fn_conflicts_for_window(from,to)` → kaun sa item kitne events me already reserved hai, kaunsa shortage hai (shortfall qty ke saath).
- UI:
  - Event form me **live availability chip** per line (green/amber/red + "2 shortage → Rent In suggest karo")
  - `/availability` page: date-range picker + matrix (rows = items, columns = days, cells = booked qty)
  - **Timeline/Gantt** view (recharts ya dhtmlx-style custom): parallel events per item
- Overbooking policy: admin override (reason mandatory + audit log) ya hard block — setting `system_settings.allow_overbooking`.

**Deliverables**: 3 RPCs + 1 policy, `/availability` page, event form availability integration, unit tests for overlap logic.

**AC**
- [ ] Do parallel requests me same item overbook **nahi** hota (PgTAP/PGlite test)
- [ ] Item A ke 3 units aur 3 events already booked → 4th event ko exactly "shortage 1" dikhata hai
- [ ] Maintenance window ke duran item unavailable
- [ ] Rented-in item bhi availability pool me count hota hai (source='rented_in')

---

### Phase 3 — Client Management (CRM) (7 days)
**Goal**: poora client lifecycle — enquiry se repeat business tak.

**Scope** (MODULES.md → M3)
- `/clients` list + `/clients/[id]` **360° profile**: contact info, credit days, segment, source, follow-up date, GSTIN, billing address, documents.
- **Activity timeline**: calls, meetings, notes, follow-ups (naya table `client_interactions`), auto-logged from quote/event/payment events.
- **Client ledger** (udhaar/khata): invoices + payments → running balance + aging (0-15/16-30/31-60/60+) + `fn_contact_ledger(contact_id, from, to)`.
- **Pipeline kanban**: New → Contacted → Meeting → Quoted → Won → Lost, drag-drop stage change, conversion % report.
- Follow-up dashboard: aaj ke due follow-ups + overdue + WhatsApp/call one-click.
- Segment-wise revenue, repeat-rate, top clients (reports me).
- Duplicate detection on create (phone/email fuzzy match).

**Deliverables**: `/clients`, `/clients/[id]`, `/clients/pipeline`, `/clients/followups`, `client_interactions` migration.

**AC**
- [ ] Client page par uske saare events, quotes, invoices, payments, ledger balance ek jagah
- [ ] Ledger balance = `SUM(invoices) - SUM(payments)` exactly match kare
- [ ] Follow-up date cross hone par dashboard alert

---

### Phase 4 — Quote Builder / Meeting Mode + Dynamic Pricing (9 days)
**Goal**: *"jab client ke saath meeting ho rahi ho to item ke hisab price me changes"* — live, negotiated, versioned pricing.

**Scope** (MODULES.md → M4)
- **Pricing engine** (pure function + RPC `fn_quote_line(item_id, qty, days, date)`):
  base rate → duration slab → quantity slab → weekend/season multiplier (`special_rates`) → discount → line total. Rate source har line par visible (`rate_from_system` vs `rate_applied`).
- `/quotes/new` **Meeting Mode**: left = item picker (search by category/company/scope, live availability badge, estimated price), right = running cart with qty/days/rate/discount, top = live subtotal/GST/grand total + margin.
- **Rate override**: `rate_applied` ≠ `rate_from_system` → `override_reason` mandatory + threshold-based approval (discount > `system_settings.discount_approval_threshold`% → admin approve).
- **Quote versioning**: revise → v2 (parent_quote_id) + side-by-side diff.
- **Client-facing share link**: `/q/[token]` public read-only quote (no auth, token-scoped RLS) + WhatsApp share text + PDF download.
- Status flow: draft → sent → negotiating → approved/rejected → **converted to event** (items auto-copy into `event_items`, availability reserve).
- Quote → proforma/Payment link → invoice.

**Deliverables**: `/quotes`, `/quotes/[id]`, `/quotes/new` (meeting mode), `p_quote_convert`, public `/q/[token]`.

**AC**
- [ ] Meeting me rate change karte hi line total + grand total + GST live update
- [ ] Override bina reason ke save nahi hota; threshold se upar approval lagta hai
- [ ] Quote approve karne par ek click me event ban jaaye aur availability reserve ho jaye
- [ ] Client link bina login ke quote dekh sake
- [ ] v1 vs v2 diff dikhe

---

### Phase 5 — Event Lifecycle & Operations (9 days)
**Goal**: enquiry/quote se lekar event close tak ka poora operations workflow.

**Scope** (MODULES.md → M5)
- `events.stage` column (business `status` alag): `enquiry → booked → planning → dispatch → setup → live → teardown → settlement → closed`.
- `/events` (filters + calendar) + `/events/[id]` **command center** with tabs:
  - **Overview**: client, venue, dates, advance, totals, profitability (revenue − item cost − staff cost − expenses)
  - **Items**: assignment + pickup/return (picked/returned/damaged qty), e-sign, condition photos
  - **Staff**: assign `event_staff` with wage basis/days/OT → live cost
  - **Tasks**: kanban `event_tasks` (todo/doing/done, priority, due), assignee, checklist templates per event type
  - **Expenses**: `event_expenses` (category, paid_to, paid/unpaid) + attachments
  - **Documents**: contract, invoice, photos (storage `event-documents` bucket)
  - **Payments**: advance + balance + receipts
  - **Timeline**: status history (`event_status_history`) + audit
- Event-type **templates**: "Wedding" se auto-seed required items + tasks (reuse `target_event_types`).
- Dispatch sheet / return checklist print (PDF).
- Post-event auto-checklist: pending returns, unpaid balance, staff attendance pending.

**Deliverables**: `/events`, `/events/[id]`, `event_status_history`, `event_templates`, dispatch/return workflows.

**AC**
- [ ] Event ke saare items pickup/return qty ke saath close ho sakte hain, damaged qty pe auto `maintenance_records` suggestion
- [ ] Event profitability real numbers dikhaye (item cost + staff + expenses se)
- [ ] Staff double-booking (do events ek din me same staff) block/warn ho
- [ ] Stage change ke bina event "closed" nahi ho sakta

---

### Phase 6 — In/Out Rental Contracts (6 days)
**Goal**: *"owner kabhi kabhi dusre se item rent par leta hai aur kabhi dusro ko deta hai"*.

**Scope** (MODULES.md → M6)
- Unified `rental_contracts` (`direction: in | out`) + **line items** (`rental_contract_items`) — ab tak sirf header banta tha.
- **IN flow**: vendor select → items/qty/rate → approval → dispatch → receive (QC + condition) → return → payment due → close. Inward stock `stock_movements` (`rent_in`) se badhta hai aur availability pool me add hota hai.
- **OUT flow**: client/other renter → items (availability check) → agreement PDF (terms, deposit, liability) → dispatch → recall → damage deduction → deposit refund → close. Outward movement `rent_out`.
- Security deposit tracking (refundable, settlement pe `payments` se).
- Transport cost, TDS/TCS on rent-in, vendor payment schedule + due reminders.
- **Vendor/renter ledger** same engine se (contacts type vendor/renter).
- Conflict: contract window vs event window dono availability me.

**Deliverables**: `/rentals` (tabs In/Out), `/rentals/[id]`, agreement PDF, vendor dues report.

**AC**
- [ ] In-contract receive ke baad item "available" count badhta hai
- [ ] Out-contract dispatch ke baad item availability me se ghata + event bhi book kar sake us item ko
- [ ] Deposit refund pe accounting entry sahi
- [ ] Vendor ko kitna udhaar baaki hai — ledger + aging

---

### Phase 7 — Staff & Payroll Engine (10 days)
**Goal**: *"unki salary, bonus, commission calculate"* — fully automated payroll.

**Scope** (MODULES.md → M7)
- `/staff` list + `/staff/[id]`: profile, employment type, base salary/daily wage, bank/IFSC/PAN/Aadhaar, documents, attendance calendar, advances, commission rules, bonuses, event history, performance.
- **Attendance**: monthly grid, bulk mark, event-linked, half-day/OT, holiday/weekoff config; QR check-in on site (phase-later hook).
- **Advance**: `staff_advances` + auto recovery schedule → deducted from payroll until recovered.
- **Commission**: `commission_rules` basis = `event_revenue | event_profit | payment_collected`, flat % **ya slabs JSONB** (`[{upto,percent}]`), applied on completed/paid events.
- **Bonus**: `bonuses` (performance/festival/referral/custom), fixed amount **ya formula** (e.g. `event_profit * 0.05`).
- **Payroll engine** (RPC `p_generate_payroll(period_from, period_to, staff_ids)` → `payroll_runs` + `payroll_entries`):
  ```
  gross   = attendance days × daily_wage        (daily)
         OR base_salary × (days present / days in period)   (permanent)
         + OT hours × ot_rate
         + commission(basis, slabs)
         + bonuses
  deduct  = advance recovery + absence deduction + penalty + TDS/PF/ESI (config)
  net     = gross − deduct
  ```
  Components `payroll_entries.components` JSONB me itemized (payslip ke liye).
- Payroll run flow: draft → approve (lock) → pay (creates `payments` party_type='staff' + `payroll_entries.payment_id`).
- **Payslip PDF**, salary register, monthly payroll cost by department/designation.
- Payroll RLS: `accountant/admin` only (already exists).

**Deliverables**: `/staff`, `/staff/[id]`, `/attendance`, `/payroll`, `/payroll/[run_id]`, `p_generate_payroll`, payslip PDF.

**AC**
- [ ] Ek click me poore mahine ki payroll generate ho, har staff ka gross/deduction/net itemized
- [ ] Commission slab test case pass (0–5L 2%, 5–10L 3%)
- [ ] Advance recovery tab tak automatically deduct ho
- [ ] Payroll approve ke baad entries edit-locked
- [ ] Payslip me components sahi

---

### Phase 8 — Billing, Invoices & Money (7 days)
**Goal**: invoice → payment → reconciliation → GST-ready.

**Scope** (MODULES.md → M8)
- Invoice from event/quote/rental-out contract: line items copy, discount, round-off, **CGST/SGST/IGST** (state_code logic), TDS.
- `fn_next_doc_no(prefix)` — INV/QU/EV sequential with year (race-safe via advisory lock).
- Payment recording with allocation (partially paid → `amount_due`), modes cash/UPI/cheque/bank/card, receipts PDF.
- Client dues dashboard + aging + auto overdue status (`invoices.status='overdue'` via cron/`pg_cron`).
- Credit notes / cancel invoice (with audit).
- `/billing` detail + `/invoices/[id]`, PDF via `@react-pdf/renderer` (abhi stub), email/WhatsApp share.
- `expenses` ledger (non-event + event), vendor payments → P&L.

**Deliverables**: `/billing`, `/invoices/[id]`, `p_next_doc_no`, PDF service, dues report.

**AC**
- [ ] GST invoice sahi split (CGST/SGST intra-state, IGST inter-state) + round-off
- [ ] Partial payment ke baad status `partially_paid`, zero due par `paid`
- [ ] PDF print me company logo/terms/HSN dikhe
- [ ] Doc numbers gapless aur duplicate-free (concurrency test)

---

### Phase 9 — Reports, Dashboard, Notifications, Audit (6 days)
**Goal**: owner ko roz ke decisions ke liye data.

**Scope** (MODULES.md → M9)
- **Dashboard v2**: revenue vs expense trend, upcoming events, item utilization, staff on duty, dues, follow-ups, low-stock reorder, maintenance due, conflict warnings.
- **Reports**: P&L (monthly/ yearly/ per event), item utilization & idle cost, booking capacity, client/vendor/staff analytics, top items by margin, GST summary, payroll cost, receivables/payables aging.
- Materialized views `mv_*` + `p_refresh_materialized_views()` (pg_cron daily).
- **Notifications**: bell (Topbar ab non-functional) + `notifications` INSERT via SECURITY DEFINER RPC; triggers for: payment due, follow-up due, item shortage, maintenance due, payroll pending, quote expiry.
- **Audit log viewer** (`/settings/audit`) — filters by user/entity/date, diff view.
- Export: CSV/XLSX + scheduled email (phase-later).

**AC**
- [ ] P&L = revenue − item cost − staff − expenses − vendor rent, aur reconcile ho
- [ ] Bell me real notifications aati hain, mark-as-read kaam karta hai
- [ ] Koi bhi record update par audit row with old/new values

---

### Phase 10 — Hardening, QA, Performance, Launch (7 days)
**Goal**: production-ready.

**Scope**: [QUALITY.md](./QUALITY.md) — vitest unit + PGlite RPC tests, Playwright e2e (smoke of all modules), Lighthouse > 90, RBAC matrix test, RLS penetration tests (anon/authenticated/staff/accountant/admin), rate limiting, audit of secrets, backup/restore drill, Vercel preview+prod CI, README + ops runbook, seed demo data.

**AC**
- [ ] CI me lint + type-check + test + build green
- [ ] Har role ke liye allowed/denied API matrix automated test
- [ ] 0 console errors prod build
- [ ] Rollback + DB backup documented & tested

---

## 5. Effort Summary

| Phase | Days | Cumulative |
|---|---:|---:|
| 0 Stabilize | 5 | 5 |
| 1 Item Catalog | 7 | 12 |
| 2 Availability Engine | 6 | 18 |
| 3 Client CRM | 7 | 25 |
| 4 Quote/Meeting Mode | 9 | 34 |
| 5 Event Lifecycle | 9 | 43 |
| 6 Rentals In/Out | 6 | 49 |
| 7 Staff & Payroll | 10 | 59 |
| 8 Billing & GST | 7 | 66 |
| 9 Reports/Notifications | 6 | 72 |
| 10 Hardening/QA | 7 | **79** |

~16 working weeks (1 dev). Parallel me 2 devs → ~9–10 weeks (Phase 1+3 ek saath, Phase 6+7 ek saath chal sakte hain; Phase 2 baaki sab ka dependency hai isliye pehle).

---

## 6. Priority / MoSCoW

**Must (v1 launch)**: P0, P1, P2, P4, P5, P6, P7, P8
**Should**: P3 (CRM depth), P9 (reports core)
**Could**: public quote link, QR check-in, notifications depth, matviews, client portal
**Later**: multi-tenant, WhatsApp API deep integration, GST e-invoicing, offline PWA sync

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| RLS + browser writes → role failures | Sab writes server actions se (P0 me convention lock) |
| Availability race conditions | RPC + advisory locks + PGlite concurrency tests (P2) |
| Stale `types/supabase.ts` → silent bugs | `npm run supabase:gen` CI step me mandatory (P0) |
| Schema drift (schema.sql vs live DB) | Single source `schema.sql`; migrations sirf incremental; validation harness |
| Money rounding errors | `numeric(14,2)`, ROUND half-up ek hi helper, totals DB me compute |
| Scope creep in quotes/events | Phase gates + AC checklist sign-off per phase |

---

## 8. Definition of Done (har feature)

1. Zod-validated server action (ya RPC) + RLS policy test.
2. `npm run lint` + `npm run type-check` clean.
3. Loading + empty + error states.
4. Responsive (mobile ≥ 360px) + keyboard accessible.
5. Audit log entry for mutations.
6. Updated module doc in `docs/MODULES.md`.
