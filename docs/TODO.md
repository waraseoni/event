# Implementation TODO — Sequenced Task List

> Source: [DEVELOPMENT_PLAN](./DEVELOPMENT_PLAN.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [MODULES](./MODULES.md) · [QUALITY](./QUALITY.md)
>
> **नियम**: tasks सिर्फ ऊपर→नीचे order में. एक phase के AC green होने के बाद ही अगला start. हर task का output = working code + `npm run check` green.
> Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `⛔` blocked by

---

## P0 — Stabilize & Foundation (5 days)

### 0.1 Working tree clean करो (सबसे पहले)
- [ ] `git status` → uncommitted changes review करो (`src/types/supabase.ts`, `src/types/index.ts`, `src/lib/supabase/browser.ts`, `src/components/events/add-event-button.tsx`, `supabase/validation/{gen-types,sql-split,assert-schema}.js`)
- [ ] `npm run type-check` → **9 errors fix** करो:
  - [ ] `src/app/clients/page.tsx:36` insert payload missing required columns
  - [ ] `src/app/events/page.tsx:5` `AddEventButton` named→default export mismatch
  - [ ] `src/app/inventory/page.tsx:130,134` payload missing `category`/`description` + unknown `notes`
  - [ ] `src/app/rentals/page.tsx:38` null vs string
  - [ ] `src/app/staff/page.tsx:49` `employment_type` union mismatch
  - [ ] `src/components/contacts/contacts-list.tsx:30` filter type
  - [ ] `src/components/dashboard/recent-events.tsx:80` nullable number
  - [ ] `src/components/events/add-event-button.tsx:70` payload missing `end_date`/`total_expenses`/`profit_loss`/`created_at`
  - [ ] `src/components/pricing/add-pricing-button.tsx:55` payload missing `applicable_days`/`weekend_rate`/`slab`
- [ ] `npm run lint` + `npm run build` + `npm run db:validate` सब green
- [ ] ये changes एक commit में: `fix: align app code with regenerated database types`

### 0.2 Migration 0004 — Security & defect fixes
- [ ] `supabase/migrations/0004_security_and_defects.sql` लिखो (idempotent, DATABASE §2):
  - [ ] 7 tables पर RLS enable + policies: `payments`, `invoice_items`, `external_rentals`, `worker_assignments`, `item_serials`, `maintenance_records`, `special_rates`
  - [ ] `system_settings` INSERT policy + `p_seed_settings()`
  - [ ] `events.customer_name` add, `customer_id` DROP NOT NULL (+ `CHECK` `booked_requires_client`), `event_type`, `end_date`
  - [ ] `inventory_items.notes` add, `category` DROP NOT NULL
  - [ ] `p_notify()` SECURITY DEFINER (notifications insert channel)
- [ ] `supabase/validation/assert-schema.js` में assertions जोड़ो (रोल-policy per table, no-RLS-table = 0)
- [ ] `node supabase/validation/assert-schema.js` green
- [ ] `npm run db:migrate` (staging/live) → फिर `schema.sql` में re-merge
- [ ] `npm run supabase:gen` (या `gen-types.js`) → fresh `src/types/supabase.ts` → `type-check` still green
- [ ] `git diff` में schema.sql + migrations + types एक commit

### 0.3 Foundation layer (code conventions)
- [ ] `src/lib/actions/_core.ts`: `zodServerAction`, `requireRole`, `AppError`, `audit()`, error→i18n mapping
- [ ] `src/lib/queries/_core.ts`: `supabaseRequest()` wrapper + `paginate()` + `select` column presets
- [ ] `src/lib/queries/keys.ts` revive → TanStack Query install + `QueryClientProvider` in `components/providers.tsx`
- [ ] `package.json` scripts: `test`, `db:validate`, `db:audit`, `check`
- [ ] `vitest` setup + पहला unit test (`lib/utils.ts` round2/overlap/formatMoney)
- [ ] `src/lib/validators/*` → schema ठीक करो (`contacts.type='worker'` न कि `'other'`, `pricing rental_type` में `hourly` हटाओ, `eventSchema` → `customer_id/event_date`) और **use करना शुरू करो**
- [ ] Dead code: `lib/actions/inventory.ts` delete, orphan `components/inventory/*` → `components/shared/` में merge या delete, `lib/pdf/index.ts` stub हटाओ (P8 में वापस)
- [ ] `components/shared/`: `DataTable`, `FilterBar`, `Pager`, `Money`, `StatusBadge`, `PageHeader`, `EmptyState`, `ConfirmDialog`
- [ ] `(app)` route group layout + हर route पर `loading.tsx` / `error.tsx`; root `not-found.tsx`
- [ ] सभी pages से `alert()`/`console.error` user-feedback हटाओ → `sonner` toast
- [ ] CI workflow (`.github/workflows/ci.yml`): lint + type-check + test + db:validate + build + types-stale check
- [ ] **P0 AC**: `npm run check` green · event create होता है (client inline के साथ) · inventory item create होता है · settings पहली बार save होता है · anon key से `payments` read **fail**

---

## P1 — Inventory / Owner's Item Catalog (7 days) ⛔ P0

### 1.1 DB
- [ ] migration `0005_inventory.sql`: `inventory_items.max_parallel_events`, `weight_kg`, `warranty_upto`, `purchase_date`, `purchase_cost`, `insurance_policy`, `is_serialized`
- [ ] GIN index `idx_inventory_search` (name/company/model) + `idx_inventory_category`
- [ ] `p_move_stock(item_id, qty, movement, ref_type, ref_id, party_id, notes)` RPC (stock_movement + running_balance + item qty update, transactional)
- [ ] schema re-merge + types regen + db:validate green

### 1.2 Queries & actions
- [ ] `lib/queries/inventory.ts`: `listItems(filter, page)` (explicit columns, `.range()`), `getItem(id)` (detail bundle), `listCategories`, `listLocations`, `stockLedger(itemId)`
- [ ] `lib/actions/inventory.ts` (rewrite): `createItem`, `updateItem`, `retireItem`, `bulkUpdateItems`, `moveStock`, `createCategory`, `updateCategory`, `createLocation`, `printQr`, `exportInventoryCsv`, `importInventoryCsv` (dry-run)
- [ ] `lib/actions/maintenance.ts`: `createMaintenance`, `completeMaintenance`

### 1.3 UI
- [ ] `app/inventory/page.tsx` → RSC + URL filters + server pagination (delete legacy client-fetch code)
- [ ] `components/inventory/*`: `item-table.tsx`, `item-cards.tsx`, `item-filters.tsx`, `item-form.tsx` (5 sections per MODULES M1), `bulk-actions.tsx`
- [ ] `app/inventory/new/page.tsx` + `app/inventory/[id]/page.tsx` (tabs: Specs · Rates · Availability · Ledger · History · Maintenance · Serials · Margin)
- [ ] `app/inventory/[id]/edit/page.tsx`
- [ ] `app/inventory/categories/page.tsx` (tree CRUD + drag sort)
- [ ] `app/inventory/locations/page.tsx`
- [ ] `app/inventory/maintenance/page.tsx` (updue/overdue + new record)
- [ ] QR generate + print sheet component (svg qr, per serial/unique code)
- [ ] CSV export (filter-matched) + import wizard (column mapping + validation report)

### 1.4 Tests
- [ ] vitest: item form schema, stock math
- [ ] PGlite: `p_move_stock` balance correctness + retire-blocks-booking
- [ ] **P1 AC** (MODULES M1) जाँचो और checklist tick करो

---

## P2 — Availability & Parallel-Event Engine (6 days) ⛔ P1

### 2.1 DB (सबसे critical)
- [ ] migration `0006_availability.sql`:
  - [ ] `fn_available_qty(item, from, to, exclude_event)`
  - [ ] `fn_item_demand(from, to)` → matrix rows
  - [ ] `fn_conflicts_for_window(from, to)`
  - [ ] `fn_parallel_events(item, from, to)`
  - [ ] `p_create_event_with_items(event, items, staff)` — `pg_advisory_xact_lock(hashtext(item_id))` sorted order + re-check + insert
  - [ ] indexes: `idx_event_items_window`, `idx_events_window`, `idx_rc_items_window`, `idx_rc_window`, `idx_maintenance_active`
  - [ ] `inventory_items.max_parallel_events` (P1 से) अब enforce हो
- [ ] `supabase/validation/test-functions.js` बनाओ (overlap/half-open/pool/rent-in/rent-out/maintenance/max_parallel/concurrency — DATABASE §4.3) → `npm run db:validate`

### 2.2 Client-side
- [ ] `lib/pricing/availability.ts` (pure TS mirror) + `hooks/use-availability.ts` (debounced 250ms)
- [ ] `components/shared/availability-chip.tsx` (green/amber/red + shortfall + rent-in suggestion)

### 2.3 UI
- [ ] `app/availability/page.tsx`: window picker + matrix table + **timeline/Gantt** (items × days bars)
- [ ] `components/availability/conflict-center.tsx` (dashboard widget, next 30d)
- [ ] Event form में availability validate + shortfall message + "rent-in suggest" CTA
- [ ] `system_settings.allow_overbooking` + admin override (reason → audit + notification)
- [ ] Maintenance window block integration (P1 से automatic)

### 2.4 Tests
- [ ] PGlite concurrency test: 2 parallel save → 1 success
- [ ] **P2 AC** (MODULES M2) — "kitne events parallel" एक glance में दिखे

---

## P3 — Client Management / CRM (7 days) ⛔ P0 (P2 से independent, parallel चल सकता है)

### 3.1 DB
- [ ] migration `0007_crm.sql`: `client_interactions`, `client_documents`; `contacts` + `stage`, `gstin`, `billing_address`, `preferred_contact`, `tags`; indexes `idx_contacts_stage`, `idx_interactions_contact`
- [ ] `fn_contact_ledger(contact, from, to)` + `mv_client_ledger` (बाद में matview, P9)

### 3.2 Actions & queries
- [ ] `lib/actions/contacts.ts`: `createContact` (duplicate phone/email check), `updateContact`, `mergeContacts`, `deactivateContact`
- [ ] `lib/actions/crm.ts`: `logInteraction`, `setStage`, `scheduleFollowUp`, `uploadDocument`
- [ ] `lib/queries/clients.ts`: list + filters, detail bundle, ledger, timeline, pipeline

### 3.3 UI
- [ ] `app/clients/page.tsx` → RSC + filters + search + export (replace legacy)
- [ ] `app/clients/new/page.tsx`
- [ ] `app/clients/[id]/page.tsx` — 360°: header + tabs (Events · Quotes · Invoices · Payments · **Ledger** · **Timeline** · Documents · Follow-ups)
- [ ] `app/clients/pipeline/page.tsx` — kanban drag-drop (stage) + column values + conversion %
- [ ] `app/clients/followups/page.tsx` — today/upcoming/overdue
- [ ] Auto-timeline hooks: quote sent/approved, event created, invoice issued, payment received/overdue
- [ ] Dashboard: "follow-ups due" widget

### 3.4 Tests
- [ ] vitest ledger math; PGlite `fn_contact_ledger` reconcile test
- [ ] **P3 AC** (MODULES M3)

---

## P4 — Quote Builder / Meeting Mode + Dynamic Pricing (9 days) ⛔ P2 (availability) + P3 (client)

### 4.1 Pricing engine
- [ ] `lib/pricing/engine.ts` — pure TS: base rate → duration slab → qty slab → `special_rates` multiplier → discount → min_price floor → `round2`
- [ ] DB: `fn_quote_line(item_id, qty, days, date, event_type)` (SQL mirror)
- [ ] vitest **property test**: 200 random fixtures TS ≡ SQL
- [ ] `system_settings.discount_approval_threshold`

### 4.2 DB
- [ ] migration `0008_quotes.sql`: `quotes.token`, `client_meeting_at`, `prepared_by/approved_by/approved_at`, `valid_till`, `cost_total`, `converted_event_id`; `quote_items.discount_percent`, `rate_multiplier`, `availability_ok`, `shortfall`; `idx_quotes_status`
- [ ] `p_next_doc_no(prefix)` + `document_sequences` table (race-safe)
- [ ] `p_convert_quote(quote_id, event_payload)` — quote→event + availability reserve
- [ ] `fn_quote_by_token(token)` (public read, definer)

### 4.3 Actions
- [ ] `lib/actions/quotes.ts`: `createQuote`, `updateQuote` (new version on revise), `sendQuote`, `approveQuote`, `rejectQuote`, `requestOverrideApproval`, `revokeToken`, `shareWaText`, `convertToEvent`

### 4.4 UI
- [ ] `app/quotes/page.tsx` — list + status filters + expiry
- [ ] `app/quotes/new/page.tsx` — **Meeting Mode**: left item picker (search + availability chip + rate) · right cart (qty/days/rate/discount, live totals, margin %) · top sticky bar (subtotal/GST/grand total + save/send/share/PDF) · client inline-create
- [ ] `app/quotes/[id]/page.tsx` — header + lines + **version diff** + activity + actions (edit/send/approve/convert/duplicate/PDF)
- [ ] `app/q/[token]/page.tsx` — **public** quote (no session, token-gated, read-only)
- [ ] Override flow: reason mandatory → threshold → pending approval → notification → admin approve

### 4.5 Tests
- [ ] pricing property test + override-threshold test + convert-reserves-availability test
- [ ] **P4 AC** (MODULES M4)

---

## P5 — Event Lifecycle & Operations (9 days) ⛔ P4 + P2

### 5.1 DB
- [ ] migration `0009_events.sql`: `events.stage` (enquiry→…→closed) + `event_status_history` + `event_templates`; `events.event_type/end_date` already from 0004
- [ ] `p_event_stage(event_id, to, note)` — allowed transitions + history + `p_notify`
- [ ] `fn_event_kpis(event_id)` → revenue / item cost / staff cost / expenses / profit
- [ ] indexes for calendar/filters

### 5.2 Actions
- [ ] `lib/actions/events.ts`: `createEvent` (→ `p_create_event_with_items`), `updateEvent`, `changeStage`, `assignItems`, `recordPickup`, `recordReturn` (damaged → maintenance suggestion), `closeEvent` (guard checklist)
- [ ] `lib/actions/event-staff.ts`: `assignStaff` (double-booking check), `updateWage`, `markAttendanceForEvent`
- [ ] `lib/actions/event-tasks.ts`: `createTask`, `moveTask`, `bulkAddFromTemplate`
- [ ] `lib/actions/event-expenses.ts`: `addExpense`, `settleExpense`
- [ ] `lib/actions/payments.ts`: `addEventPayment` (advance/balance)

### 5.3 UI
- [ ] `app/events/page.tsx` — calendar(month) + table toggle + filters + conflict badge + stats
- [ ] `app/events/new/page.tsx` — multi-step (client → dates → items w/ availability → staff → review)
- [ ] `app/events/[id]/page.tsx` — **command center** tabs: Overview(stage stepper + profitability) · Items(pickup/return/condition/e-sign) · Staff · Tasks(kanban) · Expenses · Payments · Documents · Timeline
- [ ] `components/events/stage-stepper.tsx`, `dispatch-sheet` printable, `return-checklist`
- [ ] Event-type templates UI (`event_templates` seed: Wedding/Corporate/Birthday)
- [ ] Staff conflict warning component

### 5.4 Tests
- [ ] stage machine invalid-jump test · profitability fixture test · return→availability test
- [ ] **P5 AC** (MODULES M5)

---

## P6 — Rentals In / Out (6 days) ⛔ P2

### 6.1 DB
- [ ] migration `0010_rentals.sql`: `rental_contracts.advance_paid`, `deposit_refunded`, `vendor_invoice_no`, `agreement_token`; `rental_contract_items.returned_qty`, `damaged_qty`, `condition_out/in`; indexes
- [ ] RPCs: `p_rental_in_receive(contract, lines)` · `p_rental_out_dispatch` · `p_rental_out_recall` (damaged→maintenance, deposit settlement) — सब availability engine से wired
- [ ] `stock_movements` movement types already exist (`rent_in`/`rent_out`) — enforce through RPC only

### 6.2 Actions
- [ ] `lib/actions/rentals.ts`: `createContract` (line items!), `updateContract`, `approveContract`, `receiveIn`, `dispatchOut`, `recallOut`, `closeContract`, `settleDeposit`, `uploadAgreement`

### 6.3 UI
- [ ] `app/rentals/page.tsx` — tabs Incoming/Outgoing + filters ("return due today", "payment due")
- [ ] `app/rentals/new/page.tsx?type=in|out` — party select + line items w/ availability + deposit/transport
- [ ] `app/rentals/[id]/page.tsx` — header + lines (per-line return control) + QC checklist/photos + deposit ledger + payment schedule + agreement PDF + audit
- [ ] Shortage → auto "create rent-in contract" pre-filled CTA
- [ ] Vendor/renter ledger link (P3 engine reuse)

### 6.4 Tests
- [ ] PGlite: in-receive → availability up; out-dispatch → availability down; partial return
- [ ] **P6 AC** (MODULES M6)

---

## P7 — Staff & Payroll (10 days) ⛔ P0 (data layer), parallel with P5/P6

### 7.1 DB
- [ ] migration `0011_payroll.sql`:
  - [ ] `staff_members`: `department`, `commission_eligible`, `pf_no`, `esic_no`, `uan`, `weekly_off int[]`, `probation_until`, `exit_date`
  - [ ] `attendance`: `in_time`, `out_time`, `ot_hours`, `source`
  - [ ] `payroll_settings` (single row): pay period/day, OT-after, absence deduction mode, TDS/PF/ESI percents
  - [ ] `payroll_runs.staff_count`, `period_label`
  - [ ] indexes `idx_attendance_period`
- [ ] `fn_payroll_preview(staff_id, from, to)` — components JSONB
- [ ] `p_generate_payroll(from, to, staff_ids)` → runs + entries
- [ ] `p_approve_payroll(run_id)` / `p_pay_payroll(run_id, method)` → `payments(party_type='staff')` + lock
- [ ] PGlite tests: fixture staff net-pay hand-calc match, slab commission, advance recovery, proration, immutability after approve

### 7.2 Pure calc lib
- [ ] `lib/payroll/calc.ts` — daily/permanent proration, OT, commission slabs, bonus formula (no eval — parsed tokens), advance recovery, deductions, net
- [ ] vitest: सब fixtures + property test vs `fn_payroll_preview`

### 7.3 Actions
- [ ] `lib/actions/staff.ts`: `createStaff`, `updateStaff`, `setStaffStatus`, `addAdvance`, `recoverAdvance`, `setCommissionRule`, `addBonus`
- [ ] `lib/actions/attendance.ts`: `markAttendance`, `bulkMark`, `copyDay`, `importCsv`, `setOt`
- [ ] `lib/actions/payroll.ts`: `previewPayroll`, `generatePayroll`, `approvePayroll`, `payPayroll`, `payslipPdf`

### 7.4 UI
- [ ] `app/staff/page.tsx` — list + filters + status (replace legacy create-only page)
- [ ] `app/staff/new/page.tsx` + `app/staff/[id]/page.tsx` — tabs: Overview · Attendance · Events · Advances · Commission · Bonuses · Payroll · Documents
- [ ] `app/staff/attendance/page.tsx` — monthly grid + bulk actions
- [ ] `app/payroll/page.tsx` — runs list + generate dialog (period + staff filter) + preview table
- [ ] `app/payroll/[id]/page.tsx` — entries with itemized components + approve/pay + payslip PDF
- [ ] Dashboard: "payroll pending" + "staff on duty today" widgets

### 7.5 Tests
- [ ] **P7 AC** (MODULES M7) — एक click में महीना, itemized gross/deduction/net

---

## P8 — Billing, Invoices, Payments, GST (7 days) ⛔ P4/P5/P6 (लाइन source) + P7 (staff payments)

### 8.1 DB
- [ ] migration `0012_billing.sql`: `payment_allocations`, `credit_notes`; `invoices.rental_contract_id`, `place_of_supply`, `reverse_charge`, `terms`; `system_settings` + `logo_url`, `bank_*`, `upi_id`, `terms_footer`, `discount_approval_threshold`, `fiscal_year_start_month`
- [ ] `p_issue_invoice(source_type, source_id, opts)` — lines snapshot + GST split + round-off + sequence
- [ ] `p_record_payment(payment, allocations[])` → invoice `amount_paid/due/status`
- [ ] `p_next_doc_no` (P4 से) → INV prefix fiscal-year aware
- [ ] `fn_overdue_invoices()` + pg_cron sweep
- [ ] PGlite: intra/inter GST, round-off, partial payment status, 20 parallel `p_next_doc_no` → unique

### 8.2 PDF
- [ ] `@react-pdf/renderer` install + `lib/pdf/templates/{invoice,receipt,payslip,agreement,dispatch,quote}.tsx`
- [ ] `app/api/pdf/route.ts` real implementation (token/entity-scoped, no service-role leak)
- [ ] `lib/pdf/index.ts` render service

### 8.3 Actions & UI
- [ ] `lib/actions/billing.ts`: `createInvoice`, `issueInvoice`, `cancelInvoice`, `createCreditNote`, `recordPayment`, `sendInvoice`
- [ ] `lib/actions/expenses.ts`: `addExpense`, `updateExpense`, `settleExpense`
- [ ] `app/billing/page.tsx` — dashboard (billed/collected/outstanding/overdue/GST payable/aging/top defaulters)
- [ ] `app/invoices/page.tsx` + `app/invoices/[id]/page.tsx` (lines, tax breakdown, payments, PDF, credit note, cancel+audit, print format)
- [ ] `app/expenses/page.tsx` — ledger + filters + export
- [ ] `app/payments/page.tsx` — all transactions + allocate + receipt
- [ ] Sidebar: Billing/Invoices/Payments/Expenses group

### 8.4 Tests
- [ ] **P8 AC** (MODULES M8) — totals screen≡PDF to the paisa

---

## P9 — Reports, Dashboard, Notifications, Audit (6 days) ⛔ P8 (money data)

### 9.1 DB
- [ ] migration `0013_reports.sql`: matviews `mv_monthly_pnl`, `mv_item_utilization`, `mv_staff_cost`, `mv_client_ledger`, `mv_dues_aging` + view `event_kpis` + indexes
- [ ] `p_refresh_materialized_views()` + pg_cron nightly
- [ ] `p_notify()` callers wiring (payment due, follow-up, conflict, maintenance, quote approval/expiry, payroll pending, task due)
- [ ] `profiles.notification_prefs JSONB`
- [ ] `p_audit()` invoked from `_core.ts` automatically

### 9.2 UI
- [ ] Dashboard v2: `components/dashboard/*` rewrite (trend chart, pipeline value, utilization, dues, follow-ups, low stock, maintenance due, conflicts, on-duty, payroll pending)
- [ ] `app/reports/page.tsx` tabs: P&L · Item utilization · Booking capacity · Client analytics · Vendor analytics · Staff analytics · GST summary · Aging — har ek: date-range + CSV export + print
- [ ] Topbar **real** notification bell (unread count + realtime subscription) + `app/notifications/page.tsx`
- [ ] `app/settings/audit/page.tsx` — filters + old/new diff view

### 9.3 Tests
- [ ] P&L reconcile test (invoices+payments+expenses → report) · matview refresh test
- [ ] **P9 AC** (MODULES M9)

---

## P10 — Hardening, QA, Launch (7 days) ⛔ P0–P9

- [ ] RLS penetration matrix test (4 roles × 35 tables) — allowed/denied automated
- [ ] Playwright e2e: full money flow (client→quote→event→invoice→payment), payroll flow, rental-in flow, overbook rejection, role gating, public quote link
- [ ] Component tests for `DataTable`, forms, meeting-mode cart, availability chip
- [ ] Performance: server pagination everywhere, explicit `select` columns, `next/dynamic` for charts/PDF, Lighthouse ≥ 90
- [ ] A11y pass: keyboard nav, focus rings, labels, contrast; mobile ≥ 360px pass on all pages
- [ ] i18n: सभी strings hi/en (`constants/languages.ts`), no hardcoded English in JSX
- [ ] Security: secrets grep in CI, upload allowlist, rate-limit public routes, dependency audit
- [ ] Sentry (optional) + error boundary verification
- [ ] Seed demo data script (`supabase/seed/demo.sql`) for demo/e2e
- [ ] Backup/restore drill + runbook; `supabase/backups/live_schema_*.sql` refresh
- [ ] README update (features + setup + scripts), `docs/*` checkboxes tick
- [ ] Production deploy (Vercel) + health check (login, one create, one report)
- [ ] Tag `v1.0.0`

---

## Parallelization Map (2 devs)

```
Dev A: P0 → P1 → P2 → P4 → P5 → P8 → P9 → P10
Dev B: P0 → P3 ───────→ P6 → P7 ────────→ P10
                       (P3 independent; P6 after P2; P7 independent of P4/P5)
Critical path: P0 → P1 → P2 → P4 → P5 → P8 → P9 → P10
```

## Daily Definition of Done
- [ ] `npm run check` (lint + type-check + test + db:validate) green
- [ ] No `alert()`, no `any` in new code, i18n keys added (hi+en)
- [ ] Loading/empty/error/permission states present
- [ ] Audit log row for every mutation
- [ ] Relevant `docs/MODULES.md` AC ticked
