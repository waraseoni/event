# Module Specifications

> Part of [DEVELOPMENT_PLAN](./DEVELOPMENT_PLAN.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [QUALITY](./QUALITY.md)
>
> Har module: **Routes → Screens → Actions/RPCs → Business Rules → Acceptance Criteria**.

---

## M0 — Foundation (Phase 0)

**Routes**: n/a (infrastructure)

| Item | Spec |
|---|---|
| Action core | `lib/actions/_core.ts`: `zodServerAction(schema, fn)`, `requireRole(...)`, `AppError`, `audit()` helper |
| Query core | `lib/queries/_core.ts`: `supabaseRequest()` wrapper, pagination helper `paginate(qb, page, size)` |
| Cache | TanStack Query + `queryKeys` (reuse `lib/queries/keys.ts` — 16 keys already defined) |
| Shared UI | `components/shared/`: `DataTable`, `FilterBar`, `Pager`, `Money`, `StatusBadge`, `ConfirmDialog`, `PageHeader`, `EmptyState`, `ErrorBoundary` |
| Boundaries | `error.tsx` / `loading.tsx` / `not-found.tsx` at `(app)` level + per route |
| Dead code | delete `lib/actions/inventory.ts` (replace later), `lib/pdf/index.ts` stub → real in P8, orphan `components/inventory/*` → revive as shared list components |

---

## M1 — Inventory / Owner's Item Catalog (Phase 1)

> **"owner ke par uplabdh items ki puri list (company, model, scope, type, target event, estimated rent price ityadi)"**

### Routes
`/inventory` · `/inventory/new` · `/inventory/[id]` · `/inventory/[id]/edit` · `/inventory/categories` · `/inventory/locations` · `/inventory/maintenance`

### Item master fields (form sections)
1. **Basic**: name*, category* (tree select), sub-category, item_type (`owned`|`leased`), quantity, owned_quantity, unit (pcs/set/pair), reorder_level, status (`available|rented|maintenance|retired`)
2. **Specs**: company, model, scope (e.g. `indoor|outdoor|stage|lighting`), description, weight, hsn_code, images[]
3. **Business**: estimated_rent_price, min_price, security_deposit, `pricing_rates` (daily/weekly/monthly/per_event + weekend), target_event_types[] (`wedding|corporate|birthday|exhibition|...`)
4. **Logistics**: location_id, shelf/rack, serial/QR tracking (is_serialized bool)
5. **Ownership**: purchase_date, purchase_cost, warranty_upto, insurance_policy, vendor_id (purchase from)
6. **Capacity**: `max_parallel_events` (0 = unlimited)
7. Notes

### Screens
- **List**: server-paginated table + card grid toggle; columns: image, name, code, company/model, type, category, scope, target events, qty (total/available/on-rent), est. rent price, status, actions.
  Filters (URL-driven): search (name/company/model/code, trigram/gist), category, company, item_type, status, location, price range, target event.
  Bulk: select → change category/location/status, export CSV, print QR sheet.
- **Detail** `/inventory/[id]`: header (image, code, status, qty chips), tabs → Specs · Rates · Availability (next 30 days mini timeline) · Stock ledger (`stock_movements`) · Rentals/Events history · Maintenance · Serials/QR · Documents · Margin analytics (lifetime earned vs purchase cost = ROI).
- **Categories/Locations**: tree CRUD with drag sort.
- **Maintenance**: upcoming/overdue list, new record (type, vendor, cost, dates), auto `status='maintenance'` when started & not completed.

### Actions
`createItem`, `updateItem`, `deleteItem` (block if referenced → soft `retired`), `bulkUpdateItems`, `moveStock(itemId, qty, movement, ref)`, `addSerial`, `printQr(ids)`, `exportInventoryCsv(filter)`, `createCategory/Location`, `createMaintenance`, `completeMaintenance` (restore status + stock).

### Rules
- Qty change **always** writes `stock_movements` with `running_balance` (recompute inside RPC `p_move_stock`).
- `status='retired'` → excluded from availability & pricing pickers.
- `item_type='leased'` items cannot be booked beyond their own rental-in window (checked by availability engine).
- Delete blocked when referenced by open event/contract → must retire instead.

### AC
- [ ] List filter/search/pagination URL-shareable, 5000 rows < 300ms
- [ ] Detail page lifetime ROI & utilization % correct
- [ ] Every qty mutation produces a stock movement row
- [ ] CSV import validates (dry-run report) & export matches filter

---

## M2 — Availability & Parallel-Event Capacity (Phase 2)

> **"ek hi samay me item ke hisab se kitne events organise kar sakte hain"**

### Routes
`/availability` (matrix + timeline)

### Screens
1. **Window picker** (from/to) → `fn_item_demand` → table:
   `Item | owned | rented-in | committed (events) | committed (out-rentals) | maintenance | FREE | parallel events | max_parallel | verdict`
2. **Timeline/Gantt**: rows = items, bars = events/contracts/maintenance, colour-coded; drag to change window (edit permission required).
3. **Shortfall panel**: items needing rent-in → one-click "Create rent-in contract" pre-filled with qty + suggested vendor.
4. **Conflict center** on dashboard: next 30 days conflicts.

### Integration points
- Quote builder: availability badge per line + auto-suggest rent-in (adds cost line to quote).
- Event form: hard validation before save (or admin override with reason).
- Rental-out contract: same check.
- Maintenance: blocks window automatically.

### Actions/RPCs
`fn_available_qty`, `fn_item_demand`, `fn_conflicts_for_window`, `fn_parallel_events`, `p_create_event_with_items` (advisory locks), `overrideConflict(eventId, reason)` → audit + notification to admin.

### Rules
- Half-open overlap: `pickup < to AND return > from`.
- Cancelled events free the stock; `returned` event_items free the stock.
- Availability pool = `owned_quantity + Σ(rented-in within window)`; rental-out subtracts.
- `max_parallel_events` > 0 → `fn_parallel_events` count compared, exceeded = conflict even if qty free (for services like limited crew/equipment sets).
- Overbooking allowed only if `system_settings.allow_overbooking` AND role admin AND reason provided.

### AC
- [ ] 3 units, 3 overlapping bookings → 4th rejected with exact shortfall qty
- [ ] Two concurrent save requests → only one succeeds (PGlite concurrency test)
- [ ] Maintenance window blocks item
- [ ] Matrix page answers "kitne events parallel chal sakte hain" per item in one glance

---

## M3 — Client Management / CRM (Phase 3)

### Routes
`/clients` · `/clients/[id]` · `/clients/new` · `/clients/pipeline` · `/clients/followups`

### Screens
- **List**: name, phone, segment, stage, credit days, total business, outstanding balance, last event, next follow-up, owner. Filters + search + export.
- **Detail 360°**:
  - Header: contacts, GSTIN, addresses, credit days, segment/source, tags, stage badge
  - Tabs: **Events** · **Quotes** · **Invoices** · **Payments** · **Ledger** (running balance + aging) · **Timeline** (interactions + auto events) · **Documents** · **Follow-ups**
  - Quick actions: New Meeting, New Quote, Log Call, Schedule Follow-up, WhatsApp/call links
- **Pipeline**: kanban columns by `contacts.stage` with drag-drop + value per column + conversion stats.
- **Follow-ups**: today / upcoming / overdue lists, complete → log interaction.

### Actions
`createContact` (duplicate check on phone/email with confirm-merge), `updateContact`, `mergeContacts`, `logInteraction`, `setStage`, `scheduleFollowUp`, `uploadDocument`, `getLedger` (`fn_contact_ledger`).

### Rules
- Auto timeline entries: quote sent, quote approved, event created, invoice issued, payment received, payment overdue.
- Deleting a client with history blocked → deactivate only.
- Credit days drive invoice due date default + overdue computation.

### AC
- [ ] Ledger balance reconciles with Σ invoices − Σ payments
- [ ] Aging buckets correct
- [ ] Duplicate phone warning at create
- [ ] Stage change reflects instantly in pipeline + stats

---

## M4 — Quote Builder / Meeting Mode & Dynamic Pricing (Phase 4)

> **"jab client ke liye meeting kar rahe ho to item ke hisab price me changes"**

### Routes
`/quotes` · `/quotes/new` (meeting mode) · `/quotes/[id]` · `/q/[token]` (public)

### Pricing engine (`lib/pricing/` + `fn_quote_line`)
```
line_total =
  round2( base_rate(duration_type) 
          × duration_multiplier(duration slab)      -- daily/weekly/monthly/per_event
          × qty 
          × season_multiplier(special_rates)        -- weekend/festival
          × (1 - discount%)
        )
floored at item.min_price × qty (unless override)
```
- Slab resolution order: item-level `pricing_rates.slab` → category-level → global default.
- Every line exposes `rate_from_system`, `rate_applied`, `discount`, `override_reason`, `source(own|rented_in)`, `cost_line` → `margin_line`.

### Meeting Mode screen (`/quotes/new`)
- **Left**: searchable item picker with category tabs; each card shows photo, company/model/scope, target events, availability chip (green/amber/red + shortfall), suggested rate.
- **Center/right**: cart table — item, qty (± with availability hint), days, rate (editable), discount %, line total; drag reorder; group by category.
- **Top sticky bar**: subtotal, discount, GST mode (none/CGST+SGST/IGST), tax, grand total, **estimated cost & margin %**, save draft / send / share link / PDF.
- **Client panel**: select existing or create inline (name, phone) — event dates, venue, event type (drives special rates).
- **Negotiation aids**: rate history for this client, "last quoted" for this item, one-click "apply 5% festive discount", competitor note field.
- Override: `rate_applied < rate_from_system` → reason required; discount% > threshold → `pending_approval` (admin approves from notifications).

### Quote detail
Header (no, client, dates, validity, status, totals, margin) + line items + **version history** (v1/v2… with diff) + activity + actions: Edit (new version), Send, Approve, Reject, **Convert to Event**, Duplicate, PDF, Copy WhatsApp text.

### Rules
- Status flow: `draft → sent → negotiating → approved|rejected → converted`; expiry after `validity_days` (cron marks `expired`-equivalent by date check).
- Conversion creates event in stage `booked`, copies items (with reserved availability), sets `quotes.converted_event_id`, `events.quote_id`.
- Rented-in items: quote may include cost line (margin visible).
- Quote tokens: 24-char random, revocable, read-only via `fn_quote_by_token`.

### AC
- [ ] Editing qty/rate/dates updates totals instantly (client-side engine mirrors SQL result exactly — property test)
- [ ] Discount above threshold cannot be saved without approval
- [ ] v2 diff shows changed rates only
- [ ] Public link works logged-out, and stops working after revoke
- [ ] Convert → event exists, items reserved, availability reflects it

---

## M5 — Event Lifecycle & Operations (Phase 5)

### Routes
`/events` · `/events/new` · `/events/[id]` (tabs) · `/events/calendar`

### Stage machine (`events.stage`)
```
enquiry → booked → planning → dispatch → setup → live → teardown → settlement → closed
                     └────────── any stage ──────────┘ → cancelled
```
`p_event_stage(event_id, to, note)` validates allowed transitions; writes `event_status_history`; notifies assignees.

### `/events` list
Calendar (month) + table toggle; filters: date range, stage, status, client, type, venue, assigned staff; conflict indicator badge; stats cards (upcoming, in-progress, revenue this month, outstanding).

### `/events/[id]` command center
| Tab | Contents |
|---|---|
| **Overview** | client, contact, type, dates/venue, stage stepper, advance & balance, profitability card (revenue − item cost − staff − expenses), key dates countdown, checklist completion |
| **Items** | assigned items (from quote/manual): qty, rate, source, pickup/return datetime, picked/returned/damaged qty, condition, e-sign capture, "scan QR" quick return, short/over delivery report |
| **Staff** | `event_staff` assign: staff search (availability conflict warning), role, wage basis, days, OT, total cost; attendance quick-mark for the event |
| **Tasks** | kanban todo/doing/done, priority, due, assignee, checklist template load, bulk add |
| **Expenses** | category, description, amount, paid_to, paid?, receipt upload → feeds P&L |
| **Payments** | advance/balance entries, receipt PDF, allocate to invoice |
| **Documents** | contract, agreement, photos, invoice (storage bucket `event-documents`) |
| **Timeline** | status history + audit trail + comments |

### Actions
`createEvent` (`p_create_event_with_items`), `updateEvent`, `changeStage`, `assignItems`, `recordPickup`, `recordReturn` (damaged → suggestion to open maintenance), `assignStaff`, `updateTask`, `addExpense`, `addPayment`, `closeEvent` (guard: all items returned, expenses paid/flagged, invoice issued, staff attendance complete).

### Rules
- Staff double-booking check across `event_staff` + `attendance`.
- Event profitability recomputed on every change (`fn_event_kpis`).
- Templates: "New Wedding" pre-fills items/tasks/staff → saves 10+ minutes.
- `dispatch` stage requires printable dispatch sheet; `teardown` requires return checklist.

### AC
- [ ] Invalid stage jumps rejected
- [ ] Return flow updates availability instantly
- [ ] Profitability matches manual calc on a fixture event
- [ ] Staff with an overlapping assignment is warned/blocked

---

## M6 — Rentals: In (rent from others) & Out (rent to others) (Phase 6)

> **"owner kabhi kabhi dusre se item rent par leta hai aur kabhi dusro ko deta hai"**

### Routes
`/rentals` (tabs **Incoming** | **Outgoing**) · `/rentals/new?type=in|out` · `/rentals/[id]`

### Contract header
`contract_no` (auto), `direction`, `party_id` (vendor/renter), linked `event_id` (optional), dates, rate type (`daily|weekly|monthly|per_event|fixed`), rate, total, security deposit, transport cost, terms, status.

### Status flows
```
IN : requested → approved → dispatched(pickup from vendor) → received(our godown, QC)
                    → returned(to vendor) → closed       (+ cancelled)
OUT: requested → approved → dispatched(to client) → received(back) → returned
                    → closed  (+ cancelled)
```

### Line items
`rental_contract_items`: item (may be a **virtual item** = not in our catalog? → decision: create catalog item with `item_type='leased'`, `owned_quantity=0` so it participates in availability), qty, unit rate, days, line total, returned/damaged qty, condition out/in.

### Screens
- **List**: direction tabs, filters (status, party, date, due-for-action e.g. "return due today", "payment due").
- **Detail**: header + lines with per-line return control; QC checklist (photos + condition); deposit ledger (taken/refunded); transport cost; payment schedule; vendor/client ledger link; **agreement PDF** (direction-aware template); audit trail.
- **In-flow extras**: link to purchase/rent-in expense → creates `payments` party_type='vendor' when paid; auto `stock_movements: rent_in`.
- **Out-flow extras**: availability check at approve; damage deduction from deposit; auto-suggest rent-in when item shortage (cross-link to M2).

### Rules
- Receiving in-contract increases `owned_quantity`? **No** — rented-in stock increases the *pool* via window math (`fn_available_qty` adds qty whose contract covers the date); `stock_movements` records `rent_in` for ledger reporting.
- Overlap between an in-contract and an out-contract of same item must be impossible unless qty permits → both go through availability engine.
- Deposit refund creates `payments` outgoing + audit.

### AC
- [ ] In-contract received → item becomes bookable for that window
- [ ] Out-contract dispatched → availability drops, event booking blocked if insufficient
- [ ] Partial return supported (line-level returned_qty)
- [ ] Agreement PDF has correct parties, dates, deposit, terms, signatures

---

## M7 — Staff & Payroll (Phase 7)

> **"worker ki puri management jisme salary, bonus, commission calculate"**

### Routes
`/staff` · `/staff/[id]` · `/staff/new` · `/attendance` · `/payroll` · `/payroll/[runId]`

### Staff profile tabs
Overview · Attendance calendar · Events worked (`event_staff`) · Advances · Commission rules · Bonuses · Payroll history · Documents (ID/bank) · Notes/Performance.

### Attendance
- Monthly grid: rows = staff, cols = dates; statuses `present|absent|half|leave|holiday|weekoff`, hours, OT hours, event link.
- Bulk actions: mark all present, copy yesterday, import CSV.
- `in_time/out_time` + `source` (manual/QR) for future QR check-in.

### Commission rules
`basis ∈ {event_revenue, event_profit, payment_collected}`, either `percent` flat or `slabs JSONB`:
```json
[{"upto": 500000, "percent": 2}, {"upto": 1000000, "percent": 3}, {"upto": null, "percent": 4}]
```
Applied to eligible events (stage ≥ settlement, or payments collected in period).

### Bonus
`type ∈ {performance, festival, referral, custom}`, fixed `amount` OR `formula` string evaluated safely:
allowed forms only: `event_profit * 0.05`, `revenue * 0.01`, `fixed` — implemented as parsed tokens (no `eval`).

### Payroll run
1. **Preview** (`fn_payroll_preview` per staff): attendance days, present/absent/leave, OT hours, base/daily wage, commission, bonus, advance recovery due, deductions (absence, penalty, TDS/PF/ESI), **net payable**.
2. **Generate** `p_generate_payroll(from,to,staff_ids)` → `payroll_runs(draft)` + `payroll_entries` with `components JSONB`:
```json
{ "earnings": [{"label":"Basic","amount":18000},{"label":"OT","amount":1200},
               {"label":"Commission","amount":4500},{"label":"Bonus","amount":2000}],
   "deductions":[{"label":"Advance recovery","amount":3000},{"label":"TDS","amount":900}] }
```
3. **Approve** → entries locked; **Pay** → `payments(party_type='staff')` + link + `payroll_entries.payment_id` + status `paid`.
4. Payslip PDF per staff; payroll register export.

### Advance recovery
`staff_advances` with `recovery_schedule JSONB` → each payroll period recovers `min(scheduled, remaining)` until `fully_recovered`.

### Rules
- Payroll period = calendar month (`payroll_settings.pay_period`), fiscal-year aware month labels (FY starts Apr).
- Daily staff: `days_present × daily_wage`, half-day = 0.5, `weekoff` unpaid unless `paid_weekoff`.
- Permanent: prorated `base_salary × present_days / total_payable_days`.
- Commission only for events marked eligible (rule basis decides: revenue booked / profit / cash collected in window).
- Re-running same period replaces draft runs only (approved runs immutable).

### AC
- [ ] Fixture: daily worker, 24 present days @ ₹800, 4 OT @ ₹200, advance ₹3000, commission slab → net matches hand calc exactly
- [ ] Permanent staff proration on 31-day month correct
- [ ] Approved run cannot be edited; re-generate creates new run
- [ ] Payslip shows itemized components and YTD summary

---

## M8 — Billing, Invoices, Payments, GST (Phase 8)

### Routes
`/billing` · `/invoices` · `/invoices/[id]` · `/invoices/new` · `/expenses` · `/payments`

### Invoice creation
Source: Event (default) | Quote | Rental-out contract | Manual.
Lines copied with snapshot (`invoice_items` — description, hsn, qty, rate, amount).

### Tax engine
- `tax_mode ∈ {none, gst}`; GSTIN state code from `system_settings.state_code` vs client state → **CGST+SGST** (intra) or **IGST** (inter).
- Optional reverse charge, TDS %, round-off to nearest rupee, credit note support.
- `place_of_supply` recorded.

### Payment recording
`p_record_payment(amount, method, ref, date, allocations[])` → payments row + allocations → updates invoice `amount_paid/amount_due/status`.
Supports: full, partial, advance against future invoice, refund (outgoing).

### Screens
- **Billing dashboard**: total billed, collected, outstanding, overdue, this-month GST payable, aging buckets, top defaulters.
- **Invoice list**: filters by status/date/client; bulk send; overdue flag.
- **Invoice detail**: line items, tax breakdown, payments received, ledger link, PDF download/share, credit note, cancel (audit), print 2-copy format.
- **Expenses ledger**: non-event + event expenses, categories, vendor payments, P&L feed.

### Rules
- Doc numbers via `p_next_doc_no` (gapless per prefix per fiscal year).
- `status` auto: draft → issued → partially_paid → paid; overdue by due_date (cron/`fn_overdue_invoices`).
- Cancel only if no payments, else credit note.

### AC
- [ ] Intra vs inter state tax split correct; round-off ≤ ₹1
- [ ] Partial payment → `partially_paid`, exact due
- [ ] Numbers unique under concurrency (test 20 parallel calls)
- [ ] PDF matches on-screen totals to the paisa

---

## M9 — Reports, Dashboard, Notifications, Audit (Phase 9)

### Dashboard widgets
Revenue trend (12m) · Expense breakdown · Upcoming events (7/30d) · Stage-wise pipeline value · Item utilization + idle cost · Dues (receivable/payable) · Follow-ups due · Low stock (reorder_level) · Maintenance due · Availability conflicts · Staff on duty today · Payroll pending · Notifications.

### Reports (`/reports` tabs)
1. **P&L** — monthly/yearly, drill to event; revenue, COGS (item cost/vendor rent), staff cost, expenses, net profit, margin %.
2. **Item utilization** — booked days %, earned, idle cost (purchase_cost amortized), top/bottom 10.
3. **Booking capacity** — parallel demand vs capacity by day (uses M2 data).
4. **Client analytics** — revenue by client/segment, repeat rate, conversion funnel.
5. **Vendor analytics** — spend, dues, on-time returns.
6. **Staff analytics** — cost by staff/designation, attendance %, commission paid.
7. **GST summary** — outward/inward tax payable per period.
8. **Receivables/Payables aging**.
All with date-range picker, CSV/Excel export, and print-friendly layout.

### Notifications
Bell in Topbar (real, unread count) + `/notifications` list. Sources: payment due/received, follow-up due, availability conflict, maintenance due, quote expiry/approval needed, payroll pending, task due, advance recovery complete. Preferences per user (`profiles.notification_prefs JSONB`).

### Audit
`/settings/audit` — filters (user, entity, action, date), diff view of `old_values`→`new_values`. Every mutation writes via `p_audit`.

### AC
- [ ] P&L reconciles to invoice+payment+expense totals
- [ ] Matviews refreshed nightly; report < 1s for 24 months data
- [ ] Bell shows real events; mark-as-read persists
- [ ] Any record change is traceable in audit with who/when/what

---

## Cross-cutting: Dashboard & Navigation (updated sidebar)

```
Dashboard
Master:      Inventory · Categories & Locations · Pricing · Maintenance
Sales:       Clients · Pipeline · Follow-ups · Quotes · Availability
Operations:  Events · Calendar · Rentals (In/Out) · Tasks
Workforce:   Staff · Attendance · Payroll
Money:       Billing · Invoices · Payments · Expenses · Ledger
Insights:    Reports · Notifications
Admin:       Users · Settings (Business, Tax, Pricing, Payroll, Notifications, Audit)
```
Role-based visibility: staff → Dashboard, Inventory(read), Events, Tasks, Attendance, own profile; accountant → + money modules; admin/super_admin → all.
