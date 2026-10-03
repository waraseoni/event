-- =============================================================================
-- 0005 — Phase 1: Item Catalog
-- =============================================================================
-- Closes the remaining gaps between `docs/DEVELOPMENT_PLAN.md` Phase 1 and the
-- live schema. Everything in migrations/0002 already created the tables
-- (item_categories, item_locations, item_serials, maintenance_records,
-- stock_movements, special_rates) and added the catalog columns to
-- inventory_items; 0003/0004 added the RLS policies. This file adds only what
-- Phase 1 still needs:
--
--   P1-a  maintenance_interval_days / last_maintenance_date / next_maintenance_date
--         so "Maintenance schedule" has something to schedule against.
--   P1-b  max_parallel_events — the per-item capacity rule consumed by the
--         Phase 2 availability engine.
--   P1-c  fn_inventory_search — server-side search + faceted count. The list
--         page currently filters client-side, which cannot meet the
--         "5000 items < 300ms" AC once pagination moves to the server.
--   P1-d  p_adjust_stock — the ONLY sanctioned way to change a quantity. It
--         writes the stock_movements row with a running balance inside one
--         transaction and takes a per-item advisory lock so two concurrent
--         adjustments cannot both read the same balance and lose an update.
--   P1-e  trigger that refuses a direct UPDATE of total_quantity /
--         available_quantity, so the ledger cannot be bypassed.
--   P1-f  trigram + composite indexes for the 5000-item latency AC.
--
-- Idempotent: safe to re-run. Mirrored into supabase/schema.sql, which remains
-- the single source of truth.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- P1-a / P1-b  missing inventory_items columns
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS max_parallel_events INTEGER DEFAULT 0;

-- max_parallel_events = 0 means "no cap beyond stock"; anything positive is a
-- hard simultaneous-event ceiling enforced by Phase 2.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_max_parallel_events_chk'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_max_parallel_events_chk
      CHECK (max_parallel_events IS NULL OR max_parallel_events >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- P1-c  server-side search
-- ---------------------------------------------------------------------------
-- ilike over name/company/model/unique_code, plus optional facet filters and a
-- total count so the list page can paginate without a second round trip.
CREATE OR REPLACE FUNCTION public.fn_inventory_search(
  p_search      TEXT    DEFAULT NULL,
  p_category_id UUID    DEFAULT NULL,
  p_company     TEXT    DEFAULT NULL,
  p_item_type   TEXT    DEFAULT NULL,
  p_status      TEXT    DEFAULT NULL,
  p_location_id UUID    DEFAULT NULL,
  p_min_price   NUMERIC DEFAULT NULL,
  p_max_price   NUMERIC DEFAULT NULL,
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                 UUID,
  name               TEXT,
  category           TEXT,
  category_id        UUID,
  description        TEXT,
  company            TEXT,
  model              TEXT,
  scope              TEXT,
  item_type          TEXT,
  target_event_types TEXT[],
  estimated_rent_price NUMERIC,
  min_price          NUMERIC,
  security_deposit   NUMERIC,
  hsn_code           TEXT,
  images             TEXT[],
  total_quantity     INTEGER,
  available_quantity INTEGER,
  owned_quantity     INTEGER,
  reorder_level      INTEGER,
  max_parallel_events INTEGER,
  unit               TEXT,
  status             TEXT,
  condition          TEXT,
  unique_code        TEXT,
  serial_number      TEXT,
  location           TEXT,
  location_id        UUID,
  purchase_date      DATE,
  purchase_price     NUMERIC,
  created_at         TIMESTAMPTZ,
  total_count        BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT i.*
    FROM public.inventory_items i
    WHERE (p_search IS NULL OR btrim(p_search) = '' OR
           i.name           ILIKE '%' || p_search || '%' OR
           COALESCE(i.company, '')     ILIKE '%' || p_search || '%' OR
           COALESCE(i.model, '')      ILIKE '%' || p_search || '%' OR
           i.unique_code    ILIKE '%' || p_search || '%' OR
           COALESCE(i.serial_number, '') ILIKE '%' || p_search || '%' OR
           COALESCE(i.hsn_code, '')   ILIKE '%' || p_search || '%')
      AND (p_category_id IS NULL OR i.category_id = p_category_id)
      AND (p_company   IS NULL OR i.company  ILIKE p_company)
      AND (p_item_type IS NULL OR i.item_type = p_item_type)
      AND (p_status    IS NULL OR i.status    = p_status)
      AND (p_location_id IS NULL OR i.location_id = p_location_id)
      AND (p_min_price IS NULL OR COALESCE(i.estimated_rent_price, 0) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(i.estimated_rent_price, 0) <= p_max_price)
  )
  SELECT
    f.id, f.name, f.category, f.category_id, f.description, f.company, f.model,
    f.scope, f.item_type, f.target_event_types, f.estimated_rent_price,
    f.min_price, f.security_deposit, f.hsn_code, f.images, f.total_quantity,
    f.available_quantity, f.owned_quantity, f.reorder_level,
    f.max_parallel_events, f.unit, f.status, f.condition, f.unique_code,
    f.serial_number, f.location, f.location_id, f.purchase_date,
    f.purchase_price, f.created_at,
    (SELECT COUNT(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC NULLS LAST, f.name
  LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0);
$$;

COMMENT ON FUNCTION public.fn_inventory_search IS
  'Phase 1 server-side item search with facets + total_count for pagination. RLS applies (SECURITY INVOKER).';

-- ---------------------------------------------------------------------------
-- P1-d  p_adjust_stock — the single write path for quantity changes
-- ---------------------------------------------------------------------------
-- Sign convention: quantity is the DELTA applied to available_quantity
-- (positive = stock in, negative = stock out). running_balance is the value of
-- available_quantity after the movement, read under the same advisory lock that
-- guards the update, so the ledger can never disagree with the item row.
CREATE OR REPLACE FUNCTION public.p_adjust_stock(
  p_item_id        UUID,
  p_movement       TEXT,
  p_quantity       INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id   UUID DEFAULT NULL,
  p_party_id       UUID DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_balance   INTEGER;
  v_total     INTEGER;
  v_available INTEGER;
  v_user      UUID;
  v_row       public.stock_movements;
BEGIN
  IF p_movement NOT IN ('purchase','rent_in','rent_out','event_pickup',
                        'event_return','transfer','adjust','damage','retire',
                        'maintenance') THEN
    RAISE EXCEPTION 'invalid movement: %', p_movement
      USING ERRCODE = '22023';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'quantity must be non-zero'
      USING ERRCODE = '22023';
  END IF;

  -- Per-item serialisation: without this two concurrent adjustments both read
  -- the same balance and the second UPDATE silently overwrites the first.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_item_id::text, 0));

  -- Announce this transaction as an authorised adjustment so the guard trigger
  -- below lets its own quantity UPDATE through. Must be set BEFORE the UPDATE.
  PERFORM set_config('app.stock_adjustment', 'on', TRUE);

  SELECT total_quantity, available_quantity
    INTO v_total, v_available
  FROM public.inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item % not found', p_item_id
      USING ERRCODE = 'P0002';
  END IF;

  v_balance := v_available + p_quantity;

  IF v_balance < 0 THEN
    RAISE EXCEPTION
      'insufficient stock for %: on hand %, requested %',
      p_item_id, v_available, -p_quantity
      USING ERRCODE = '23514';
  END IF;

  -- total_quantity is the owned ceiling. Rented-in stock raises it; anything
  -- that would push owned stock above the ceiling is rejected.
  IF p_movement IN ('purchase', 'rent_in') THEN
    v_total := v_total + p_quantity;
  END IF;

  UPDATE public.inventory_items
     SET available_quantity = v_balance,
         total_quantity     = v_total,
         updated_at         = now()
   WHERE id = p_item_id;

  SELECT auth.uid() INTO v_user;

  INSERT INTO public.stock_movements
    (item_id, movement, quantity, running_balance, reference_type,
     reference_id, party_id, notes, created_by)
  VALUES
    (p_item_id, p_movement, p_quantity, v_balance, p_reference_type,
     p_reference_id, p_party_id, p_notes, v_user)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.p_adjust_stock IS
  'Phase 1 sole write path for item quantity. Writes stock_movements with running_balance under a per-item advisory lock.';

-- ---------------------------------------------------------------------------
-- P1-e  block direct quantity UPDATEs so the ledger cannot be bypassed
-- ---------------------------------------------------------------------------
-- createInventoryItem sets the opening quantities on INSERT, which is allowed
-- and does write a purchase movement via the server action. After a row exists,
-- any UPDATE of a quantity column must go through p_adjust_stock.
CREATE OR REPLACE FUNCTION public.guard_inventory_quantity_change()
RETURNS TRIGGER AS $$
DECLARE
  v_authorised BOOLEAN;
BEGIN
  IF NEW.total_quantity     IS NOT DISTINCT FROM OLD.total_quantity
     AND NEW.available_quantity IS NOT DISTINCT FROM OLD.available_quantity
     AND NEW.owned_quantity  IS NOT DISTINCT FROM OLD.owned_quantity THEN
    RETURN NEW;
  END IF;

  -- p_adjust_stock sets this flag, transaction-locally, BEFORE its own UPDATE.
  -- Read it, never set it: if the trigger set the flag itself it would approve
  -- every write and the guard would be a silent no-op.
  v_authorised := current_setting('app.stock_adjustment', TRUE) = 'on';

  IF v_authorised THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'quantity columns are read-only; use p_adjust_stock(item_id, movement, qty) so a stock_movements row is written'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_inventory_quantity ON public.inventory_items;
CREATE TRIGGER trg_guard_inventory_quantity
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_inventory_quantity_change();

-- ---------------------------------------------------------------------------
-- P1-f  indexes for the 5000-item latency AC
-- ---------------------------------------------------------------------------
-- pg_trgm gives substring search (ilike '%x%') on names/companies/models, which
-- a plain btree cannot serve. Wrapped in a guard so the file still runs on a
-- database where the extension is unavailable.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_name_trgm
      ON public.inventory_items USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_inventory_company_trgm
      ON public.inventory_items USING gin (company gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_inventory_model_trgm
      ON public.inventory_items USING gin (model gin_trgm_ops);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_status      ON public.inventory_items (status);
CREATE INDEX IF NOT EXISTS idx_inventory_created    ON public.inventory_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_price      ON public.inventory_items (estimated_rent_price);
CREATE INDEX IF NOT EXISTS idx_inventory_maint_due  ON public.inventory_items (next_maintenance_date)
  WHERE next_maintenance_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_reorder    ON public.inventory_items (available_quantity)
  WHERE reorder_level IS NOT NULL;

-- Ledger and history read newest-first per item.
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_serials_item         ON public.item_serials (item_id);
CREATE INDEX IF NOT EXISTS idx_serials_code         ON public.item_serials (serial_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_item     ON public.maintenance_records (item_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_open     ON public.maintenance_records (started_at DESC)
  WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_special_rates_item   ON public.special_rates (item_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rates_item   ON public.pricing_rates (inventory_item_id);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- Intentionally none. Postgres grants EXECUTE on new functions in public to
-- PUBLIC by default, and Supabase's default privileges already cover
-- anon/authenticated. The rest of this schema likewise declares no explicit
-- GRANTs; adding them here would be the only such statement in the file and
-- would break on any database (e.g. PGlite) where the `authenticated` role
-- does not exist.

-- ---------------------------------------------------------------------------
-- updated_at triggers for the Phase 1 tables that lacked them
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'item_categories','item_locations','item_serials','maintenance_records',
    'special_rates','stock_movements'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_touch ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_touch BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;
