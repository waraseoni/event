# Database Plan (Supabase / PostgreSQL)

> Part of [DEVELOPMENT_PLAN](./DEVELOPMENT_PLAN.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [MODULES](./MODULES.md) · [QUALITY](./QUALITY.md)

**Single source of truth**: `supabase/schema.sql` (consolidated, idempotent, PGlite-validated).
Incremental changes only via `supabase/migrations/00NN_*.sql` → then re-merge into `schema.sql` (the workflow used since commit `ec0b322`).

---

## 1. Current Inventory — 35 tables

**Baseline (live DB, 9)**: `contacts`, `inventory_items`, `pricing_rates`, `events`, `event_items`, `external_rentals`, `worker_assignments`, `payments`, `system_settings`

**Added by migration (26)**: `profiles`, `item_categories`, `item_locations`, `item_serials`, `maintenance_records`, `special_rates`, `quotes`, `quote_items`, `staff_members`, `event_staff`, `event_tasks`, `event_expenses`, `rental_contracts`, `rental_contract_items`, `attendance`, `staff_advances`, `commission_rules`, `bonuses`, `payroll_runs`, `payroll_entries`, `invoices`, `invoice_items`, `expenses`, `stock_movements`, `notifications`, `audit_log`

**Functions (8)**: `update_updated_at_column`, `current_user_role`, `role_rank`, `can_assign_role`, `can_change_profile_privileged`, `is_trusted_profile_writer`, `guard_profile_privileged_fields`, `handle_new_user`
**Views**: 0 · **Materialized views**: 0 · **Enums**: 0 (all text+CHECK) · **Triggers**: `update_*_updated_at` on all except `stock_movements`/`notifications`/`audit_log`; `on_auth_user_created`, `guard_profile_privileged_fields`

---

## 2. Migration 0004 — Security & Defects (Phase 0)

```sql
-- supabase/migrations/0004_security_and_defects.sql
```

### 2.1 Enable RLS on the 7 unprotected tables (defect D1)
| Table | Policy (read) | Policy (write) |
|---|---|---|
| `payments` | super_admin, admin, accountant | super_admin, admin (accountant: insert only) |
| `invoice_items` | super_admin, admin, accountant | super_admin, admin |
| `external_rentals` | super_admin, admin, accountant, staff | super_admin, admin |
| `worker_assignments` | super_admin, admin, accountant, staff | super_admin, admin |
| `item_serials` | super_admin, admin, accountant, staff | super_admin, admin |
| `maintenance_records` | super_admin, admin, accountant, staff | super_admin, admin |
| `special_rates` | super_admin, admin, accountant | super_admin, admin |

### 2.2 `system_settings` INSERT policy (defect D2)
- `INSERT TO authenticated WITH CHECK (current_user_role() IN ('super_admin','admin'))` + unique single-row guard (only 1 row allowed — `p_seed_settings()`).

### 2.3 Column fixes for broken UI (defects D3/D4)
```sql
ALTER TABLE events       ADD COLUMN IF NOT EXISTS customer_name TEXT;      -- quick-entry before client exists
ALTER TABLE events       ALTER COLUMN customer_id DROP NOT NULL;            -- allow inquiry-stage, backfilled later
ALTER TABLE events       ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE events       ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory_items ALTER COLUMN category DROP NOT NULL;            -- superseded by category_id
```
> Decision: `events.customer_id` becomes nullable only until stage ≥ `booked`; enforced by `p_create_event*` + a CHECK `booked_requires_client`.

### 2.4 Notifications INSERT
No direct INSERT policy. All inserts go through `p_notify(...)` (`SECURITY DEFINER`, `STABLE` role check) so staff can create e.g. "escalate to admin" without gaining table write access.

---

## 3. New Tables (Phase-wise)

### Phase 1 — Item catalog
| Table | Purpose | Key columns |
|---|---|---|
| *(extend)* `inventory_items` | capacity rule | `max_parallel_events INT DEFAULT 0` (0 = unlimited), `weight_kg NUMERIC`, `warranty_upto DATE`, `purchase_date DATE`, `purchase_cost NUMERIC`, `insurance_policy TEXT` |

### Phase 3 — Client CRM
| Table | Purpose | Key columns |
|---|---|---|
| `client_interactions` | activity timeline | `contact_id FK`, `type(call/meeting/email/note/whatsapp)`, `subject`, `body`, `occurred_at`, `next_action_at`, `created_by`, `event_id FK NULL`, `quote_id FK NULL` |
| `client_documents` | KYC/contracts | `contact_id FK`, `kind`, `storage_path`, `notes` |

> Note: also add `contacts.stage TEXT CHECK IN ('new','contacted','meeting','quoted','won','lost') DEFAULT 'new'`, `contacts.gstin`, `contacts.billing_address JSONB`, `contacts.preferred_contact`.

### Phase 4 — Quotes
| Table | Purpose |
|---|---|
| *(extend)* `quotes` | `token TEXT UNIQUE` (public share), `client_meeting_at TIMESTAMPTZ`, `prepared_by UUID`, `approved_by UUID`, `approved_at`, `valid_till DATE`, `cost_total NUMERIC` (margin), `converted_event_id UUID` |
| *(extend)* `quote_items` | `discount_percent NUMERIC`, `rate_multiplier NUMERIC` (season), `availability_ok BOOLEAN`, `shortfall INT` |

### Phase 5 — Events
| Table | Purpose | Key columns |
|---|---|---|
| `event_status_history` | stage audit | `event_id FK`, `from_stage`, `to_stage`, `changed_by`, `changed_at`, `note` |
| `event_templates` | reusable setup | `name`, `event_type`, `items JSONB[{item_id,qty}]`, `tasks JSONB[{title,priority}]`, `staff JSONB[{role,count,wage_basis}]` |

### Phase 6 — Rentals
| Table | Purpose |
|---|---|
| *(extend)* `rental_contracts` | `advance_paid NUMERIC`, `deposit_refunded NUMERIC`, `returned_at`, `vendor_invoice_no`, `agreement_token` |
| *(extend)* `rental_contract_items` | `returned_qty INT DEFAULT 0`, `damaged_qty INT DEFAULT 0`, `condition_out TEXT`, `condition_in TEXT` |

### Phase 7 — Staff & Payroll
| Table | Purpose | Key columns |
|---|---|---|
| *(extend)* `staff_members` | payroll config | `department TEXT`, `commission_eligible BOOL`, `pf_no`, `esic_no`, `uan`, `weekly_off INT[]` (0=Sun), `probation_until DATE`, `exit_date` |
| `payroll_settings` | global payroll config | `pay_period ENUM(monthly/weekly)`, `pay_day INT`, `ot_after_hours NUMERIC`, `absence_deduction_mode`, `tds_percent DEFAULT 0`, `pf_employer_percent`, `esi_percent`, `late_penalty_per_min` |
| *(extend)* `payroll_runs` | breakdown | `staff_count INT`, `period_label` |
| *(extend)* `attendance` | already has `hours` | add `in_time`, `out_time`, `ot_hours`, `source(manual/qr/event)` |

### Phase 8 — Billing
| Table | Purpose |
|---|---|
| `payment_allocations` | multi-invoice payment split: `payment_id FK`, `invoice_id FK`, `amount` |
| `credit_notes` | returns/corrections: `invoice_id`, `amount`, `reason`, `status` |
| *(extend)* `invoices` | `rental_contract_id`, `event_stage_at_issue`, `place_of_supply`, `reverse_charge BOOL`, `terms TEXT` |
| *(extend)* `system_settings` | `company_*` (exists), `logo_url`, `bank_name`, `bank_account`, `ifsc`, `upi_id`, `terms_footer`, `discount_approval_threshold NUMERIC DEFAULT 15`, `allow_overbooking BOOLEAN DEFAULT FALSE`, `fiscal_year_start_month INT DEFAULT 4` |

### Phase 9 — Reports / Notifications / Audit
| Table / View | Purpose |
|---|---|
| `mv_monthly_pnl` (matview) | month × revenue/expenses/margins |
| `mv_item_utilization` | item × booked days vs available days, idle cost, earned |
| `mv_staff_cost` | staff × month: wages+commission+bonus |
| `mv_client_ledger` | contact × invoice/payment running balance |
| `mv_dues_aging` | receivables/payables buckets |
| `event_kpis` (view) | per-event revenue/cost/profit/payable |

---

## 4. Functions & RPCs to Add

### 4.1 Read (`fn_*`, `SECURITY INVOKER`, `STABLE`) — callable by all authed roles
| Signature | Purpose |
|---|---|
| `fn_available_qty(p_item_id uuid, p_from timestamptz, p_to timestamptz, p_exclude_event_id uuid DEFAULT NULL) RETURNS INT` | `owned + rented_in` pool minus overlapping `event_items` (reserved/picked), minus overlapping `rental_contract_items` (direction='out'), minus `maintenance_records` active, minus `item_serials` not available. |
| `fn_item_demand(p_from, p_to) RETURNS TABLE(item_id, item_name, total_qty, owned_qty, rented_in_qty, shortfall)` | matrix for `/availability` |
| `fn_conflicts_for_window(p_from, p_to) RETURNS TABLE(...)` | over-booked items + which events collide |
| `fn_parallel_events(p_item_id, p_from, p_to)` | max simultaneous events observed + timestamps |
| `fn_quote_line(p_item_id, p_qty, p_days, p_date, p_event_type) RETURNS JSONB` | pricing engine: base → duration slab → qty slab → special rate → rounded line |
| `fn_contact_ledger(p_contact_id, p_from, p_to) RETURNS TABLE(doc_no, doc_date, debit, credit, balance)` | client/vendor khata |
| `fn_event_kpis(p_event_id) RETURNS JSONB` | revenue, item cost, staff cost, expenses, profit |
| `fn_payroll_preview(p_staff_id, p_from, p_to) RETURNS JSONB` | live payroll components |
| `fn_quote_by_token(p_token)` | public quote read (definer, token-gated) |

### 4.2 Mutations (`p_*`, `SECURITY DEFINER` only where multi-table) — invoked via `supabase.rpc()`
| RPC | Transaction handles |
|---|---|
| `p_create_event_with_items(p_event, p_items[], p_staff[], p_lock boolean)` | `pg_advisory_xact_lock(hashtext(item_id))` per item → availability re-check → insert event + event_items + stock reserve → return conflicts |
| `p_convert_quote(p_quote_id, p_event_payload)` | quote status=converted, copy items → event_items, reserve availability, set `converted_event_id` |
| `p_next_doc_no(p_prefix text) RETURNS TEXT` | `SELECT ... FOR UPDATE` on `document_sequences(prefix, last_no, year)` (new table) → gapless numbers |
| `p_receive_rental_in(p_contract_id, p_lines[])` | stock_movements rent_in, update qty, contract status, QC condition |
| `p_dispatch_rental_out(...)` / `p_recall_rental_out(...)` | stock_movements rent_out/return, damaged → maintenance_records, deposit settlement |
| `p_event_stage(p_event_id, p_to_stage, p_note)` | allowed-transition check → update + history + notifications |
| `p_generate_payroll(p_from, p_to, p_staff_ids uuid[])` | attendance+OT+advance recovery+commission+bonus → payroll_runs + payroll_entries (components JSONB) |
| `p_approve_payroll(p_run_id)` / `p_pay_payroll(p_run_id, p_method)` | lock entries, create `payments` party_type='staff', link `payment_id` |
| `p_issue_invoice(p_event_id \| p_contract_id, p_opts)` | lines, GST split, round-off, sequences, status |
| `p_record_payment(p_payment, p_allocations[])` | payments + allocations + invoice amount_paid/status |
| `p_notify(p_user_id, p_title, p_body, p_type, p_entity)` | notifications insert (definer) |
| `p_audit(p_action, p_entity, p_entity_id, p_old, p_new)` | audit_log insert (definer) |
| `p_refresh_materialized_views()` | refresh all `mv_*` (pg_cron nightly) |

### 4.3 Availability algorithm (authoritative)
```sql
demand(item, [from,to]) =
    SELECT COALESCE(SUM(ei.qty),0) FROM event_items ei
      JOIN events e ON e.id = ei.event_id
     WHERE ei.item_id = item AND e.status NOT IN ('cancelled')
       AND ei.pickup_datetime < to AND ei.return_datetime > from        -- overlap
       AND ei.status <> 'cancelled'
  + SELECT SUM(rci.qty) FROM rental_contract_items rci
      JOIN rental_contracts rc ON rc.id = rci.contract_id
     WHERE rc.direction='out' AND rc.status IN ('approved','dispatched','received')
       AND rci.inventory_item_id = item AND rc.start_date < to::date AND rc.end_date > from::date
  + SELECT SUM(mr.required_qty) FROM maintenance_records mr ...          -- blocked qty

available = owned_quantity + SUM(rented-in qty in window) - demand - maintenance_blocked
```
- **Overlap predicate**: `pickup < $to AND return > $from` (half-open intervals, end-exclusive) — used identically in TS tests and SQL tests.
- **Race safety**: `p_create_event_with_items` takes `pg_advisory_xact_lock(hashtext(item_id::text))` for each distinct item in sorted order (prevents deadlock) *before* re-running the availability query, inside one transaction.
- **max_parallel_events**: `fn_parallel_events` counts events whose `[pickup,return]` contains the requested window; compare against `inventory_items.max_parallel_events`.

---

## 5. RLS Role Matrix (target, after 0004)

| Table group | super_admin | admin | accountant | staff |
|---|---|---|---|---|
| masters: contacts, inventory_items, item_*, pricing_rates, special_rates, staff_members | ALL | ALL | SELECT | SELECT |
| quotes, quote_items | ALL | ALL | SELECT | SELECT |
| events, event_items, event_tasks, event_expenses, event_staff | ALL | ALL | SELECT | SELECT (+ update own assignment) |
| rental_contracts (+items), external_rentals, worker_assignments | ALL | ALL | SELECT | SELECT |
| stock_movements, expenses | ALL | ALL | INSERT+SELECT | SELECT |
| **payments, invoice_items**, invoices | ALL | ALL | SELECT+INSERT | — |
| attendance | ALL | ALL | ALL | SELECT own |
| staff_advances, commission_rules, bonuses | ALL | ALL | SELECT | SELECT own |
| **payroll_runs, payroll_entries** | ALL | ALL | ALL | — |
| profiles | ALL | ALL | SELECT own | SELECT own |
| system_settings, audit_log | ALL | ALL | — | — |
| notifications | own SELECT/UPDATE; insert via `p_notify` |
| maintenance_records, item_serials | ALL | ALL | SELECT | SELECT |

> Enforce: **server actions for all writes** (staff/accountant roles must not write masters from browser) OR relax SELECT-only roles to use scoped INSERT policies. Decision: keep RLS strict + move all writes server-side; server actions do `requireRole` explicitly so error messages are friendly, not RLS rejections.

---

## 6. Indexes to Add (with the phases)

```sql
-- availability hot path
CREATE INDEX idx_event_items_window   ON event_items (item_id, pickup_datetime, return_datetime);
CREATE INDEX idx_events_window        ON events (event_date, status) WHERE status <> 'cancelled';
CREATE INDEX idx_rc_items_window      ON rental_contract_items (inventory_item_id);
CREATE INDEX idx_rc_window            ON rental_contracts (direction, start_date, end_date, status);
CREATE INDEX idx_maintenance_active   ON maintenance_records (item_id) WHERE completed_at IS NULL;
-- CRM
CREATE INDEX idx_contacts_stage       ON contacts (stage, follow_up_date);
CREATE INDEX idx_interactions_contact ON client_interactions (contact_id, occurred_at DESC);
-- money
CREATE INDEX idx_payments_party       ON payments (party_type, payment_date);
CREATE INDEX idx_invoices_status_due  ON invoices (status, due_date);
-- payroll
CREATE INDEX idx_attendance_period    ON attendance (date, staff_id);
-- search
CREATE INDEX idx_inventory_search     ON inventory_items USING gin (to_tsvector('simple', coalesce(name,'')||' '||coalesce(company,'')||' '||coalesce(model,'')));
CREATE INDEX idx_contacts_search      ON contacts USING gin (to_tsvector('simple', coalesce(name,'')||' '||coalesce(phone,'')||' '||coalesce(email,'')));
```

---

## 7. Migration Workflow

1. Edit `supabase/migrations/00NN_<topic>.sql` — **always idempotent** (`IF EXISTS`, `DROP+ADD`, `DO $$` guards) like 0002/0003.
2. Validate locally: `node supabase/validation/assert-schema.js` (PGlite executes consolidated schema + asserts invariants).
3. Apply to live: `npm run db:migrate` (`supabase db push`).
4. **Re-merge** into `supabase/schema.sql` (append/alter the relevant section) so consolidated schema stays truth.
5. Regenerate types: `npm run supabase:gen` → `src/types/supabase.ts`.
6. Update `docs/DATABASE.md` §3/§4 tables.

**Guardrails**
- Never drop columns used by live data without a backfill step.
- All CHECK-constraint changes via `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`.
- Every money/availability change ships with a PGlite assertion in `supabase/validation/`.
- `supabase/backups/live_schema_*.sql` — take a fresh dump before each release batch (reference only, not runnable).
